import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  initializeTursoDatabase,
  getTursoDocument,
  listTursoDocuments,
} from '../../../db/tursoDatabase.js';

const LOOKUP_WINDOW_MS = 10 * 60 * 1000;
const LOOKUP_MAX_PER_WINDOW = 10;
const lookupAttempts = new Map<string, { count: number; resetAt: number }>();
let databaseInitialization: Promise<void> | undefined;

interface CareerStatusRequest extends IncomingMessage {
  method?: string;
  url?: string;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

function allowLookup(request: IncomingMessage): boolean {
  const forwardedFor = request.headers['x-forwarded-for'];
  const clientKey = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
    ?.split(',')[0]
    ?.trim() || request.socket.remoteAddress || 'unknown';
  const now = Date.now();
  for (const [key, attempt] of lookupAttempts) {
    if (attempt.resetAt <= now) lookupAttempts.delete(key);
  }
  const attempt = lookupAttempts.get(clientKey);
  if (attempt && attempt.count >= LOOKUP_MAX_PER_WINDOW) return false;
  lookupAttempts.set(clientKey, attempt
    ? { ...attempt, count: attempt.count + 1 }
    : { count: 1, resetAt: now + LOOKUP_WINDOW_MS });
  return true;
}

async function ensureDatabaseInitialized(): Promise<void> {
  databaseInitialization ??= initializeTursoDatabase().catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

export default async function handler(
  request: CareerStatusRequest,
  response: ServerResponse
): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { success: false, error: 'Method not allowed.' });
    return;
  }
  if (!allowLookup(request)) {
    sendJson(response, 429, { success: false, error: 'Too many status lookups. Please try again later.' });
    return;
  }

  const url = new URL(request.url || '/', 'http://localhost');
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const reference = (url.searchParams.get('reference') || '').trim();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !(/^[0-9a-f-]{36}$/i.test(reference) || /^mahdev-app-\d{3,}$/i.test(reference))
  ) {
    sendJson(response, 400, { success: false, error: 'Enter the email address and application reference used when applying.' });
    return;
  }

  try {
    await ensureDatabaseInitialized();
    const application = /^[0-9a-f-]{36}$/i.test(reference)
      ? await getTursoDocument('careerApplications', '', reference)
      : (await listTursoDocuments(
        'careerApplications',
        '',
        [{ field: 'reference', operator: '==', value: reference }],
        undefined,
        1
      ))[0] || null;
    if (
      !application ||
      typeof application.data.email !== 'string' ||
      application.data.email.toLowerCase() !== email
    ) {
      sendJson(response, 404, { success: false, error: 'No application matched those details.' });
      return;
    }

    const openingId = application.data.openingId;
    const opening = typeof openingId === 'string'
      ? await getTursoDocument('careerOpenings', '', openingId)
      : null;
    sendJson(response, 200, {
      success: true,
      application: {
        reference: typeof application.data.reference === 'string' ? application.data.reference : reference,
        status: application.data.status,
        createdAt: application.data.createdAt,
        openingTitle: typeof opening?.data.title === 'string' ? opening.data.title : 'Career application',
      },
    });
  } catch (error) {
    console.error('[Careers] Application status lookup failed:', error);
    sendJson(response, 503, { success: false, error: 'Application status is temporarily unavailable.' });
  }
}
