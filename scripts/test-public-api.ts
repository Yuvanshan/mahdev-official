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
delete process.env.ADMIN_LOGIN_EMAIL;
delete process.env.ADMIN_LOGIN_PASSWORD_HASH;
delete process.env.ADMIN_SESSION_SECRET;

const { initializeTursoDatabase, writeTursoBatch, listTursoDocuments } = await import('../backend/db/tursoDatabase');
const { handleTursoAction } = await import('../backend/api/tursoRoutes');
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
      assert.equal((await status('/services/wedding-decor')).statusCode, 200);
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
      assert.equal((await viaDispatcher('/services/abc')).statusCode, 200);
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
