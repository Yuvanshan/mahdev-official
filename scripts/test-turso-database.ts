import assert from 'node:assert/strict';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const databasePath = path.join(tmpdir(), `mahdev-turso-test-${process.pid}.db`);
process.env.TURSO_DATABASE_URL = `file:${databasePath}`;
process.env.TURSO_AUTH_TOKEN = 'local-test-token';

const {
  ensureCollectionTable,
  getTursoClient,
  importMigratedDocuments,
  initializeTursoDatabase,
} = await import('../backend/db/tursoDatabase');
const {
  authenticateAdminCredentials,
  getAdminSessionFromCookie,
  hashAdminPassword,
} = await import('../backend/auth/adminCredentialAuth');
const {
  authorizeDatabaseAction,
  handleTursoAction,
  requiresAdminForDatabaseAction,
  requiresSuperAdminForDatabaseAction,
} = await import('../backend/api/tursoRoutes');
const { FirebaseTokenError, verifyFirebaseIdToken } = await import('../backend/auth/firebaseIdToken');
const {
  getDatabaseStatus,
  listPublicCollection,
  runMigrations,
} = await import('../backend/db');

async function call(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const result = await handleTursoAction(body);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  return result.body;
}

async function removeIfPresent(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

async function run(): Promise<void> {
  try {
    const originalFetch = globalThis.fetch;
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    globalThis.fetch = async () => new Response(
      JSON.stringify({ 'local-test-key': publicKeyPem }),
      { status: 200, headers: { 'cache-control': 'public, max-age=60' } }
    );
    const now = Math.floor(Date.now() / 1000);
    const tokenHeader = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'local-test-key' })).toString('base64url');
    const tokenClaims = Buffer.from(JSON.stringify({
      aud: 'for-her-33ea9',
      auth_time: now,
      exp: now + 3600,
      iat: now,
      iss: 'https://securetoken.google.com/for-her-33ea9',
      sub: 'test-customer-1',
      email: 'customer@example.com',
      email_verified: true,
    })).toString('base64url');
    const signer = createSign('RSA-SHA256');
    signer.update(`${tokenHeader}.${tokenClaims}`);
    signer.end();
    const token = `${tokenHeader}.${tokenClaims}.${signer.sign(privateKey).toString('base64url')}`;
    const identity = await verifyFirebaseIdToken(`Bearer ${token}`);
    assert.deepEqual(identity, { uid: 'test-customer-1', email: 'customer@example.com' });
    const unverifiedClaims = Buffer.from(JSON.stringify({
      aud: 'for-her-33ea9',
      auth_time: now,
      exp: now + 3600,
      iat: now,
      iss: 'https://securetoken.google.com/for-her-33ea9',
      sub: 'unverified-customer',
      email: 'customer@example.com',
      email_verified: false,
    })).toString('base64url');
    const unverifiedSigner = createSign('RSA-SHA256');
    unverifiedSigner.update(`${tokenHeader}.${unverifiedClaims}`);
    unverifiedSigner.end();
    const unverifiedToken = `${tokenHeader}.${unverifiedClaims}.${unverifiedSigner.sign(privateKey).toString('base64url')}`;
    const unverifiedIdentity = await verifyFirebaseIdToken(`Bearer ${unverifiedToken}`);
    assert.deepEqual(unverifiedIdentity, { uid: 'unverified-customer' });
    await assert.rejects(
      () => verifyFirebaseIdToken(undefined),
      FirebaseTokenError
    );
    const customerAccess = await authorizeDatabaseAction(
      { action: 'list', collection: 'orders' },
      undefined,
      `Bearer ${token}`
    );
    assert.equal(customerAccess.role, 'customer');
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'orders' }, undefined),
      FirebaseTokenError
    );
    assert.equal(
      (await authorizeDatabaseAction({ action: 'list', collection: 'products' }, undefined)).role,
      'public'
    );
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'users' }, undefined),
      FirebaseTokenError
    );
    globalThis.fetch = originalFetch;

    process.env.ADMIN_LOGIN_EMAIL = 'test-admin@example.com';
    process.env.ADMIN_SESSION_SECRET = 'test-only-session-signing-secret-with-at-least-32-bytes';
    process.env.ADMIN_LOGIN_PASSWORD_HASH = hashAdminPassword('local-test-admin-password');
    const login = authenticateAdminCredentials(
      process.env.ADMIN_LOGIN_EMAIL,
      'local-test-admin-password',
      'test-runner'
    );
    const adminCookie = login.cookie.split(';')[0];
    assert.equal(getAdminSessionFromCookie(adminCookie).user.role, 'super_admin');
    assert.throws(
      () => authenticateAdminCredentials(process.env.ADMIN_LOGIN_EMAIL, 'incorrect-password', 'test-runner'),
      /Invalid admin email or password/
    );

    await initializeTursoDatabase();
    const migration = await runMigrations();
    const databaseStatus = await getDatabaseStatus();
    assert.equal(migration.connected, true);
    assert.ok(migration.collections >= 35, 'Expected the backend migration to provision core collections.');
    assert.equal(databaseStatus.database, 'turso');
    assert.equal(databaseStatus.status, 'ready');
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'services', id: 'svc-1' },
    }), true);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'contactSubmissions', id: 'msg-1' },
    }), false);
    for (const collection of ['contactSubmissions', 'inquiries', 'quoteRequests']) {
      assert.equal(requiresAdminForDatabaseAction({ action: 'list', collection }), true);
      assert.equal(requiresAdminForDatabaseAction({ action: 'get', collection }), true);
    }
    assert.equal(requiresSuperAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'admins', id: 'admin-1' },
    }), true);
    assert.equal(requiresSuperAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'services', id: 'svc-1' },
    }), false);
    await assert.rejects(
      () => authorizeDatabaseAction({
        action: 'write',
        write: { type: 'set', collection: 'services', id: 'svc-1' },
      }, undefined),
      /An administrator session is required/
    );
    await authorizeDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'services', id: 'svc-1' },
    }, adminCookie);
    await authorizeDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'admins', id: 'admin-1' },
    }, adminCookie);
    const metadata = await getTursoClient().execute(
      'SELECT COUNT(*) AS count FROM turso_collections'
    );
    assert.ok(Number(metadata.rows[0].count) >= 35, 'Expected one SQL table per known collection.');
    const cmsCollections = await getTursoClient().execute(
      "SELECT collection_path FROM turso_collections WHERE collection_path IN ('banners', 'coupons', 'packages', 'pages')"
    );
    assert.deepEqual(
      cmsCollections.rows.map((row) => String(row.collection_path)).sort(),
      ['banners', 'coupons', 'packages', 'pages']
    );

    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'products',
        parentPath: '',
        id: 'turso-test-product',
        data: { division: 'it', deletedIds: { __tursoArrayUnion: ['first'] } },
        merge: true,
      },
    });
    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'products',
        parentPath: '',
        id: 'turso-test-product',
        data: { deletedIds: { __tursoArrayUnion: ['second', 'first'] } },
        merge: true,
      },
    });

    const queryResult = await call({
      action: 'list',
      collection: 'products',
      parentPath: '',
      filters: [{ field: 'division', operator: '==', value: 'it' }],
      limit: 10,
    });
    const queriedDocuments = queryResult.documents as Array<{
      id: string;
      data: Record<string, unknown>;
    }>;
    const product = queriedDocuments.find((document) => document.id === 'turso-test-product');
    assert.ok(product, 'Expected to find the filtered product.');
    assert.deepEqual(product.data.deletedIds, ['first', 'second']);
    const publicProducts = await listPublicCollection('products');
    assert.ok(publicProducts.some((document) => document.id === 'turso-test-product'));
    const skippedExisting = await importMigratedDocuments('products', [{
      id: 'turso-test-product',
      data: { division: 'overwritten-value' },
    }]);
    assert.deepEqual(skippedExisting, { inserted: 0, overwritten: 0, skipped: 1 });
    const productTable = await ensureCollectionTable('products');
    const preservedProduct = await getTursoClient().execute({
      sql: `SELECT data FROM "${productTable}" WHERE id = ?`,
      args: ['turso-test-product'],
    });
    assert.equal(
      (JSON.parse(String(preservedProduct.rows[0].data)) as Record<string, unknown>).division,
      'it'
    );
    const explicitOverwrite = await importMigratedDocuments('products', [{
      id: 'turso-test-product',
      data: { division: 'explicit-overwrite' },
    }], true);
    assert.deepEqual(explicitOverwrite, { inserted: 0, overwritten: 1, skipped: 0 });
    const overwrittenProduct = await getTursoClient().execute({
      sql: `SELECT data FROM "${productTable}" WHERE id = ?`,
      args: ['turso-test-product'],
    });
    assert.equal(
      (JSON.parse(String(overwrittenProduct.rows[0].data)) as Record<string, unknown>).division,
      'explicit-overwrite'
    );

    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'orders',
        id: 'owned-order',
        data: { customerId: 'test-customer-1', total: 10 },
      },
    });
    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'orders',
        id: 'other-order',
        data: { customerId: 'different-customer', total: 20 },
      },
    });
    const customerOrders = await handleTursoAction({
      action: 'list',
      collection: 'orders',
      parentPath: '',
    }, customerAccess);
    assert.deepEqual(
      (customerOrders.body.documents as Array<{ id: string }>).map(({ id }) => id),
      ['owned-order']
    );
    const forgedOrder = await handleTursoAction({
      action: 'write',
      write: {
        type: 'set',
        collection: 'orders',
        id: 'customer-created-order',
        data: {
          customerId: 'other-customer',
          paymentStatus: 'paid',
          status: 'completed',
          total: 40,
        },
      },
    }, customerAccess);
    assert.equal(forgedOrder.status, 200);
    const persistedOrder = await getTursoClient().execute({
      sql: `SELECT data FROM "${await ensureCollectionTable('orders')}" WHERE id = ?`,
      args: ['customer-created-order'],
    });
    const persistedOrderData = JSON.parse(String(persistedOrder.rows[0].data)) as Record<string, unknown>;
    assert.equal(persistedOrderData.customerId, 'test-customer-1');
    assert.equal(persistedOrderData.paymentStatus, 'unpaid');
    assert.equal(persistedOrderData.status, 'pending_payment');
    const publicBookingAccess = await authorizeDatabaseAction({
      action: 'write',
      write: {
        type: 'set',
        collection: 'bookings',
        id: 'public-booking',
        data: {
          customerId: 'spoofed-user',
          customerEmail: 'customer@example.com',
          email: 'customer@example.com',
          customer: { name: 'Impersonator', email: 'customer@example.com' },
          status: 'completed',
          paymentStatus: 'paid',
        },
      },
    }, undefined);
    assert.equal(publicBookingAccess.role, 'public');
    const publicBooking = await handleTursoAction({
      action: 'write',
      write: {
        type: 'set',
        collection: 'bookings',
        id: 'public-booking',
        data: {
          customerId: 'spoofed-user',
          customerEmail: 'customer@example.com',
          email: 'customer@example.com',
          customer: { name: 'Impersonator', email: 'customer@example.com' },
          status: 'completed',
          paymentStatus: 'paid',
        },
      },
    }, publicBookingAccess);
    assert.equal(publicBooking.status, 200);
    const storedBooking = await getTursoClient().execute({
      sql: `SELECT data FROM "${await ensureCollectionTable('bookings')}" WHERE id = ?`,
      args: ['public-booking'],
    });
    const storedBookingData = JSON.parse(String(storedBooking.rows[0].data)) as Record<string, unknown>;
    assert.equal(storedBookingData.customerId, undefined);
    assert.equal(storedBookingData.customerEmail, undefined);
    assert.equal(storedBookingData.email, undefined);
    assert.equal((storedBookingData.customer as Record<string, unknown>).email, undefined);
    assert.equal(storedBookingData.paymentStatus, 'unpaid');
    assert.equal(storedBookingData.status, 'pending');
    const customerBookings = await handleTursoAction({
      action: 'list',
      collection: 'bookings',
      parentPath: '',
    }, customerAccess);
    assert.deepEqual(customerBookings.body.documents, []);

    const publicInquiryWrite = {
      action: 'write',
      write: {
        type: 'set',
        collection: 'inquiries',
        id: 'website-live-inquiry',
        data: {
          name: 'Website Customer',
          email: 'customer@example.com',
          subject: 'Realtime inbox check',
          message: 'A test enquiry persisted through the public submission path.',
          status: 'new',
        },
      },
    };
    const publicInquiryAccess = await authorizeDatabaseAction(publicInquiryWrite, undefined);
    assert.equal(publicInquiryAccess.role, 'public');
    const inquiryWriteResult = await handleTursoAction(publicInquiryWrite, publicInquiryAccess);
    assert.equal(inquiryWriteResult.status, 200);
    const savedInquiry = await handleTursoAction({
      action: 'get',
      collection: 'inquiries',
      parentPath: '',
      id: 'website-live-inquiry',
    });
    assert.deepEqual(
      (savedInquiry.body.document as { data: Record<string, unknown> }).data.subject,
      'Realtime inbox check'
    );

    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'media_blobs/chunks',
        parentPath: 'media_blobs/test-blob',
        id: '0000',
        data: { value: 'chunk' },
      },
    });
    const nestedResult = await call({
      action: 'get',
      collection: 'media_blobs/chunks',
      parentPath: 'media_blobs/test-blob',
      id: '0000',
    });
    assert.deepEqual(nestedResult.document, {
      id: '0000',
      data: { value: 'chunk' },
    });

    await call({
      action: 'batch',
      writes: [
        {
          type: 'delete',
          collection: 'products',
          parentPath: '',
          id: 'turso-test-product',
        },
        {
          type: 'delete',
          collection: 'media_blobs/chunks',
          parentPath: 'media_blobs/test-blob',
          id: '0000',
        },
      ],
    });
    console.info('[Turso] Local schema, CRUD, JSON query, nested collection, arrayUnion and batch tests passed.');
  } finally {
    await getTursoClient().close();
    await Promise.all([
      removeIfPresent(databasePath),
      removeIfPresent(`${databasePath}-wal`),
      removeIfPresent(`${databasePath}-shm`),
    ]);
  }
}

run().catch((error: unknown) => {
  console.error('[Turso] Database adapter tests failed:', error);
  process.exitCode = 1;
});
