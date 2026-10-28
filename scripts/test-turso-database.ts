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
  getTursoDocument,
  importMigratedDocuments,
  initializeTursoDatabase,
  listTursoDocuments,
} = await import('../backend/db/tursoDatabase');
const {
  authenticateAdminCredentials,
  requireAdminSession,
  revokeAdminSessions,
  hashAdminPassword,
} = await import('../backend/auth/adminCredentialAuth');
const {
  authorizeDatabaseAction,
  handleTursoAction,
  requiresAdminForDatabaseAction,
  requiresSuperAdminForDatabaseAction,
  compactPublicImageDocument,
  sanitizePublicSettingsDocument,
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
    assert.deepEqual(identity, { uid: 'test-customer-1', email: 'customer@example.com', accountEmail: 'customer@example.com' });
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
    // An unverified email is kept only as the account's own address, never as `email`
    // (the field access checks use).
    assert.deepEqual(unverifiedIdentity, { uid: 'unverified-customer', accountEmail: 'customer@example.com' });
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
    assert.equal(
      (await authorizeDatabaseAction({
        action: 'get',
        collection: 'system_metadata',
        parentPath: '',
        id: 'deleted_media',
      }, undefined)).role,
      'public'
    );
    await assert.rejects(
      () => authorizeDatabaseAction({
        action: 'get',
        collection: 'system_metadata',
        parentPath: '',
        id: 'private_config',
      }, undefined),
      /An administrator session is required/
    );
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'system_metadata' }, undefined),
      /An administrator session is required/
    );
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'media_blobs' }, undefined),
      /An administrator session is required/
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
    let adminCookie = login.cookie.split(';')[0];
    assert.equal((await requireAdminSession(adminCookie)).user.role, 'super_admin');
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

    // Signing out ends every session issued before it; a new sign-in works straight away.
    await revokeAdminSessions();
    await assert.rejects(() => requireAdminSession(adminCookie), /signed out/);
    const freshCookie = authenticateAdminCredentials(
      process.env.ADMIN_LOGIN_EMAIL,
      'local-test-admin-password',
      'test-runner-2'
    ).cookie.split(';')[0];
    assert.equal((await requireAdminSession(freshCookie)).user.role, 'super_admin');
    adminCookie = freshCookie;
    await importMigratedDocuments('analyticsEvents', [
      { id: 'cursor-event-04', data: { timestamp: '2025-04-04T00:00:00.000Z' } },
      { id: 'cursor-event-03', data: { timestamp: '2025-03-03T00:00:00.000Z' } },
      { id: 'cursor-event-02', data: { timestamp: '2025-03-03T00:00:00.000Z' } },
      { id: 'cursor-event-01', data: { timestamp: '2025-01-01T00:00:00.000Z' } },
    ]);
    const firstAnalyticsPage = await listTursoDocuments(
      'analyticsEvents',
      '',
      [],
      { field: 'timestamp', direction: 'desc' },
      2
    );
    const secondAnalyticsPage = await listTursoDocuments(
      'analyticsEvents',
      '',
      [],
      { field: 'timestamp', direction: 'desc' },
      2,
      firstAnalyticsPage.at(-1)?.id,
      undefined,
      firstAnalyticsPage.at(-1)?.data.timestamp as string
    );
    assert.deepEqual(
      [...firstAnalyticsPage, ...secondAnalyticsPage].map((event) => event.id),
      ['cursor-event-04', 'cursor-event-03', 'cursor-event-02', 'cursor-event-01']
    );
    await importMigratedDocuments('services', [
      { id: 'division-filter-primary', data: { division: 'sws' } },
      { id: 'division-filter-legacy', data: { divisionId: 'u1' } },
      { id: 'division-filter-other', data: { division: 'it' } },
    ]);
    const divisionFilterResult = await handleTursoAction({
      action: 'list',
      collection: 'services',
      filterGroups: [
        [{ field: 'division', operator: 'in', value: ['sws'] }],
        [{ field: 'divisionId', operator: 'in', value: ['u1'] }],
      ],
    }, { role: 'public' });
    assert.equal(divisionFilterResult.status, 200);
    assert.deepEqual(
      (divisionFilterResult.body.documents as Array<{ id: string }>).map(({ id }) => id).sort(),
      ['division-filter-legacy', 'division-filter-primary']
    );

    const publicSettingsAccess = await authorizeDatabaseAction(
      { action: 'list', collection: 'settings' },
      undefined
    );
    await call({
      action: 'write',
      write: {
        type: 'set',
        collection: 'settings',
        id: 'public-settings-test',
        data: {
          companyName: 'Public Company',
          superAdminEmail: 'private@example.com',
          superAdminName: 'Private Administrator',
          testTimestamp: 'private test timestamp',
          dailyBackupEnabled: true,
          enableStockAlertEmails: true,
          nested: { testWrite: 'private test value', publicLabel: 'Public label' },
        },
      },
    });
    const publicSettings = await handleTursoAction({
      action: 'get',
      collection: 'settings',
      id: 'public-settings-test',
    }, publicSettingsAccess);
    const publicSettingsData = (publicSettings.body.document as {
      data: Record<string, unknown>;
    }).data;
    assert.equal(publicSettingsData.companyName, 'Public Company');
    assert.equal(publicSettingsData.superAdminEmail, undefined);
    assert.equal(publicSettingsData.superAdminName, undefined);
    assert.equal(publicSettingsData.testTimestamp, undefined);
    assert.equal(publicSettingsData.dailyBackupEnabled, undefined);
    assert.equal(publicSettingsData.enableStockAlertEmails, undefined);
    assert.deepEqual(publicSettingsData.nested, { publicLabel: 'Public label' });
    const privateSettings = await handleTursoAction({
      action: 'get',
      collection: 'settings',
      id: 'public-settings-test',
    });
    assert.equal(
      (privateSettings.body.document as { data: Record<string, unknown> }).data.superAdminEmail,
      'private@example.com'
    );
    const filteredSettingsList = await handleTursoAction({
      action: 'list',
      collection: 'settings',
    }, publicSettingsAccess);
    assert.ok((filteredSettingsList.body.documents as Array<{ id: string }>).some(
      ({ id }) => id === 'public-settings-test'
    ));
    const filteredListRecord = (filteredSettingsList.body.documents as Array<{
      id: string;
      data: Record<string, unknown>;
    }>).find(({ id }) => id === 'public-settings-test');
    assert.equal(filteredListRecord?.data.superAdminEmail, undefined);
    assert.deepEqual(filteredListRecord?.data.nested, { publicLabel: 'Public label' });
    const multiReadRequest = {
      action: 'multiRead',
      requests: [
        { action: 'list', collection: 'services' },
        { action: 'get', collection: 'settings', id: 'public-settings-test' },
      ],
    };
    const multiReadAccess = await authorizeDatabaseAction(multiReadRequest, undefined);
    assert.equal(multiReadAccess.role, 'public');
    const multiReadResult = await handleTursoAction(multiReadRequest, multiReadAccess);
    assert.equal(multiReadResult.status, 200);
    const multiReadBodies = multiReadResult.body.results as Array<{
      status: number;
      body: { document?: { data: Record<string, unknown> } };
    }>;
    assert.equal(multiReadBodies.length, 2);
    assert.equal(multiReadBodies[0].status, 200);
    assert.equal(multiReadBodies[1].body.document?.data.superAdminEmail, undefined);
    await assert.rejects(
      () => authorizeDatabaseAction({
        action: 'multiRead',
        requests: [{ action: 'list', collection: 'careerApplications' }],
      }, undefined),
      /Invalid public read batch/
    );
    const filteredNestedRecord = sanitizePublicSettingsDocument({
      id: 'nested-settings-test',
      data: { dailyBackupEnabled: true, details: [{ enableStockAlertEmails: true, title: 'Public' }] },
    });
    assert.deepEqual(filteredNestedRecord.data, { details: [{ title: 'Public' }] });
    const duplicatedImage = 'data:image/webp;base64,AAAA';
    const compactGallery = compactPublicImageDocument('gallery', {
      id: 'gallery-compact-test',
      data: {
        images: [duplicatedImage],
        url: duplicatedImage,
        mediaUrl: duplicatedImage,
        thumbnailUrl: duplicatedImage,
      },
    });
    assert.deepEqual(compactGallery.data, { images: [duplicatedImage] });
    const compactService = compactPublicImageDocument('services', {
      id: 'service-compact-test',
      data: {
        imageUrl: duplicatedImage,
        images: [duplicatedImage],
        url: duplicatedImage,
      },
    });
    assert.deepEqual(compactService.data, { imageUrl: duplicatedImage, images: [] });
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'services', id: 'svc-1' },
    }), true);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'contactSubmissions', id: 'msg-1' },
    }), false);
    assert.equal(requiresAdminForDatabaseAction({ action: 'list', collection: 'careerApplications' }), true);
    assert.equal(requiresAdminForDatabaseAction({ action: 'get', collection: 'careerApplications' }), true);
    assert.equal(requiresAdminForDatabaseAction({ action: 'list', collection: 'analyticsEvents' }), true);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'analyticsEvents', id: 'event_session01_view01' },
    }), false);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'careerApplications', id: 'application-1' },
    }), false);
    assert.equal(requiresAdminForDatabaseAction({
      action: 'write',
      write: { type: 'set', collection: 'careerOpenings', id: 'opening-1' },
    }), true);
    assert.equal(requiresAdminForDatabaseAction({ action: 'list', collection: 'careerOpenings' }), false);
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
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'careerApplications' }, undefined),
      /An administrator session is required/
    );
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'list', collection: 'analyticsEvents' }, undefined),
      /An administrator session is required/
    );
    const publicAnalyticsWrite = {
      action: 'write',
      write: {
        type: 'set',
        collection: 'analyticsEvents',
        id: 'event_session01_view01',
        data: {
          type: 'page_view',
          path: '/services',
          title: 'Services',
          sessionId: 'session_test_0001',
          divisionId: 'sws',
          metadata: { referrerHost: 'Direct', deviceType: 'desktop' },
        },
      },
    };
    const publicAnalyticsAccess = await authorizeDatabaseAction(publicAnalyticsWrite, undefined);
    assert.equal(publicAnalyticsAccess.role, 'public');
    const savedAnalyticsEvent = await handleTursoAction(publicAnalyticsWrite, publicAnalyticsAccess);
    assert.equal(savedAnalyticsEvent.status, 200);
    assert.equal(
      (await getTursoDocument('analyticsEvents', '', 'event_session01_view01'))?.data.type,
      'page_view'
    );
    const invalidAnalyticsEvent = await handleTursoAction({
      ...publicAnalyticsWrite,
      write: {
        ...(publicAnalyticsWrite.write as Record<string, unknown>),
        id: 'event_session01_view02',
        data: {
          ...(publicAnalyticsWrite.write as { data: Record<string, unknown> }).data,
          path: '/services?email=private@example.com',
        },
      },
    }, publicAnalyticsAccess);
    assert.equal(invalidAnalyticsEvent.status, 400);
    await assert.rejects(
      () => authorizeDatabaseAction({
        action: 'write',
        write: { type: 'set', collection: 'careerApplications', id: 'application-1', merge: true },
      }, undefined),
      /An administrator session is required/
    );

    const openingRecords = [
      { id: 'career-opening-published', data: { title: 'Producer', status: 'published' } },
      { id: 'career-opening-draft', data: { title: 'Editor', status: 'draft' } },
    ];
    for (const opening of openingRecords) {
      await call({
        action: 'write',
        write: { type: 'set', collection: 'careerOpenings', id: opening.id, data: opening.data },
      });
    }
    const publicOpenings = await handleTursoAction(
      { action: 'list', collection: 'careerOpenings' },
      { role: 'public' }
    );
    assert.equal(publicOpenings.status, 200);
    assert.deepEqual(
      (publicOpenings.body.documents as Array<{ id: string }>).map(({ id }) => id),
      ['career-opening-published']
    );

    const applicationId = '123e4567-e89b-12d3-a456-426614174001';
    const publicApplicationWrite = {
      action: 'write',
      write: {
        type: 'set',
        collection: 'careerApplications',
        id: applicationId,
        data: {
          openingId: 'career-opening-published',
          candidateName: 'Taylor Candidate',
          email: 'taylor@example.com',
          phone: '+94771234567',
          coverLetter: 'Experienced producer.',
          cvStoragePath: 'career-cvs/123e4567-e89b-12d3-a456-426614174000_taylor-cv.pdf',
          cvFileName: 'taylor-cv.pdf',
        },
      },
    };
    const publicApplicationAccess = await authorizeDatabaseAction(publicApplicationWrite, undefined);
    assert.equal(publicApplicationAccess.role, 'public');
    const publicApplicationResult = await handleTursoAction(publicApplicationWrite, publicApplicationAccess);
    assert.equal(publicApplicationResult.status, 200);
    assert.equal(publicApplicationResult.body.reference, 'mahdev-app-001');
    assert.equal(
      (await getTursoDocument('careerApplications', '', applicationId))?.data.reference,
      'mahdev-app-001'
    );
    assert.equal(
      (await listTursoDocuments(
        'careerApplications',
        '',
        [{ field: 'reference', operator: '==', value: 'mahdev-app-001' }],
        undefined,
        1
      ))[0]?.id,
      applicationId
    );
    assert.equal(
      (await getTursoDocument('careerApplications', '', applicationId))?.data.status,
      'new'
    );
    assert.equal(
      (await getTursoDocument('careerApplications', '', applicationId))?.data.portfolioUrl,
      ''
    );
    const concurrentApplicationResults = await Promise.all(
      ['123e4567-e89b-12d3-a456-426614174007', '123e4567-e89b-12d3-a456-426614174008']
        .map((id) => handleTursoAction({
          ...publicApplicationWrite,
          write: {
            ...(publicApplicationWrite.write as Record<string, unknown>),
            id,
          },
        }, publicApplicationAccess))
    );
    assert.deepEqual(
      concurrentApplicationResults.map((result) => result.body.reference).sort(),
      ['mahdev-app-002', 'mahdev-app-003']
    );
    const extraFieldResult = await handleTursoAction({
      ...publicApplicationWrite,
      write: {
        ...(publicApplicationWrite.write as Record<string, unknown>),
        id: '123e4567-e89b-12d3-a456-426614174002',
        data: {
          ...((publicApplicationWrite.write as { data: Record<string, unknown> }).data),
          extraField: 'not permitted',
        },
      },
    }, publicApplicationAccess);
    assert.equal(extraFieldResult.status, 400);
    const draftOpeningResult = await handleTursoAction({
        ...publicApplicationWrite,
        write: {
          ...(publicApplicationWrite.write as Record<string, unknown>),
          id: '123e4567-e89b-12d3-a456-426614174003',
          data: {
            ...((publicApplicationWrite.write as { data: Record<string, unknown> }).data),
            openingId: 'career-opening-draft',
          },
        },
      }, publicApplicationAccess);
    assert.equal(draftOpeningResult.status, 400);
    const invalidEmailResult = await handleTursoAction({
      ...publicApplicationWrite,
      write: {
        ...(publicApplicationWrite.write as Record<string, unknown>),
        id: '123e4567-e89b-12d3-a456-426614174004',
        data: {
          ...((publicApplicationWrite.write as { data: Record<string, unknown> }).data),
          email: 'not-an-email',
        },
      },
    }, publicApplicationAccess);
    assert.equal(invalidEmailResult.status, 400);
    const invalidPortfolioUrlResult = await handleTursoAction({
      ...publicApplicationWrite,
      write: {
        ...(publicApplicationWrite.write as Record<string, unknown>),
        id: '123e4567-e89b-12d3-a456-426614174005',
        data: {
          ...((publicApplicationWrite.write as { data: Record<string, unknown> }).data),
          portfolioUrl: 'javascript:alert(1)',
        },
      },
    }, publicApplicationAccess);
    assert.equal(invalidPortfolioUrlResult.status, 400);
    const validPortfolioUrlResult = await handleTursoAction({
      ...publicApplicationWrite,
      write: {
        ...(publicApplicationWrite.write as Record<string, unknown>),
        id: '123e4567-e89b-12d3-a456-426614174006',
        data: {
          ...((publicApplicationWrite.write as { data: Record<string, unknown> }).data),
          portfolioUrl: 'https://example.com/portfolio',
        },
      },
    }, publicApplicationAccess);
    assert.equal(validPortfolioUrlResult.status, 200);
    const adminSessionApplicationId = '123e4567-e89b-12d3-a456-426614174009';
    const adminSessionApplicationResult = await handleTursoAction({
      ...publicApplicationWrite,
      write: {
        ...(publicApplicationWrite.write as Record<string, unknown>),
        id: adminSessionApplicationId,
      },
    }, { role: 'admin' });
    assert.equal(adminSessionApplicationResult.status, 200);
    assert.match(String(adminSessionApplicationResult.body.reference), /^mahdev-app-\d{3,}$/);
    assert.equal(
      (await getTursoDocument('careerApplications', '', adminSessionApplicationId))?.data.reference,
      adminSessionApplicationResult.body.reference
    );
    const adminApplicationRead = await authorizeDatabaseAction(
      { action: 'list', collection: 'careerApplications' },
      adminCookie
    );
    assert.equal(adminApplicationRead.role, 'admin');
    const adminApplicationUpdate = {
      action: 'write',
      write: {
        type: 'set',
        collection: 'careerApplications',
        id: applicationId,
        merge: true,
        data: { status: 'reviewing' },
      },
    };
    const adminApplicationAccess = await authorizeDatabaseAction(adminApplicationUpdate, adminCookie);
    const adminApplicationUpdateResult = await handleTursoAction(
      adminApplicationUpdate,
      adminApplicationAccess
    );
    assert.equal(adminApplicationUpdateResult.status, 200);
    assert.equal(
      (await getTursoDocument('careerApplications', '', applicationId))?.data.status,
      'reviewing'
    );
    const privateApplications = await handleTursoAction(
      { action: 'list', collection: 'careerApplications' },
      { role: 'admin' }
    );
    assert.equal(privateApplications.status, 200);
    assert.equal((privateApplications.body.documents as Array<{ id: string }>).length, 5);
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
