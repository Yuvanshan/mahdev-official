import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminSessionAuthError,
  authenticateAdminCredentials,
} from '../../../../auth/adminCredentialAuth';

interface AdminLoginRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

export default function handler(req: AdminLoginRequest, res: ServerResponse): void {
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
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientKey = Array.isArray(forwardedFor)
      ? forwardedFor[0]?.split(',')[0]?.trim() || 'unknown'
      : forwardedFor?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
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
