// TypeScript (run with tsx): tests for the public snapshot, SEO page shell,
// rate limiting, batched analytics, order price verification and hardened
// admin auth. Uses a throwaway local SQLite file, never the real database.
import assert from 'node:assert/strict';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

const databasePath = path.join(tmpdir(), `mahdev-public-api-test-${process.pid}.db`);
process.env.TURSO_DATABASE_URL = `file:${databasePath}`;
process.env.TURSO_AUTH_TOKEN = 'local-test-token';
// These tests exercise the Vercel serverless API, where the platform sets the client IP headers.
process.env.VERCEL = '1';
delete process.env.ADMIN_LOGIN_EMAIL;
delete process.env.ADMIN_LOGIN_PASSWORD_HASH;
delete process.env.ADMIN_SESSION_SECRET;

const { initializeTursoDatabase, writeTursoBatch, listTursoDocuments } = await import('../backend/db/tursoDatabase');
const { handleTursoAction, authorizeDatabaseAction } = await import('../backend/api/tursoRoutes');
const { default: publicSnapshotHandler, publicInlineMediaHandler } = await import('../backend/api/handlers/publicSnapshot');
const { default: pageShellHandler } = await import('../backend/api/handlers/pageShell');
const { default: apiDispatcher } = await import('../api/[...path]');
const { default: analyticsHandler } = await import('../backend/api/handlers/analytics');
const { default: adminLoginHandler } = await import('../backend/api/handlers/admin/auth/login');
const { consumeRateLimit, RateLimitError } = await import('../backend/security/rateLimit');
const { querySnapshotDocuments, filterSnapshotDocuments } = await import('../src/lib/publicSnapshotQuery');

// Minimal request/response doubles for the Node handlers.
function makeReq(options: { method?: string; url?: string; headers?: Record<string, string>; body?: unknown; raw?: string }) {
  const stream = Readable.from(options.raw !== undefined ? [Buffer.from(options.raw)] : []) as any;
  stream.method = options.method || 'GET';
  stream.url = options.url || '/';
  stream.headers = { 'x-real-ip': '203.0.113.7', ...(options.headers || {}) };
  stream.socket = { remoteAddress: '203.0.113.7' };
  if (options.body !== undefined) stream.body = options.body;
  return stream;
}
function makeRes() {
  const res: any = { statusCode: 200, headers: {} as Record<string, string>, body: '' };
  res.setHeader = (k: string, v: string) => { res.headers[k.toLowerCase()] = v; };
  res.end = (chunk?: string) => { res.body = chunk || ''; };
  return res;
}

// A real (tiny) PNG padded past the inline-image threshold, as stored in records.
const LOGO_BYTES = Buffer.concat([
  Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489', 'hex'),
  Buffer.alloc(2048, 7),
]);
const INLINE_LOGO = `data:image/png;base64,${LOGO_BYTES.toString('base64')}`;

const results: Array<{ name: string; ok: boolean; error?: string }> = [];
async function test(name: string, fn: () => Promise<void>) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) }); }
}

try {
  await initializeTursoDatabase();
  const now = new Date().toISOString();
  await writeTursoBatch([
    { type: 'set', collection: 'services', parentPath: '', id: 'svc-b', data: { title: 'B', order: 2, featured: true, createdAt: now } },
    { type: 'set', collection: 'services', parentPath: '', id: 'svc-a', data: { title: 'A', order: 1, featured: false, createdAt: now } },
    { type: 'set', collection: 'services', parentPath: '', id: 'svc-c', data: { title: 'C', createdAt: now } },
    { type: 'set', collection: 'services', parentPath: '', id: 'svc-d', data: { title: 'D', order: 'x', createdAt: now } },
    { type: 'set', collection: 'settings', parentPath: '', id: 'company', data: { name: 'Mahdev', superAdminEmail: 'hidden@example.com' } },
    { type: 'set', collection: 'careerOpenings', parentPath: '', id: 'job-live', data: { title: 'Live', status: 'published' } },
    { type: 'set', collection: 'careerOpenings', parentPath: '', id: 'job-draft', data: { title: 'Draft', status: 'draft' } },
    { type: 'set', collection: 'media_blobs', parentPath: '', id: 'vid_1', data: { mimeType: 'video/mp4' } },
    { type: 'set', collection: 'pages', parentPath: '', id: 'p1', data: { slug: 'summer-offer', isPublished: true } },
    { type: 'set', collection: 'pages', parentPath: '', id: 'p2', data: { slug: 'hidden-draft', isPublished: false } },
    { type: 'set', collection: 'products', parentPath: '', id: 'prod-1', data: { name: 'Lamp', price: 100 } },
    { type: 'set', collection: 'websiteContent', parentPath: '', id: 'brand', data: { logo: { dark: INLINE_LOGO } } },
    { type: 'set', collection: 'items', parentPath: '', id: 'i1', data: { division: 'sws', featured: true, rank: 1, code: '1' } },
    { type: 'set', collection: 'items', parentPath: '', id: 'i2', data: { divisionId: 'sws-events', featured: false, rank: '1' } },
    { type: 'set', collection: 'items', parentPath: '', id: 'i3', data: { division: 'u1', featured: 1, rank: null } },
    { type: 'set', collection: 'items', parentPath: '', id: 'i4', data: { division: 'it' } },
  ]);

  await test('Snapshot returns public data with private fields removed', async () => {
    const res = makeRes();
    await publicSnapshotHandler(makeReq({ url: '/api/public/snapshot' }), res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.collections.services.length, 4);
    assert.equal(body.collections.settings[0].data.superAdminEmail, undefined, 'hidden settings field leaked');
    assert.deepEqual(body.collections.careerOpenings.map((d: any) => d.id), ['job-live'], 'draft career opening leaked');
    assert.equal(body.collections.media_blobs, undefined, 'media_blobs must not be in the snapshot');
    assert.match(res.headers['cdn-cache-control'], /s-maxage=300/);
    assert.ok(res.headers.etag);
    const notModified = makeRes();
    await publicSnapshotHandler(makeReq({ url: '/api/public/snapshot', headers: { 'if-none-match': res.headers.etag } }), notModified);
    assert.equal(notModified.statusCode, 304);
  });

  await test('Inline images leave the snapshot and are served from an immutable media URL', async () => {
    const res = makeRes();
    await publicSnapshotHandler(makeReq({ url: '/api/public/snapshot' }), res);
    assert.ok(!res.body.includes('data:image/png;base64'), 'inline image still inside the snapshot');
    const brand = JSON.parse(res.body).collections.websiteContent.find((d: any) => d.id === 'brand');
    const mediaUrl: string = brand.data.logo.dark;
    assert.match(mediaUrl, /^\/api\/public\/media\/[a-f0-9]{32}\.png$/);

    const media = makeRes();
    await publicInlineMediaHandler(makeReq({ url: mediaUrl }), media);
    assert.equal(media.statusCode, 200);
    assert.equal(media.headers['content-type'], 'image/png');
    assert.match(media.headers['cdn-cache-control'], /immutable/);
    assert.ok(Buffer.isBuffer(media.body) && media.body.equals(LOGO_BYTES), 'image bytes differ from the stored image');

    const missing = makeRes();
    await publicInlineMediaHandler(makeReq({ url: `/api/public/media/${'0'.repeat(32)}.png` }), missing);
    assert.equal(missing.statusCode, 404);
  });

  await test('Snapshot ordering and limits match the server SQL exactly', async () => {
    const all = await listTursoDocuments('services', '');
    for (const order of [undefined, { field: 'order', direction: 'asc' as const }, { field: 'order', direction: 'desc' as const }, { field: 'featured', direction: 'desc' as const }]) {
      for (const limit of [undefined, 2]) {
        const fromSql = (await listTursoDocuments('services', '', [], order, limit)).map((d) => d.id);
        const fromSnapshot = querySnapshotDocuments(all, order, limit).map((d) => d.id);
        assert.deepEqual(fromSnapshot, fromSql, `mismatch for ${JSON.stringify(order)} limit ${limit}`);
      }
    }
  });

  await test('Snapshot == / in filters match the server SQL exactly', async () => {
    const all = await listTursoDocuments('items', '');
    const cases: Array<{ filters: any[]; groups: any[] }> = [
      { filters: [{ field: 'division', operator: '==', value: 'sws' }], groups: [] },
      { filters: [{ field: 'featured', operator: '==', value: true }], groups: [] },
      { filters: [{ field: 'featured', operator: '==', value: false }], groups: [] },
      { filters: [{ field: 'rank', operator: '==', value: 1 }], groups: [] },
      { filters: [{ field: 'rank', operator: '==', value: '1' }], groups: [] },
      { filters: [{ field: 'rank', operator: '==', value: null }], groups: [] },
      { filters: [{ field: 'code', operator: '==', value: 1 }], groups: [] },
      { filters: [{ field: 'division', operator: 'in', value: ['sws', 'it'] }], groups: [] },
      { filters: [], groups: [[{ field: 'division', operator: 'in', value: ['sws', 'sws-events'] }], [{ field: 'divisionId', operator: 'in', value: ['sws', 'sws-events'] }]] },
      { filters: [{ field: 'featured', operator: '==', value: true }], groups: [[{ field: 'division', operator: 'in', value: ['u1'] }], [{ field: 'rank', operator: '==', value: 1 }]] },
    ];
    for (const { filters, groups } of cases) {
      const fromSql = (await listTursoDocuments('items', '', filters, undefined, undefined, undefined, undefined, undefined, groups)).map((d) => d.id);
      const fromSnapshot = querySnapshotDocuments(filterSnapshotDocuments(all, filters, groups)).map((d) => d.id);
      assert.deepEqual(fromSnapshot, fromSql, `mismatch for ${JSON.stringify({ filters, groups })}`);
    }
  });

  await test('Public filters on hidden settings fields are refused', async () => {
    const result = await handleTursoAction(
      { action: 'list', collection: 'settings', parentPath: '', filters: [{ field: 'superAdminEmail', operator: '>=', value: 'h' }] },
      { role: 'public' }
    );
    assert.equal(result.status, 400);
    const sorted = await handleTursoAction(
      { action: 'list', collection: 'settings', parentPath: '', order: { field: 'superAdminEmail', direction: 'asc' } },
      { role: 'public' }
    );
    assert.equal(sorted.status, 400);
  });

  await test('Shared rate limiter blocks after the limit', async () => {
    await consumeRateLimit('test:key', 2, 60_000);
    await consumeRateLimit('test:key', 2, 60_000);
    await assert.rejects(() => consumeRateLimit('test:key', 2, 60_000), RateLimitError);
  });

  await test('Batched analytics stores several events in one request', async () => {
    const events = [1, 2, 3].map((n) => ({
      id: `ev_test_${n}_abcdef`, type: 'page_view', path: '/services', title: 'T', sessionId: 'session_abcdef12', metadata: {},
    }));
    const res = makeRes();
    await analyticsHandler(makeReq({ method: 'POST', url: '/api/analytics', raw: JSON.stringify({ events }) }), res);
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(JSON.parse(res.body).stored, 3);
  });

  await test('Unknown URLs and retired admin paths return 404; real routes return 200', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('<html><head><meta name="robots" content="index, follow" /></head></html>', { status: 200 })) as typeof fetch;
    try {
      const status = async (p: string) => {
        const res = makeRes();
        await pageShellHandler(makeReq({ url: `/api/page-shell?route=${encodeURIComponent(p)}`, headers: { host: 'example.test' } }), res);
        return res;
      };
      assert.equal((await status('/admin')).statusCode, 404);
      assert.equal((await status('/admin-login')).statusCode, 404);
      assert.equal((await status('/this-does-not-exist')).statusCode, 404);
      assert.equal((await status('/hidden-draft')).statusCode, 404);
      const notFound = await status('/nope');
      assert.match(notFound.body, /noindex/);
      // A single-service address is 200 only when the service exists (no "soft 404").
      assert.equal((await status('/services/wedding-decor')).statusCode, 404, 'an unknown service must be a real 404');
      assert.equal((await status('/services/svc-a')).statusCode, 200, 'a listed service must load');
      // Personal "Book online" forms load, but are never indexed.
      const bookingForm = await status('/book/service/svc-a');
      assert.equal(bookingForm.statusCode, 200);
      assert.match(bookingForm.headers['x-robots-tag'] || '', /noindex/, 'booking forms must not be indexed');
      assert.equal((await status('/admin-yuvan1709/gallery')).statusCode, 200);
      assert.equal((await status('/summer-offer')).statusCode, 200, 'published CMS page must be 200');
      assert.equal((await status('/')).statusCode, 200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('Rewritten page requests reach the page shell via the API dispatcher (Vercel behaviour)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('<html><head><meta name="robots" content="index, follow" /></head></html>', { status: 200 })) as typeof fetch;
    try {
      const viaDispatcher = async (url: string) => {
        const res = makeRes();
        await apiDispatcher(makeReq({ url, headers: { host: 'example.test' } }), res);
        return res;
      };
      // Vercel passes the original URL to rewritten requests.
      const admin = await viaDispatcher('/admin');
      assert.equal(admin.statusCode, 404);
      assert.match(admin.headers['content-type'], /text\/html/, 'must be the HTML 404 page, not JSON');
      assert.equal((await viaDispatcher('/services/abc')).statusCode, 404, 'an unknown service must be a real 404');
      assert.equal((await viaDispatcher('/services/svc-a')).statusCode, 200);
      assert.equal((await viaDispatcher('/no-such-page?x=1')).statusCode, 404);
      // Direct call with Vercel's injected catch-all "path" parameter present.
      assert.equal((await viaDispatcher('/api/page-shell?route=%2Fadmin&path=page-shell')).statusCode, 404);
      // Unknown or POST-only API addresses opened in a browser show the 404 page.
      for (const apiPath of ['/api/does-not-exist', '/api/database']) {
        const res = makeRes();
        await apiDispatcher(makeReq({ url: apiPath, headers: { host: 'example.test', accept: 'text/html,application/xhtml+xml', 'sec-fetch-dest': 'document' } }), res);
        assert.equal(res.statusCode, 404, apiPath);
        assert.match(res.headers['content-type'], /text\/html/, `${apiPath} should show the HTML 404 page`);
      }
      // App fetch() calls to a missing API endpoint still get JSON.
      const unknownApi = await viaDispatcher('/api/does-not-exist');
      assert.equal(unknownApi.statusCode, 404);
      assert.match(unknownApi.headers['content-type'], /json/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test('Data APIs only answer requests from the website itself', async () => {
    const call = async (headers: Record<string, string>) => {
      const res = makeRes();
      await apiDispatcher(makeReq({ url: '/api/public/snapshot', headers: { host: 'example.test', ...headers } }), res);
      return res;
    };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => new Response('<html><head><meta name="robots" content="index, follow" /></head></html>', { status: 200 })) as typeof fetch;
    try {
      for (const [label, headers] of [
        ['typed into the address bar', { 'sec-fetch-site': 'none', 'sec-fetch-dest': 'document', accept: 'text/html' }],
        ['another website', { 'sec-fetch-site': 'cross-site' }],
        ['a script with no headers', {}],
        ['a forged referer from another site', { referer: 'https://evil.example/page' }],
      ] as Array<[string, Record<string, string>]>) {
        const res = await call(headers);
        assert.equal(res.statusCode, 404, `${label} should be blocked`);
        assert.match(res.headers['content-type'], /text\/html/, `${label} should get the 404 page`);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
    const fromSite = await call({ 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'empty' });
    assert.equal(fromSite.statusCode, 200, 'the website itself must get data');
    assert.ok(JSON.parse(fromSite.body).collections);
    const olderBrowser = await call({ referer: 'https://example.test/sws' });
    assert.equal(olderBrowser.statusCode, 200, 'older browsers without Sec-Fetch-Site but a same-site referer must work');
  });

  await test('Public orders get a server-side price check', async () => {
    const result = await handleTursoAction({
      action: 'write',
      write: {
        type: 'set', collection: 'orders', parentPath: '', id: 'order-tamper-1',
        data: { items: [{ productId: 'prod-1', quantity: 2, unitPrice: 1 }], subtotal: 2, total: 2, customer: { name: 'X' } },
      },
    }, { role: 'public' });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    const [order] = (await listTursoDocuments('orders', '')).filter((d) => d.id === 'order-tamper-1');
    const check = order.data.pricingVerification as any;
    assert.equal(check.verified, false);
    assert.equal(check.verifiedSubtotal, 200);
    assert.equal(order.data.paymentStatus, 'unpaid');
  });

  await test('Customer NIC is verified on the server: derived fields, set once, one account per NIC', async () => {
    const alice = { role: 'customer' as const, identity: { uid: 'cust-alice', email: 'alice@example.com' } };
    const bob = { role: 'customer' as const, identity: { uid: 'cust-bob', email: 'bob@example.com' } };
    const save = (access: typeof alice, data: Record<string, unknown>) =>
      handleTursoAction({ action: 'write', write: { type: 'set', collection: 'users', parentPath: '', id: access.identity.uid, data } }, access);

    // Date of birth and gender sent by the browser are ignored; the NIC decides them.
    let result = await save(alice, { name: 'Alice', phone: '077 123 4567', nic: '956234567v', dateOfBirth: '2010-01-01', gender: 'male' });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    let [profile] = (await listTursoDocuments('users', '')).filter((d) => d.id === 'cust-alice');
    assert.equal(profile.data.nic, '956234567V');
    assert.equal(profile.data.dateOfBirth, '1995-05-02');
    assert.equal(profile.data.gender, 'female');
    assert.equal(profile.data.phone, '+94771234567');

    // A later profile edit cannot alter the identity fields.
    result = await save(alice, { name: 'Alice P', dateOfBirth: '2000-01-01', gender: 'male' });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    [profile] = (await listTursoDocuments('users', '')).filter((d) => d.id === 'cust-alice');
    assert.equal(profile.data.dateOfBirth, '1995-05-02');
    assert.equal(profile.data.gender, 'female');

    // The NIC cannot be changed, and cannot be reused by another account.
    result = await save(alice, { nic: '199512304567' });
    assert.equal(result.status, 403, JSON.stringify(result.body));
    result = await save(bob, { name: 'Bob', nic: '956234567V' });
    assert.notEqual(result.status, 200, 'a second account must not register the same NIC');

    // Invalid NIC and phone numbers are refused.
    result = await save(bob, { name: 'Bob', nic: '990601234V' });
    assert.notEqual(result.status, 200, 'an impossible date (29 Feb 1999) must be refused');
    result = await save(bob, { name: 'Bob', phone: '12345' });
    assert.notEqual(result.status, 200, 'an invalid phone number must be refused');
  });

  await test('Customers cannot change their own role or status, and profile fields are checked', async () => {
    const carol = { role: 'customer' as const, identity: { uid: 'cust-carol', email: 'carol@example.com' } };
    const save = (data: Record<string, unknown>) =>
      handleTursoAction({ action: 'write', write: { type: 'set', collection: 'users', parentPath: '', id: 'cust-carol', data } }, carol);
    const load = async () => (await listTursoDocuments('users', '')).find((d) => d.id === 'cust-carol')!;

    // New profile: server sets role, status and creation date, ignoring the browser's values.
    let result = await save({ name: 'Carol', role: 'admin', status: 'suspended', createdAt: '2001-01-01T00:00:00.000Z' });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    let profile = await load();
    assert.equal(profile.data.role, 'customer');
    assert.equal(profile.data.status, 'active');
    assert.notEqual(profile.data.createdAt, '2001-01-01T00:00:00.000Z');

    // Unsafe photo addresses and malformed fields are refused; an https upload is accepted.
    result = await save({ avatarUrl: 'javascript:alert(1)' });
    assert.notEqual(result.status, 200, 'a script URL must not be accepted as a photo');
    result = await save({ address: 'not an object' });
    assert.notEqual(result.status, 200, 'a malformed address must be refused');
    result = await save({ avatarUrl: 'https://firebasestorage.googleapis.com/v0/b/x/o/a.webp?alt=media', preferences: { smsAlerts: 'yes', currency: 'USD', admin: true } });
    assert.equal(result.status, 200, JSON.stringify(result.body));
    profile = await load();
    assert.deepEqual(profile.data.preferences, { currency: 'LKR', smsAlerts: false });

    // Once suspended by an admin, the customer can neither edit nor reactivate the account.
    await handleTursoAction({ action: 'write', write: { type: 'set', collection: 'users', parentPath: '', id: 'cust-carol', merge: true, data: { status: 'suspended' } } });
    result = await save({ name: 'Carol B', status: 'active' });
    assert.equal(result.status, 403, JSON.stringify(result.body));
    assert.equal((await load()).data.status, 'suspended');
  });

  await test('Bookings cannot be created for, or emailed to, someone else', async () => {
    // A brand-new account whose email is not verified yet.
    const mallory = { role: 'customer' as const, identity: { uid: 'cust-mallory', accountEmail: 'mallory@example.com' } };
    const result = await handleTursoAction({
      action: 'write',
      write: {
        type: 'set', collection: 'bookings', parentPath: '', id: 'BK-SPOOF-1',
        data: {
          source: 'online_booking', serviceName: 'Stage', price: 1000,
          customerEmail: 'victim@example.com', email: 'victim@example.com', contactEmail: 'victim@example.com',
          customer: { fullName: 'M', email: 'victim@example.com' },
          customerId: 'someone-else', status: 'confirmed', paymentStatus: 'paid',
          amountPaid: 1000, payments: [{ amount: 1000 }], advanceAmount: 0, adminNotes: 'VIP', customerUpdates: [{ title: 'Paid' }],
        },
      },
    }, mallory);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    const [booking] = (await listTursoDocuments('bookings', '')).filter((d) => d.id === 'BK-SPOOF-1');
    assert.equal(JSON.stringify(booking.data).includes('victim@example.com'), false, 'no browser-sent email may be stored');
    assert.equal(booking.data.contactEmail, 'mallory@example.com');
    assert.equal(booking.data.customerEmail, undefined, 'an unverified email must not be stored where it grants access');
    assert.equal(booking.data.customerId, 'cust-mallory');
    assert.equal(booking.data.status, 'pending');
    assert.equal(booking.data.paymentStatus, 'unpaid');
    for (const field of ['amountPaid', 'payments', 'advanceAmount', 'adminNotes', 'customerUpdates']) {
      assert.equal(booking.data[field], undefined, `a customer must not preset ${field}`);
    }

    // The profile email always comes from the sign-in account.
    const profile = await handleTursoAction({
      action: 'write',
      write: { type: 'set', collection: 'users', parentPath: '', id: 'cust-mallory', data: { name: 'Mallory', email: 'victim@example.com' } },
    }, mallory);
    assert.equal(profile.status, 200, JSON.stringify(profile.body));
    const [user] = (await listTursoDocuments('users', '')).filter((d) => d.id === 'cust-mallory');
    assert.equal(user.data.email, 'mallory@example.com');
  });

  await test('Customers only see their own bookings and cannot change them; the public sees none', async () => {
    const dave = { role: 'customer' as const, identity: { uid: 'cust-dave', email: 'dave@example.com', accountEmail: 'dave@example.com' } };
    const erin = { role: 'customer' as const, identity: { uid: 'cust-erin', email: 'erin@example.com', accountEmail: 'erin@example.com' } };
    const create = await handleTursoAction({
      action: 'write',
      write: { type: 'set', collection: 'bookings', parentPath: '', id: 'BK-DAVE-1', data: { serviceName: 'Photo', price: 500 } },
    }, dave);
    assert.equal(create.status, 200, JSON.stringify(create.body));

    const erinList = await handleTursoAction({ action: 'list', collection: 'bookings' }, erin);
    assert.equal((erinList.body.documents as Array<{ id: string }>).some((d) => d.id === 'BK-DAVE-1'), false, 'another customer must not see it');
    const erinGet = await handleTursoAction({ action: 'get', collection: 'bookings', id: 'BK-DAVE-1' }, erin);
    assert.equal(erinGet.body.document, null);
    // Internal admin notes are kept from the customer, but the team's updates reach them.
    await handleTursoAction({
      action: 'write',
      write: { type: 'update', collection: 'bookings', parentPath: '', id: 'BK-DAVE-1', data: { adminNotes: 'Internal: check venue', customerUpdates: [{ id: 'u1', title: 'Booking confirmed' }] } },
    }, { role: 'admin' });
    const daveList = await handleTursoAction({ action: 'list', collection: 'bookings' }, dave);
    const own = (daveList.body.documents as Array<{ id: string; data: Record<string, unknown> }>).find((d) => d.id === 'BK-DAVE-1');
    assert.ok(own, 'the owner must see it');
    assert.equal(own!.data.adminNotes, undefined, 'admin notes must not reach the customer');
    assert.ok(Array.isArray(own!.data.customerUpdates), 'customer updates must reach the customer');
    const daveGet = await handleTursoAction({ action: 'get', collection: 'bookings', id: 'BK-DAVE-1' }, dave);
    assert.equal((daveGet.body.document as { data: Record<string, unknown> }).data.adminNotes, undefined);

    // Customers cannot confirm, re-price or overwrite their booking.
    const update = await handleTursoAction({
      action: 'write',
      write: { type: 'update', collection: 'bookings', parentPath: '', id: 'BK-DAVE-1', data: { status: 'confirmed', price: 1, paymentStatus: 'paid' } },
    }, dave);
    assert.notEqual(update.status, 200, 'a customer update must be refused');
    const overwrite = await handleTursoAction({
      action: 'write',
      write: { type: 'set', collection: 'bookings', parentPath: '', id: 'BK-DAVE-1', data: { price: 1 } },
    }, dave);
    assert.notEqual(overwrite.status, 200, 'overwriting an existing booking must be refused');

    // Bookings, users and payments are never listed for the public.
    for (const collection of ['bookings', 'users', 'payments', 'orderConfirmations']) {
      await assert.rejects(
        () => authorizeDatabaseAction({ action: 'list', collection }, undefined, undefined),
        `public listing of ${collection} must be refused`
      );
    }
  });

  await test('Nested collection paths are refused for non-admins (except media chunks)', async () => {
    await assert.rejects(
      () => authorizeDatabaseAction({ action: 'get', collection: 'products/abc/x', parentPath: 'products/abc', id: 'a' }, undefined, undefined),
      'a made-up nested path must be refused'
    );
    const chunks = await authorizeDatabaseAction(
      { action: 'list', collection: 'media_blobs/chunks', parentPath: 'media_blobs/vid_1' }, undefined, undefined
    );
    assert.equal(chunks.role, 'public', 'media chunks must still load for visitors');
  });

  await test('Unpublished drafts are hidden from the public', async () => {
    await writeTursoBatch([
      { type: 'set', collection: 'legalPages', parentPath: '', id: 'termsAndConditions', data: { title: 'Terms', sections: [{ heading: 'Live' }], draftSections: [{ heading: 'Secret draft' }], draftTitle: 'Draft title' } },
    ]);
    const legal = await handleTursoAction({ action: 'get', collection: 'legalPages', id: 'termsAndConditions' }, { role: 'public' });
    const doc = legal.body.document as { data: Record<string, unknown> };
    assert.equal(doc.data.draftSections, undefined);
    assert.equal(doc.data.draftTitle, undefined);
    assert.deepEqual(doc.data.sections, [{ heading: 'Live' }]);

    const pages = await handleTursoAction({ action: 'list', collection: 'pages' }, { role: 'public' });
    const ids = (pages.body.documents as Array<{ id: string }>).map((d) => d.id);
    assert.ok(ids.includes('p1'));
    assert.equal(ids.includes('p2'), false, 'an unpublished page must not be listed');
    const draftPage = await handleTursoAction({ action: 'get', collection: 'pages', id: 'p2' }, { role: 'public' });
    assert.equal(draftPage.body.document, null);
    const adminView = await handleTursoAction({ action: 'get', collection: 'legalPages', id: 'termsAndConditions' }, { role: 'admin' });
    assert.ok((adminView.body.document as { data: Record<string, unknown> }).data.draftSections, 'admins still see drafts');
  });

  await test('Account check answers the website only, is rate limited, and new accounts need a unique phone', async () => {
    const check = async (body: Record<string, unknown>, headers: Record<string, string>) => {
      const res = makeRes();
      await apiDispatcher(makeReq({
        method: 'POST', url: '/api/account/check', raw: JSON.stringify(body),
        headers: { host: 'example.test', 'content-type': 'application/json', 'x-real-ip': '198.51.100.20', ...headers },
      }), res);
      return res;
    };
    const fromSite = { 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'empty' };
    const found = await check({ email: 'alice@example.com', phone: '0771234567', nic: '956234567V' }, fromSite);
    assert.equal(found.statusCode, 200, found.body);
    assert.deepEqual(
      (({ email, phone, nic }) => ({ email, phone, nic }))(JSON.parse(found.body)),
      { email: 'taken', phone: 'taken', nic: 'taken' }
    );
    const fresh = JSON.parse((await check({ email: 'nobody@example.com', phone: '0719999999', nic: '200012345678' }, fromSite)).body);
    assert.equal(fresh.email, 'available');
    assert.equal(fresh.phone, 'available');

    const otherSite = await check({ email: 'alice@example.com' }, { 'sec-fetch-site': 'cross-site' });
    assert.equal(otherSite.statusCode, 404, 'other websites and scripts must not be answered');

    let limited = 0;
    for (let i = 0; i < 25; i += 1) if ((await check({ email: 'x@example.com' }, fromSite)).statusCode === 429) limited += 1;
    assert.ok(limited > 0, 'repeated checks must be rate limited');

    // The server itself refuses a second new account with a registered contact number.
    const result = await handleTursoAction({
      action: 'write',
      write: { type: 'set', collection: 'users', parentPath: '', id: 'cust-frank', data: { name: 'Frank', phone: '077 123 4567' } },
    }, { role: 'customer', identity: { uid: 'cust-frank', accountEmail: 'frank@example.com' } });
    assert.notEqual(result.status, 200, 'a registered contact number must not open a second account');
  });

  await test('Admin sign-in has no built-in fallback credentials', async () => {
    const res = makeRes();
    await adminLoginHandler(makeReq({ method: 'POST', url: '/api/admin/auth/login', body: { email: 'anyone@example.com', password: 'x' } }), res);
    assert.equal(res.statusCode, 503, `expected sign-in to be disabled without env config, got ${res.statusCode}`);
  });
} finally {
  await unlink(databasePath).catch(() => undefined);
}

for (const r of results) console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name}${r.error ? ` — ${r.error}` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`PUBLIC API TESTS: Total: ${results.length} | Passed: ${results.length - failed} | Failed: ${failed}`);
if (failed) process.exit(1);
