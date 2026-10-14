import type { IncomingMessage, ServerResponse } from 'node:http';
import notificationHandler from '../backend/api/handlers/notifications.js';
import publicEmailHandler from '../backend/api/handlers/publicEmail.js';

interface ApiRequest extends IncomingMessage {
  method?: string;
}

export default function handler(req: ApiRequest, res: ServerResponse): void | Promise<void> {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (pathname === '/api/notifications/dispatch') {
    return notificationHandler(req, res);
  }
  if (pathname === '/api/contact/submit' || pathname === '/api/inquiries/submit') {
    return publicEmailHandler(req, res);
  }

  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: false,
    error: 'API endpoint not found.',
  }));
}
