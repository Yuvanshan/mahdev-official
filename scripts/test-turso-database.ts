import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const databasePath = path.join(tmpdir(), `mahdev-turso-test-${process.pid}.db`);
process.env.TURSO_DATABASE_URL = `file:${databasePath}`;
process.env.TURSO_AUTH_TOKEN = 'local-test-token';

const { getTursoClient, initializeTursoDatabase } = await import('../server/tursoDatabase');
const {
  authenticateAdminCredentials,
  getAdminSessionFromCookie,
  hashAdminPassword,
} = await import('../server/adminCredentialAuth');
const {
  authorizeDatabaseAction,
  handleTursoAction,
  requiresAdminForDatabaseAction,
  requiresSuperAdminForDatabaseAction,
} = await import('../server/tursoRoutes');

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
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'services', id: 'svc-1' },
    }), true);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'contactSubmissions', id: 'msg-1' },
    }), false);
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
      /An admin session is required/
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
