import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AdminSessionAuthError, requireAdminSession } from '../../auth/adminCredentialAuth.js';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoDocument,
} from '../../db/tursoDatabase.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';

// Header search terms, kept in the "searchHistory" collection for the admin portal.
//   POST            public (this site only): record one search term
//   GET             admin: recent searches and the most searched terms
//   DELETE ?id=…    admin: remove one entry (e.g. a term that holds personal data)
// Only the term, where it was searched and the time are stored. No user id, no IP address.
const COLLECTION = 'searchHistory';
const MAX_QUERY_LENGTH = 100;
const MAX_ADMIN_LIST_ROWS = 500;
const SCOPES = new Set(['all', 'services', 'gallery', 'products']);
const SEARCH_LIMIT = { limit: 30, windowMs: 60 * 60 * 1000 };

interface SearchRequest extends IncomingMessage {
  body?: unknown;
}

let databaseInitialization: Promise<void> | undefined;
function ensureDatabase(): Promise<void> {
  databaseInitialization ??= initializeTursoDatabase().catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

async function recordSearch(request: SearchRequest, response: ServerResponse): Promise<void> {
  await consumeRateLimit(`search:${getClientIp(request)}`, SEARCH_LIMIT.limit, SEARCH_LIMIT.windowMs);
  const body = request.body && typeof request.body === 'object' && !Array.isArray(request.body)
    ? request.body as Record<string, unknown>
    : null;
  const query = typeof body?.query === 'string' ? body.query.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, MAX_QUERY_LENGTH) : '';
  if (query.length < 2) {
    sendJson(response, 400, { success: false, error: 'A search term is required.' });
    return;
  }
  const scope = typeof body?.scope === 'string' && SCOPES.has(body.scope) ? body.scope : 'all';
  await writeTursoDocument({
    type: 'set',
    collection: COLLECTION,
    parentPath: '',
    id: crypto.randomUUID(),
    data: { query, scope, createdAt: new Date().toISOString() },
  });
  sendJson(response, 200, { success: true });
}

async function listSearches(request: SearchRequest, response: ServerResponse): Promise<void> {
  await requireAdminSession(request.headers.cookie);
  const rows = await listTursoDocuments(COLLECTION, '', [], { field: 'createdAt', direction: 'desc' }, MAX_ADMIN_LIST_ROWS);
  const searches = rows.map((row) => ({ id: row.id, query: row.data.query, scope: row.data.scope, createdAt: row.data.createdAt }));
  sendJson(response, 200, { success: true, searches });
}

async function deleteSearch(request: SearchRequest, response: ServerResponse): Promise<void> {
  await requireAdminSession(request.headers.cookie);
  const id = new URL(request.url || '/', 'http://localhost').searchParams.get('id')?.slice(0, 100) || '';
  if (!id || id.includes('/')) {
    sendJson(response, 400, { success: false, error: 'An id is required.' });
    return;
  }
  if (!(await getTursoDocument(COLLECTION, '', id))) {
    sendJson(response, 404, { success: false, error: 'Search not found.' });
    return;
  }
  await writeTursoDocument({ type: 'delete', collection: COLLECTION, parentPath: '', id });
  sendJson(response, 200, { success: true });
}

export default async function handler(request: SearchRequest, response: ServerResponse): Promise<void> {
  try {
    await ensureDatabase();
    if (request.method === 'POST') return await recordSearch(request, response);
    if (request.method === 'GET') return await listSearches(request, response);
    if (request.method === 'DELETE') return await deleteSearch(request, response);
    response.setHeader('Allow', 'GET, POST, DELETE');
    sendJson(response, 405, { success: false, error: 'Method not allowed.' });
  } catch (error) {
    if (error instanceof AdminSessionAuthError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
    } else if (error instanceof RateLimitError) {
      sendJson(response, 429, { success: false, error: 'Too many searches. Please try again later.' });
    } else {
      console.error('[SearchHistory] Request failed:', error);
      sendJson(response, 503, { success: false, error: 'Search history is temporarily unavailable.' });
    }
  }
}
