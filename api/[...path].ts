import type { IncomingMessage, ServerResponse } from 'node:http';
import databaseHandler, { handleTursoDatabaseRequest } from '../backend/api/handlers/database.js';
import healthHandler from '../backend/api/handlers/health.js';
import mediaHandler from '../backend/api/handlers/upload/media.js';
import careerApplicationHandler from '../backend/api/handlers/careers/application.js';
import careerCvHandler from '../backend/api/handlers/careers/cv.js';
import careerStatusHandler from '../backend/api/handlers/careers/status.js';
import bookingSlipHandler from '../backend/api/handlers/bookingSlip.js';
import adminLoginHandler from '../backend/api/handlers/admin/auth/login.js';
import adminLogoutHandler from '../backend/api/handlers/admin/auth/logout.js';
import adminVerifyHandler from '../backend/api/handlers/admin/auth/verify.js';
import adminCustomersHandler from '../backend/api/handlers/admin/customers.js';
import notificationHandler from '../backend/api/handlers/notifications.js';
import publicEmailHandler from '../backend/api/handlers/publicEmail.js';
import sitemapHandler from '../backend/api/handlers/sitemap.js';
import publicSnapshotHandler, { publicInlineMediaHandler } from '../backend/api/handlers/publicSnapshot.js';
import analyticsHandler from '../backend/api/handlers/analytics.js';
import whatsappWebhookHandler from '../backend/api/handlers/whatsappWebhook.js';
import orderConfirmationsHandler from '../backend/api/handlers/orderConfirmations.js';
import accountCheckHandler from '../backend/api/handlers/accountCheck.js';
import accountRecoveryHandler from '../backend/api/handlers/accountRecovery.js';
import seasonalThemeHandler from '../backend/api/handlers/seasonalTheme.js';
import firebaseAuthProxy from '../backend/api/handlers/firebaseAuthProxy.js';
import { isFromThisSite } from '../backend/security/sameSite.js';
import pageShellHandler, { sendNotFoundPage } from '../backend/api/handlers/pageShell.js';

interface ApiRequest extends IncomingMessage {
  method?: string;
  url?: string;
  body?: unknown;
}

const MAX_JSON_BODY_BYTES = 4 * 1024 * 1024;
const ALLOWED_COLLECTION_NAME = /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/;

async function parseJsonBody(req: ApiRequest, res: ServerResponse, pathname: string): Promise<boolean> {
  if (
    req.body !== undefined ||
    pathname === '/api/upload/media' ||
    pathname === '/api/careers/cv' ||
    pathname === '/api/bookings/slip' ||
    pathname.startsWith('/api/firebase-auth/') ||
    pathname === '/api/firebase-auth' ||
    pathname.startsWith('/__/auth/') ||
    !req.headers['content-type']?.toLowerCase().includes('application/json') ||
    (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH')
  ) {
    return true;
  }

  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += data.length;
      if (size > MAX_JSON_BODY_BYTES) {
        res.statusCode = 413;
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'Request body exceeds the 4 MB limit.' }));
        return false;
      }
      chunks.push(data);
    }
    const rawBuffer = Buffer.concat(chunks);
    // Kept for handlers that verify a signature over the exact bytes (WhatsApp webhook).
    (req as ApiRequest & { rawBody?: Buffer }).rawBody = rawBuffer;
    const rawBody = rawBuffer.toString('utf8');
    req.body = rawBody ? JSON.parse(rawBody) : {};
    return true;
  } catch (error) {
    res.statusCode = 400;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: error instanceof SyntaxError ? 'Request body must contain valid JSON.' : 'Could not read request body.',
    }));
    return false;
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// API addresses a browser may legitimately open directly (downloads, feeds,
// status checks). Any other /api/ address opened in a browser shows the
// website's 404 page instead of raw JSON.
const BROWSER_VISIBLE_API_PATHS = new Set([
  '/api/sitemap',
  '/api/public/snapshot',
  '/api/health',
  '/api/careers/cv',
  '/api/careers/status',
  '/api/bookings/slip',
  '/api/admin/auth/verify',
  '/api/admin/customers',
  '/api/page-shell',
  '/api/webhook/whatsapp',
  '/api/firebase-auth',
]);

// A top-level browser navigation asks for HTML; fetch() calls from the app do not.
function isBrowserPageRequest(req: ApiRequest): boolean {
  const accept = String(req.headers.accept || '');
  const destination = String(req.headers['sec-fetch-dest'] || '');
  return (req.method === 'GET' || req.method === 'HEAD') &&
    (destination === 'document' || (!destination && accept.includes('text/html')));
}

// Data APIs used only by the website itself.
// Images under /api/public/media/ stay public so link previews and image search work.
// '/api/account/check' reveals whether an account exists, so only this site's pages may ask.
const SITE_ONLY_API_PREFIXES = ['/api/public/snapshot', '/api/database', '/api/data/', '/api/analytics', '/api/account/check', '/api/account/recovery'];


export default async function handler(req: ApiRequest, res: ServerResponse): Promise<void> {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (SITE_ONLY_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !isFromThisSite(req)) {
    await sendNotFoundPage(req, res);
    return;
  }
  if (
    pathname.startsWith('/api/') &&
    !BROWSER_VISIBLE_API_PATHS.has(pathname) &&
    !pathname.startsWith('/api/public/media/') &&
    !pathname.startsWith('/api/firebase-auth/') &&
    isBrowserPageRequest(req)
  ) {
    await sendNotFoundPage(req, res);
    return;
  }
  if (!(await parseJsonBody(req, res, pathname))) return;

  if (pathname.startsWith('/api/firebase-auth/') || pathname.startsWith('/__/auth/')) {
    await firebaseAuthProxy(req, res);
    return;
  }
  if (pathname === '/api/firebase-auth') {
    await firebaseAuthProxy(req, res);
    return;
  }
  if (pathname === '/api/sitemap') {
    await sitemapHandler(req, res);
    return;
  }
  if (pathname === '/api/notifications/dispatch') {
    await notificationHandler(req, res);
    return;
  }
  if (pathname === '/api/webhook/whatsapp') {
    await whatsappWebhookHandler(req, res);
    return;
  }
  if (pathname === '/api/order-confirmations' || pathname.startsWith('/api/order-confirmations/')) {
    await orderConfirmationsHandler(req, res);
    return;
  }
  if (pathname === '/api/account/check') {
    await accountCheckHandler(req, res);
    return;
  }
  if (pathname === '/api/account/recovery') {
    await accountRecoveryHandler(req, res);
    return;
  }
  if (pathname === '/api/seasonal-theme') {
    await seasonalThemeHandler(req, res);
    return;
  }
  if (pathname === '/api/contact/submit' || pathname === '/api/inquiries/submit') {
    await publicEmailHandler(req, res);
    return;
  }
  // Page requests rewritten here by vercel.json arrive with their ORIGINAL URL
  // (e.g. /admin, /services/abc), so anything outside /api/ is a page request.
  if (pathname === '/api/page-shell' || !pathname.startsWith('/api/')) {
    await pageShellHandler(req, res);
    return;
  }
  if (pathname === '/api/analytics') {
    await analyticsHandler(req, res);
    return;
  }
  if (pathname.startsWith('/api/public/media/')) {
    await publicInlineMediaHandler(req, res);
    return;
  }
  if (pathname === '/api/public/snapshot') {
    await publicSnapshotHandler(req, res);
    return;
  }
  if (pathname === '/api/database') {
    await databaseHandler(req, res);
    return;
  }
  if (pathname === '/api/health') {
    await healthHandler(req, res);
    return;
  }
  if (pathname === '/api/upload/media') {
    await mediaHandler(req, res);
    return;
  }
  if (pathname === '/api/careers/application') {
    await careerApplicationHandler(req, res);
    return;
  }
  if (pathname === '/api/careers/cv') {
    await careerCvHandler(req, res);
    return;
  }
  if (pathname === '/api/bookings/slip') {
    await bookingSlipHandler(req, res);
    return;
  }
  if (pathname === '/api/careers/status') {
    await careerStatusHandler(req, res);
    return;
  }
  if (pathname === '/api/admin/auth/login') {
    await adminLoginHandler(req, res);
    return;
  }
  if (pathname === '/api/admin/auth/logout') {
    adminLogoutHandler(req, res);
    return;
  }
  if (pathname === '/api/admin/auth/verify') {
    await adminVerifyHandler(req, res);
    return;
  }
  if (pathname === '/api/admin/customers') {
    await adminCustomersHandler(req, res);
    return;
  }
  if (pathname.startsWith('/api/data/')) {
    let collection: string;
    try {
      collection = decodeURIComponent(pathname.slice('/api/data/'.length));
    } catch {
      collection = '';
    }
    if (ALLOWED_COLLECTION_NAME.test(collection)) {
      await handleTursoDatabaseRequest(req, res, collection);
      return;
    }
    res.statusCode = 404;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'API resource not found.' }));
    return;
  }

  res.statusCode = 404;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    success: false,
    error: 'API endpoint not found.',
  }));
}
