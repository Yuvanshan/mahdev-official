/**
 * POST /api/account/check
 *
 * Legacy compatibility endpoint. It intentionally does not disclose whether
 * an email, phone number or NIC belongs to a customer account.
 *
 * Request:  { email?, phone?, nic? }
 * Response: { success: true }
 *
 * Answers reveal whether an account exists, so the endpoint is strictly rate
 * limited per IP address and returns nothing else about the account.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';

interface AccountCheckRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

// Preserve shared abuse protection for legacy clients even though no account
// lookup is performed by this endpoint.
const CHECK_LIMIT = 10;
const CHECK_WINDOW_MS = 10 * 60_000;

function sendJson(response: ServerResponse, status: number, body: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(body));
}

export default async function handler(request: AccountCheckRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    sendJson(response, 405, { success: false, error: 'Only POST requests are supported.' });
    return;
  }
  try {
    await consumeRateLimit(`account-check:${getClientIp(request)}`, CHECK_LIMIT, CHECK_WINDOW_MS);
    sendJson(response, 200, { success: true });
  } catch (error) {
    if (error instanceof RateLimitError) {
      sendJson(response, error.statusCode, { success: false, error: error.message });
      return;
    }
    console.error('[Account check] Request failed:', error);
    sendJson(response, 500, { success: false, error: 'Could not check your details. Please try again.' });
  }
}
