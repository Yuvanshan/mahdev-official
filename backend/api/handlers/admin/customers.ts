import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminSessionAuthError,
  getAdminSessionFromCookie,
} from '../../../auth/adminCredentialAuth.js';
import {
  ensureCustomerCode,
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoDocument,
} from '../../../db/tursoDatabase.js';
import { getFirebaseAdminApp } from '../../../services/adminMediaUpload.js';

interface AdminCustomersRequest extends IncomingMessage {
  method?: string;
}

let initialization: Promise<void> | undefined;

function ensureDatabaseInitialized(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Gives every customer without one a readable ID ("mahdev-cus-001"), oldest
 * account first, so the numbers follow sign-up order.
 */
async function assignMissingCustomerCodes(records: Awaited<ReturnType<typeof listTursoDocuments>>): Promise<void> {
  const missing = records
    .filter((record) => !(typeof record.data.customerCode === 'string' && record.data.customerCode))
    .sort((a, b) => String(a.data.createdAt || '').localeCompare(String(b.data.createdAt || '')));
  // One at a time, so the numbers are given out in this order.
  for (const record of missing) {
    const code = await ensureCustomerCode(record.id);
    if (code) record.data.customerCode = code;
  }
}

function firebaseProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'for-her-33ea9';
}

/**
 * Removes the customer's sign-in account; returns a warning when that was not possible.
 * Calls the Identity Toolkit REST API with the server's service-account token instead of
 * firebase-admin/auth: that module loads jwks-rsa, which require()s the ESM-only `jose`
 * package and crashes the bundled Vercel function on start-up (ERR_REQUIRE_ESM).
 */
async function deleteSignInAccount(uid: string): Promise<string | undefined> {
  try {
    const credential = getFirebaseAdminApp().options.credential;
    if (!credential) throw new Error('No Firebase service-account credential is configured.');
    const { access_token: accessToken } = await credential.getAccessToken();
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(firebaseProjectId())}/accounts:delete`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId: uid }),
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (response.ok) return undefined;
    const detail = await response.text();
    // Already gone (or never had a sign-in account): nothing left to remove.
    if (detail.includes('USER_NOT_FOUND')) return undefined;
    throw new Error(`Identity Toolkit responded ${response.status}: ${detail.slice(0, 300)}`);
  } catch (error) {
    console.error(`[Admin Customers] Could not delete Firebase sign-in account ${uid}:`, error);
    return 'The customer profile was deleted, but their sign-in account could not be removed. They can sign in again to create a new profile.';
  }
}

export default async function handler(req: AdminCustomersRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    sendJson(res, 405, { success: false, error: 'Only GET and DELETE requests are supported.' });
    return;
  }

  try {
    getAdminSessionFromCookie(Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie);
    await ensureDatabaseInitialized();

    if (req.method === 'DELETE') {
      const id = new URL(req.url || '/', 'http://localhost').searchParams.get('id')?.trim() || '';
      if (!id || id.includes('/')) {
        sendJson(res, 400, { success: false, error: 'A customer ID is required.' });
        return;
      }
      const record = await getTursoDocument('users', '', id);
      if (!record) {
        sendJson(res, 404, { success: false, error: 'This customer no longer exists.' });
        return;
      }
      // Orders, bookings and payments are kept as business records; only the account is removed.
      await writeTursoDocument({ type: 'delete', collection: 'users', parentPath: '', id });
      const warning = await deleteSignInAccount(String(record.data.uid || id));
      sendJson(res, 200, { success: true, ...(warning ? { warning } : {}) });
      return;
    }

    const records = await listTursoDocuments('users', '');
    await assignMissingCustomerCodes(records);
    sendJson(res, 200, {
      success: true,
      customers: records.map((record) => ({ ...record.data, id: record.id })),
    });
  } catch (error) {
    const status = error instanceof AdminSessionAuthError ? error.statusCode : 503;
    if (!(error instanceof AdminSessionAuthError)) {
      console.error(`[Admin Customers] Turso customer ${req.method === 'DELETE' ? 'delete' : 'query'} failed:`, error);
    }
    sendJson(res, status, {
      success: false,
      error: error instanceof AdminSessionAuthError
        ? error.message
        : req.method === 'DELETE' ? 'The customer could not be deleted.' : 'Customer records could not be loaded.',
    });
  }
}
