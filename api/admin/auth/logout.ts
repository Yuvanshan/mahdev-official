import type { IncomingMessage, ServerResponse } from 'node:http';
import { clearAdminSessionCookie } from '../../../server/adminCredentialAuth';

export default function handler(req: IncomingMessage & { method?: string }, res: ServerResponse): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }
  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  res.statusCode = 200;
  res.end(JSON.stringify({ success: true }));
}
