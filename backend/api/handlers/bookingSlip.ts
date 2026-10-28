import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { getTursoDocument, initializeTursoDatabase, writeTursoDocument } from '../../db/tursoDatabase.js';
import { AdminSessionAuthError, requireAdminSession } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../../auth/firebaseIdToken.js';
import { consumeRateLimit, RateLimitError } from '../../security/rateLimit.js';
import { MAX_BOOKING_SLIP_BYTES, readBookingSlip, storeBookingSlip } from '../../services/adminMediaUpload.js';
import { sendAdminAlertEmail } from '../../services/emailService.js';

/**
 * Bank transfer slips for bookings.
 *
 *   POST /api/bookings/slip?id=BK-...&amount=5000   the booking's owner uploads a slip
 *        (raw file body; Firebase sign-in required). The slip is added to the booking's
 *        paymentSlips for the admin to accept or reject.
 *   GET  /api/bookings/slip?id=BK-...&slip=SLP-...  admin views a slip (admin session)
 *
 * Slips are kept in private storage and never served from a public URL.
 */

interface SlipRequest extends IncomingMessage {
  method?: string;
  url?: string;
  body?: unknown;
}

const BOOKING_ID = /^[A-Za-z0-9-]{1,40}$/;
const SLIP_ID = /^SLP-[A-Za-z0-9-]{1,40}$/;
const MAX_SLIPS_PER_BOOKING = 10;
// A customer can upload a few slips an hour (a wrong file, then the right one).
const UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
let databaseInitialization: Promise<void> | undefined;

class RequestError extends Error {
  constructor(message: string, readonly statusCode = 400) {
    super(message);
    this.name = 'RequestError';
  }
}

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

async function ensureDatabaseInitialized(): Promise<void> {
  databaseInitialization ??= initializeTursoDatabase().catch((error: unknown) => {
    databaseInitialization = undefined;
    throw error;
  });
  return databaseInitialization;
}

/** The raw body, already read by express.raw() or streamed here (Vercel). */
async function readBody(req: SlipRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_BOOKING_SLIP_BYTES) throw new RequestError('Upload a slip no larger than 10 MB.', 413);
    return req.body;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const data = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += data.length;
    if (size > MAX_BOOKING_SLIP_BYTES) throw new RequestError('Upload a slip no larger than 10 MB.', 413);
    chunks.push(data);
  }
  return Buffer.concat(chunks);
}

function bookingIdFrom(url: URL): string {
  const id = url.searchParams.get('id') || '';
  if (!BOOKING_ID.test(id)) throw new RequestError('A valid booking reference is required.');
  return id;
}

function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function uploadSlip(req: SlipRequest, url: URL): Promise<Record<string, unknown>> {
  const identity = await verifyFirebaseIdToken(header(req, 'authorization'));
  await consumeRateLimit(`booking-slip:${identity.uid}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS);

  const bookingId = bookingIdFrom(url);
  const amount = Math.round(Number(url.searchParams.get('amount')) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
    throw new RequestError('Enter the amount you transferred.');
  }

  await ensureDatabaseInitialized();
  const booking = await getTursoDocument('bookings', '', bookingId);
  // Someone else's booking is reported as missing, so references cannot be probed.
  const ownerId = booking?.data.customerId ?? booking?.data.uid;
  if (!booking || ownerId !== identity.uid) throw new RequestError('Booking not found.', 404);
  if (['cancelled', 'rejected', 'completed'].includes(String(booking.data.status))) {
    throw new RequestError('This booking is closed. Please contact us about your payment.', 409);
  }
  const existing = Array.isArray(booking.data.paymentSlips) ? (booking.data.paymentSlips as Record<string, unknown>[]) : [];
  if (existing.length >= MAX_SLIPS_PER_BOOKING) {
    throw new RequestError('This booking already has the maximum number of slips. Please contact us.', 409);
  }

  const body = await readBody(req);
  const { storagePath, contentType } = await storeBookingSlip({ bookingId, body });
  const rawName = header(req, 'x-slip-filename') || '';
  let fileName = 'transfer-slip';
  try {
    fileName = decodeURIComponent(rawName).replace(/[^\w.() -]/g, '_').slice(-120) || fileName;
  } catch {
    // Keep the default name.
  }
  const now = new Date().toISOString();
  const slip = {
    id: `SLP-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
    storagePath,
    fileName,
    contentType,
    size: body.length,
    amount,
    uploadedAt: now,
    status: 'submitted',
  };
  await writeTursoDocument({
    type: 'update',
    collection: 'bookings',
    parentPath: '',
    id: bookingId,
    data: { paymentSlips: [...existing, slip], updatedAt: now },
  });

  // Best effort: the slip is saved even if the email cannot be sent.
  const customer = (booking.data.customer || {}) as Record<string, unknown>;
  await sendAdminAlertEmail({
    type: 'admin_booking_payment_slip',
    subject: `Payment slip uploaded: ${bookingId}`,
    message: `${String(customer.fullName || 'A customer')} uploaded a bank transfer slip of ${formatLkr(amount)} for ${String(
      booking.data.serviceName || 'their booking'
    )}. Check it in Admin → Bookings and accept it to confirm the booking.`,
    data: { bookingId, slipId: slip.id, amount, customerPhone: customer.phone },
  }).catch((error: unknown) => console.error('[BookingSlip] Admin alert failed:', error));

  return { slip };
}

async function sendSlipFile(req: SlipRequest, res: ServerResponse, url: URL): Promise<void> {
  await requireAdminSession(req.headers.cookie);
  const bookingId = bookingIdFrom(url);
  const slipId = url.searchParams.get('slip') || '';
  if (!SLIP_ID.test(slipId)) throw new RequestError('A valid slip reference is required.');

  await ensureDatabaseInitialized();
  const booking = await getTursoDocument('bookings', '', bookingId);
  const slips = Array.isArray(booking?.data.paymentSlips) ? (booking!.data.paymentSlips as Record<string, unknown>[]) : [];
  const slip = slips.find((entry) => entry.id === slipId);
  if (!slip || typeof slip.storagePath !== 'string') throw new RequestError('Slip not found.', 404);

  const file = await readBookingSlip(slip.storagePath);
  const extension = slip.storagePath.split('.').pop();
  res.statusCode = 200;
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Type', file.contentType);
  // Only validated images and PDFs are stored, so they can open in the browser.
  res.setHeader('Content-Disposition', `inline; filename="${bookingId}-${slipId}.${extension}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(file.body);
}

export default async function handler(req: SlipRequest, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', 'http://localhost');
  try {
    if (req.method === 'POST') {
      sendJson(res, 201, { success: true, ...(await uploadSlip(req, url)) });
      return;
    }
    if (req.method === 'GET') {
      await sendSlipFile(req, res, url);
      return;
    }
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  } catch (error) {
    if (
      error instanceof RequestError ||
      error instanceof AdminSessionAuthError ||
      error instanceof FirebaseTokenError ||
      error instanceof RateLimitError
    ) {
      sendJson(res, error.statusCode, { success: false, error: error.message });
      return;
    }
    // Validation messages from storeBookingSlip.
    if (error instanceof Error && /Upload|slip no larger|Invalid booking/.test(error.message)) {
      sendJson(res, 400, { success: false, error: error.message });
      return;
    }
    console.error('[BookingSlip] Request failed:', error);
    sendJson(res, 503, { success: false, error: 'The slip could not be processed. Please try again.' });
  }
}
