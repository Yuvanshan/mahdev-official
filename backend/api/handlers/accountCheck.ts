/**
 * POST /api/account/check
 *
 * Tells the sign-up, "Book online" and password reset forms whether an email,
 * phone number or NIC already belongs to a customer account, so the visitor
 * can be asked to sign in (or to register) instead.
 *
 * Request:  { email?, phone?, nic? }
 * Response: { success: true, email?: Result, phone?: Result, nic?: Result }
 *           Result = 'taken' | 'available' | 'invalid'
 *
 * Answers reveal whether an account exists, so the endpoint is strictly rate
 * limited per IP address and returns nothing else about the account.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase, listTursoDocuments } from '../../db/tursoDatabase.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';
import { normaliseSriLankaPhone, parseNic } from '../../../src/utils/sriLankaIdentity.js';

interface AccountCheckRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

type CheckResult = 'taken' | 'available' | 'invalid';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Each request may check up to three fields; 10 requests per 10 minutes per IP (a form needs 1-2).
const CHECK_LIMIT = 10;
const CHECK_WINDOW_MS = 10 * 60_000;

let initialization: Promise<void> | undefined;

function ensureDatabase(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

/** True when a customer profile has this exact value in `field`. */
async function isRegistered(field: 'email' | 'phone' | 'nic', value: string): Promise<boolean> {
  const holders = await listTursoDocuments('users', '', [{ field, operator: '==', value }], undefined, 1);
  return holders.length > 0;
}

export async function checkAccountDetails(body: Record<string, unknown>): Promise<Record<string, CheckResult>> {
  const result: Record<string, CheckResult> = {};

  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase().slice(0, 254);
    result.email = !EMAIL_PATTERN.test(email) ? 'invalid' : (await isRegistered('email', email)) ? 'taken' : 'available';
  }
  if (typeof body.phone === 'string' && body.phone.trim()) {
    // Profiles store the +94 form, so the lookup uses the same form.
    const phone = normaliseSriLankaPhone(body.phone.slice(0, 40));
    result.phone = !phone ? 'invalid' : (await isRegistered('phone', phone)) ? 'taken' : 'available';
  }
  if (typeof body.nic === 'string' && body.nic.trim()) {
    const nic = parseNic(body.nic.slice(0, 20));
    result.nic = !nic ? 'invalid' : (await isRegistered('nic', nic.nic)) ? 'taken' : 'available';
  }
  return result;
}

export default async function handler(request: AccountCheckRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  const body = request.body && typeof request.body === 'object' && !Array.isArray(request.body)
    ? (request.body as Record<string, unknown>)
    : {};

  try {
    await ensureDatabase();
    await consumeRateLimit(`account-check:${getClientIp(request)}`, CHECK_LIMIT, CHECK_WINDOW_MS);
    sendJson(response, 200, { success: true, ...(await checkAccountDetails(body)) });
  } catch (error) {
    if (error instanceof RateLimitError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
      return;
    }
    console.error('[Account check] Request failed:', error);
    sendJson(response, 500, { success: false, error: 'Could not check your details. Please try again.' });
  }
}
