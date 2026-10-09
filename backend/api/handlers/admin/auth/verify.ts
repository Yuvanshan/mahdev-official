import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  AdminSessionAuthError,
  getAdminSessionFromCookie,
} from '../../../../auth/adminCredentialAuth';

interface AdminAuthRequest extends IncomingMessage {
  method?: string;
}

export default async function handler(req: AdminAuthRequest, res: ServerResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Only GET requests are supported.' }));
    return;
  }

  try {
    const session = getAdminSessionFromCookie(req.headers.cookie);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, ...session }));
  } catch (error) {
    const status = error instanceof AdminSessionAuthError
      ? error.statusCode
      : 401;
    if (!(error instanceof AdminSessionAuthError)) {
      console.error('[Admin Auth] Admin session verification failed:', error);
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error instanceof AdminSessionAuthError
        ? error.message
        : 'Admin session could not be verified.',
    }));
  }
}
