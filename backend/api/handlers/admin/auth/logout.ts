import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  clearAdminSessionCookie,
  requireAdminSession,
  revokeAdminSessions,
} from '../../../../auth/adminCredentialAuth.js';

/**
 * Signs the admin out. A valid session also ends every admin session issued
 * before now, so a copied cookie stops working instead of lasting 8 hours.
 */
export default async function handler(req: IncomingMessage & { method?: string }, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }
  try {
    // Only a signed-in admin can end the sessions; anyone else just has their cookie cleared.
    await requireAdminSession(req.headers.cookie);
    await revokeAdminSessions();
  } catch (error) {
    console.warn('[Admin Auth] Sign-out without a valid session:', error instanceof Error ? error.message : error);
  }
  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  res.statusCode = 200;
  res.end(JSON.stringify({ success: true }));
}
