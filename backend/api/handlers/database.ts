import type { IncomingMessage, ServerResponse } from 'node:http';
import { initializeTursoDatabase } from '../../db/tursoDatabase.js';
import { AdminSessionAuthError } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError } from '../../auth/firebaseIdToken.js';
import {
  authorizeDatabaseAction,
  handleTursoAction,
  type DatabaseAccess,
} from '../tursoRoutes.js';
import { getTursoDocument } from '../../db/tursoDatabase.js';
import { dispatchServerNotification } from '../../services/secureNotificationService.js';
import { changedPublicUrls, isIndexNowEnabled, submitToIndexNow } from '../../seo/indexNow.js';
import {
  consumeRateLimit,
  getClientIp,
  PUBLIC_SUBMISSION_LIMITS,
  RateLimitError,
} from '../../security/rateLimit.js';

interface TursoApiRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

let initialization: Promise<void> | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value: unknown, fallback: string, maxLength = 160): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/[\r\n]+/g, ' ').slice(0, maxLength)
    : fallback;
}

async function notifyForVerifiedSubmission(
  input: unknown,
  access: DatabaseAccess
): Promise<void> {
  if (access.role === 'admin' || !isRecord(input) || input.action !== 'write' || !isRecord(input.write)) {
    return;
  }

  const write = input.write;
  const collection = write.collection;
  if (
    (collection !== 'orders' && collection !== 'bookings') ||
    write.type !== 'set' ||
    write.merge === true ||
    typeof write.id !== 'string'
  ) {
    return;
  }

  const document = await getTursoDocument(collection, '', write.id);
  if (!document) {
    console.error(`[Turso API] Created ${collection} record ${write.id} could not be reloaded for its admin alert.`);
    return;
  }

  const data = document.data;
  const customer = isRecord(data.customer) ? data.customer : {};
  const customerName = safeText(customer.fullName || customer.name, 'Website customer');
  const recordId = safeText(document.id, 'unknown', 100);
  const type = collection === 'orders' ? 'admin_new_order' : 'admin_new_booking';
  const alertData = collection === 'orders'
    ? {
        orderId: recordId,
        customerName,
        customerEmail: safeText(customer.email || data.customerEmail || data.email, '', 254),
        total: typeof data.total === 'number' && Number.isFinite(data.total) ? data.total : undefined,
        currency: safeText(data.currency, '', 12),
        itemCount: Array.isArray(data.items) ? data.items.length : 0,
      }
    : {
        bookingId: recordId,
        customerName,
        customerEmail: safeText(customer.email || data.customerEmail || data.email, '', 254),
        serviceName: safeText(data.serviceName, 'Service booking'),
        date: safeText(data.date || data.bookingDate, 'Not specified', 40),
        time: safeText(data.time || data.bookingTime, 'Not specified', 40),
      };
  const message = collection === 'orders'
    ? `A new order was submitted by ${customerName}. Order reference: ${recordId}.`
    : `A new booking was submitted by ${customerName} for ${safeText(data.serviceName, 'a service')} on ${safeText(data.date || data.bookingDate, 'a date to be confirmed')}.`;
  const result = await dispatchServerNotification({
    type,
    recipient: { name: 'Mahdev Operations', email: 'admin@mahdev.lk', role: 'admin' },
    title: collection === 'orders' ? `New Order: ${recordId}` : `New Booking: ${recordId}`,
    message,
    data: alertData,
    channels: ['email'],
  });
  if (!result.success) {
    console.error(`[Turso API] Admin alert for ${collection} record ${recordId} was not delivered: ${result.message}`);
  }
}

function ensureDatabaseInitialized(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export async function handleTursoDatabaseRequest(
  req: TursoApiRequest,
  res: ServerResponse,
  fixedCollection?: string
): Promise<void> {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Only POST requests are supported.' }));
    return;
  }
  if (fixedCollection) {
    const body = req.body && typeof req.body === 'object'
      ? req.body as Record<string, unknown>
      : {};
    const targetCollection = body.action === 'write' && body.write && typeof body.write === 'object'
      ? (body.write as Record<string, unknown>).collection
      : body.collection;
    if (body.action === 'batch' || body.action === 'health' || targetCollection !== fixedCollection) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: 'The requested database collection does not match this API resource.',
      }));
      return;
    }
  }

  let access: DatabaseAccess;
  try {
    access = await authorizeDatabaseAction(
      req.body,
      Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie,
      Array.isArray(req.headers.authorization)
        ? req.headers.authorization[0]
        : req.headers.authorization
    );
  } catch (error) {
    const status = error instanceof AdminSessionAuthError || error instanceof FirebaseTokenError
      ? error.statusCode
      : 403;
    res.statusCode = status;
    res.end(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Admin authorization failed.',
    }));
    return;
  }

  try {
    await ensureDatabaseInitialized();
  } catch (error) {
    console.error('[Turso API] Database initialization failed:', error);
    res.statusCode = 503;
    res.end(JSON.stringify({
      success: false,
      error: 'Turso is unavailable or not configured. Check the server database environment.',
    }));
    return;
  }

  // Shared per-IP limits for anonymous submissions (forms, orders, analytics).
  if (access.role !== 'admin' && isRecord(req.body) && req.body.action === 'write' && isRecord(req.body.write)) {
    const collection = typeof req.body.write.collection === 'string' ? req.body.write.collection : '';
    const rule = PUBLIC_SUBMISSION_LIMITS[collection];
    if (rule) {
      try {
        await consumeRateLimit(`submit:${collection}:${getClientIp(req)}`, rule.limit, rule.windowMs);
      } catch (error) {
        if (!(error instanceof RateLimitError)) {
          console.error('[Turso API] Rate limiter unavailable:', error);
        } else {
          res.statusCode = 429;
          res.setHeader('Retry-After', String(Math.ceil(rule.windowMs / 1000)));
          res.end(JSON.stringify({ success: false, error: error.message }));
          return;
        }
      }
    }
  }

  const result = await handleTursoAction(req.body, access);
  if (result.status === 200 && result.body.success === true) {
    try {
      await notifyForVerifiedSubmission(req.body, access);
    } catch (error) {
      console.error('[Turso API] Verified submission alert failed:', error);
    }
    // Admin content changes: tell IndexNow search engines (Bing etc.) which public pages changed.
    if (access.role === 'admin' && isIndexNowEnabled()) {
      try {
        await submitToIndexNow(await changedPublicUrls(req.body));
      } catch (error) {
        console.error('[Turso API] IndexNow URLs could not be collected:', error);
      }
    }
  }
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}

export default function handler(req: TursoApiRequest, res: ServerResponse): Promise<void> {
  return handleTursoDatabaseRequest(req, res);
}
