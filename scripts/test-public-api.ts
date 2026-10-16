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
const { default: publicSnapshotHandler } = await import('../backend/api/handlers/publicSnapshot');
const { default: pageShellHandler } = await import('../backend/api/handlers/pageShell');
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
    assert.match(res.headers['cdn-cache-control'], /s-maxage=60/);
    assert.ok(res.headers.etag);
    const notModified = makeRes();
    await publicSnapshotHandler(makeReq({ url: '/api/public/snapshot', headers: { 'if-none-match': res.headers.etag } }), notModified);
    assert.equal(notModified.statusCode, 304);
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
        await pageShellHandler(makeReq({ url: `/api/page-shell?path=${encodeURIComponent(p)}`, headers: { host: 'example.test' } }), res);
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
