import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminSessionAuthError,
  authenticateAdminCredentials,
} from '../../../../auth/adminCredentialAuth.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../../../security/rateLimit.js';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

interface AdminLoginRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

export default async function handler(req: AdminLoginRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }

  try {
    const body = req.body && typeof req.body === 'object'
      ? req.body as Record<string, unknown>
      : {};
    // Platform-provided IP (not the spoofable X-Forwarded-For header).
    const clientKey = getClientIp(req);
    try {
      // Shared across all serverless instances, per 15 minutes: 10 attempts per IP and 30 per
      // email address. The overall cap is a high backstop only, so strangers guessing from many
      // addresses cannot lock the real admin out (as a low global cap allowed).
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
      await consumeRateLimit(`admin-login:ip:${clientKey}`, 10, LOGIN_WINDOW_MS);
      if (email) await consumeRateLimit(`admin-login:email:${email}`, 30, LOGIN_WINDOW_MS);
      await consumeRateLimit('admin-login:global', 2000, LOGIN_WINDOW_MS);
    } catch (limitError) {
      if (limitError instanceof RateLimitError) {
        res.statusCode = 429;
        res.setHeader('Retry-After', String(LOGIN_WINDOW_MS / 1000));
        res.end(JSON.stringify({ success: false, error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' }));
        return;
      }
      // Fail closed: never allow unlimited guessing when the limiter is unavailable.
      console.error('[Admin Auth] Login rate limiter unavailable:', limitError);
      res.statusCode = 503;
      res.end(JSON.stringify({ success: false, error: 'Sign-in is temporarily unavailable. Please try again shortly.' }));
      return;
    }
    const session = authenticateAdminCredentials(body.email, body.password, clientKey);
    res.setHeader('Set-Cookie', session.cookie);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, user: session.user, expiresAt: session.expiresAt }));
  } catch (error) {
    const status = error instanceof AdminSessionAuthError ? error.statusCode : 500;
    if (!(error instanceof AdminSessionAuthError)) {
      console.error('[Admin Auth] Credential login failed:', error);
    }
    res.statusCode = status;
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Admin sign-in failed.',
    }));
  }
}
