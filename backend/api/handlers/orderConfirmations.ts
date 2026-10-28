import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  getTursoDocument,
  initializeTursoDatabase,
  listTursoDocuments,
  writeTursoBatch,
  writeTursoDocument,
  type TursoDocument,
} from '../../db/tursoDatabase.js';
import { AdminSessionAuthError, requireAdminSession } from '../../auth/adminCredentialAuth.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from '../../auth/firebaseIdToken.js';
import { consumeRateLimit, getClientIp, RateLimitError } from '../../security/rateLimit.js';
import { sendAdminAlertEmail, sendCustomerEmail } from '../../services/emailService.js';
import { normaliseSriLankaPhone, parseNic } from '../../../src/utils/sriLankaIdentity.js';
import { BANK_DETAILS } from '../../../src/config/company.js';

/**
 * Design order confirmations.
 *
 * After a customer approves a design, an admin creates a confirmation (design
 * images + decoration line items) and shares its one-time link. The customer
 * opens /confirm-order/{token}, creates an account (or signs in) and confirms;
 * that creates their booking, which then shows in their account with its progress,
 * payments and invoice, and a confirmation is emailed to them. WhatsApp messages are
 * sent by the admin with click-to-chat buttons (the Cloud API is not used yet).
 *
 *   Admin (session cookie)
 *     GET  /api/order-confirmations          list
 *     POST /api/order-confirmations          create
 *     POST /api/order-confirmations/send     email the link to the customer
 *     POST /api/order-confirmations/log-whatsapp   record a manual WhatsApp share
 *     POST /api/order-confirmations/cancel   withdraw a pending link
 *     POST /api/order-confirmations/delete   remove a link (a confirmed link's booking is kept)
 *   Customer (link token)
 *     GET  /api/order-confirmations/public?token=   what the customer sees
 *     POST /api/order-confirmations/check           is this email / NIC already registered?
 *     POST /api/order-confirmations/confirm         confirm (Firebase sign-in required)
 */

interface ConfirmationRequest extends IncomingMessage {
  method?: string;
  url?: string;
  body?: unknown;
}

const COLLECTION = 'orderConfirmations';
const MAX_ITEMS = 50;
const MAX_IMAGES = 10;
const DEFAULT_EXPIRY_DAYS = 14;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ConfirmationStatus = 'pending' | 'confirmed' | 'cancelled';

interface ConfirmationItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function amount(value: unknown, label: string): number {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0 || number > 1_000_000_000) {
    throw new RequestError(`${label} must be a positive amount.`);
  }
  return Math.round(number * 100) / 100;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function formatLkr(value: number): string {
  return `Rs. ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function header(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function siteOrigin(value: unknown): string {
  // The admin's browser origin, so links work on preview deployments too.
  try {
    const url = new URL(String(value));
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
  } catch {
    // Fall through to the configured site address.
  }
  return (process.env.APP_URL || 'https://mahdev.lk').replace(/\/+$/, '');
}

function shareUrl(data: Record<string, unknown>): string {
  return `${siteOrigin(data.siteOrigin)}/confirm-order/${data.token}`;
}

/** Pending links past their expiry date are reported as expired. */
function effectiveStatus(data: Record<string, unknown>): ConfirmationStatus | 'expired' {
  const status = data.status as ConfirmationStatus;
  if (status === 'pending' && typeof data.expiresAt === 'string' && Date.parse(data.expiresAt) < Date.now()) {
    return 'expired';
  }
  return status;
}

let initialization: Promise<void> | undefined;
function ensureDatabase(): Promise<void> {
  initialization ??= initializeTursoDatabase().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

async function findByToken(token: unknown): Promise<TursoDocument> {
  // Tokens are 64 hex characters (older links: 43 base64url); anything else is not worth a query.
  if (typeof token !== 'string' || !/^(?:[a-f0-9]{64}|[A-Za-z0-9_-]{43})$/.test(token)) {
    throw new RequestError('This confirmation link is not valid.', 404);
  }
  const [document] = await listTursoDocuments(COLLECTION, '', [{ field: 'token', operator: '==', value: token }], undefined, 1);
  if (!document) throw new RequestError('This confirmation link is not valid.', 404);
  return document;
}

function parseItems(value: unknown): ConfirmationItem[] {
  if (!Array.isArray(value) || value.length === 0) throw new RequestError('Add at least one decoration item.');
  if (value.length > MAX_ITEMS) throw new RequestError(`A confirmation can have at most ${MAX_ITEMS} items.`);
  return value.map((raw, index) => {
    const item = isRecord(raw) ? raw : {};
    const name = text(item.name, 120);
    if (!name) throw new RequestError(`Item ${index + 1} needs a name.`);
    const quantity = Number(item.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) {
      throw new RequestError(`Item ${index + 1} needs a whole-number quantity.`);
    }
    return {
      name,
      description: text(item.description, 1000),
      quantity,
      unitPrice: amount(item.unitPrice, `Item ${index + 1} price`),
    };
  });
}

function parseImages(value: unknown): string[] {
  const images = (Array.isArray(value) ? value : [])
    .map((image) => text(image, 2048))
    .filter(Boolean);
  if (images.length === 0) throw new RequestError('Add at least one design image.');
  if (images.length > MAX_IMAGES) throw new RequestError(`Add at most ${MAX_IMAGES} design images.`);
  for (const image of images) {
    // Uploaded media URLs only; inline data: images are too large for the record.
    if (!/^https?:\/\//i.test(image) && !image.startsWith('/')) {
      throw new RequestError('Design images must be uploaded image URLs.');
    }
  }
  return images;
}

function totals(items: ConfirmationItem[], discount: number, deliveryFee: number) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100;
  if (discount > subtotal) throw new RequestError('The discount cannot be more than the subtotal.');
  return { subtotal, total: Math.round((subtotal - discount + deliveryFee) * 100) / 100 };
}

/** What the customer's link shows: no token, admin details or internal fields. */
function publicView(document: TursoDocument) {
  const data = document.data;
  return {
    reference: document.id,
    status: effectiveStatus(data),
    title: data.title,
    divisionName: data.divisionName,
    customerName: data.customerName,
    customerEmail: data.customerEmail || '',
    customerPhone: data.customerPhone || '',
    designImages: data.designImages,
    items: data.items,
    eventDate: data.eventDate || '',
    eventTime: data.eventTime || '',
    venue: data.venue || '',
    notes: data.notes || '',
    subtotal: data.subtotal,
    discount: data.discount,
    deliveryFee: data.deliveryFee,
    advanceAmount: data.advanceAmount,
    total: data.total,
    currency: data.currency,
    expiresAt: data.expiresAt,
    bookingId: data.status === 'confirmed' ? bookingIdFor(data) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function requireAdmin(req: IncomingMessage) {
  return (await requireAdminSession(header(req, 'cookie'))).user;
}

async function listConfirmations(): Promise<Record<string, unknown>> {
  const documents = await listTursoDocuments(COLLECTION, '', [], { field: 'createdAt', direction: 'desc' }, 500);
  return {
    confirmations: documents.map((document) => ({
      ...document.data,
      id: document.id,
      status: effectiveStatus(document.data),
      bookingId: bookingIdFor(document.data),
      shareUrl: shareUrl(document.data),
    })),
  };
}

async function createConfirmation(body: Record<string, unknown>, adminEmail: string): Promise<Record<string, unknown>> {
  const customerName = text(body.customerName, 100);
  if (customerName.length < 2) throw new RequestError('Enter the customer name.');
  const customerEmail = text(body.customerEmail, 254).toLowerCase();
  if (customerEmail && !EMAIL_PATTERN.test(customerEmail)) throw new RequestError('Enter a valid customer email.');
  const rawPhone = text(body.customerPhone, 32);
  const customerPhone = rawPhone ? normaliseSriLankaPhone(rawPhone) : '';
  if (rawPhone && !customerPhone) throw new RequestError('Enter a valid Sri Lankan phone number.');
  const title = text(body.title, 140);
  if (!title) throw new RequestError('Enter a title for the design.');

  const items = parseItems(body.items);
  const discount = amount(body.discount, 'Discount');
  const deliveryFee = amount(body.deliveryFee, 'Delivery fee');
  const { subtotal, total } = totals(items, discount, deliveryFee);
  const advanceAmount = amount(body.advanceAmount, 'Advance');
  if (advanceAmount > total) throw new RequestError('The advance cannot be more than the total.');
  const expiryDays = Number(body.expiresInDays ?? DEFAULT_EXPIRY_DAYS);
  if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 60) {
    throw new RequestError('The link must expire within 1 to 60 days.');
  }

  const now = new Date();
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  const id = `OC-${now.getFullYear()}-${suffix}`;
  const data: Record<string, unknown> = {
    // Hex only: WhatsApp reads "_" and "~" in a message as formatting and can break
    // a link that contains them (base64url tokens did), and hex survives any case change.
    token: randomBytes(32).toString('hex'),
    status: 'pending' satisfies ConfirmationStatus,
    title,
    divisionId: text(body.divisionId, 40) || 'sws',
    divisionName: text(body.divisionName, 80) || 'SWS Event Management',
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    designImages: parseImages(body.designImages),
    items,
    eventDate: text(body.eventDate, 10),
    eventTime: text(body.eventTime, 60),
    venue: text(body.venue, 300),
    notes: text(body.notes, 2000),
    subtotal,
    discount,
    deliveryFee,
    advanceAmount,
    total,
    currency: 'LKR',
    // Allocated now so a repeated confirm can never create a second booking.
    bookingId: `BK-${now.getFullYear()}-DC${suffix}`,
    siteOrigin: siteOrigin(body.siteOrigin),
    expiresAt: new Date(now.getTime() + expiryDays * 86_400_000).toISOString(),
    createdBy: adminEmail,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    shareLog: [],
  };
  await writeTursoDocument({ type: 'set', collection: COLLECTION, parentPath: '', id, data });
  return { confirmation: { ...data, id, shareUrl: shareUrl(data) } };
}

/** Sign-off: the division, then the company ("SWS Event Management," / "Mahdev Pvt Ltd"). */
function signature(divisionName: unknown): string[] {
  return typeof divisionName === 'string' && divisionName ? [`${divisionName},`, 'Mahdev Pvt Ltd'] : ['Mahdev Pvt Ltd'];
}

function linkMessage(data: Record<string, unknown>): string {
  const firstName = String(data.customerName || '').split(' ')[0] || 'there';
  const expires = new Date(String(data.expiresAt)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return [
    `Hello ${firstName},`,
    '',
    `Thank you for approving your design "${data.title}" with ${data.divisionName || 'Mahdev'}.`,
    '',
    'Please review the design and decoration details, enter your details and confirm your order here:',
    shareUrl(data),
    '',
    `This link is valid until ${expires}.`,
    '',
    ...signature(data.divisionName),
  ].join('\n');
}

/** Emails the link to the customer. WhatsApp is shared by the admin by hand for now. */
async function sendLink(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = text(body.id, 40);
  const document = id ? await getTursoDocument(COLLECTION, '', id) : null;
  if (!document) throw new RequestError('Confirmation not found.', 404);
  if (effectiveStatus(document.data) !== 'pending') throw new RequestError('Only pending links can be sent.');
  const data = document.data;
  if (!data.customerEmail) {
    return { email: { delivered: false, notice: 'No customer email on this confirmation.' } };
  }

  const message = linkMessage(data);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.6">${
    escapeHtml(message).replace(/\n/g, '<br>')
  }<p><a href="${escapeHtml(shareUrl(data))}" style="display:inline-block;background:#0052FF;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Review &amp; confirm my order</a></p></div>`;
  const sent = await sendCustomerEmail({
    to: String(data.customerEmail),
    subject: `Please confirm your order: ${data.title}`,
    html,
    text: message,
  });
  const at = new Date().toISOString();
  await writeTursoDocument({
    type: 'update',
    collection: COLLECTION,
    parentPath: '',
    id,
    data: { shareLog: { __tursoArrayUnion: [{ channel: 'email', delivered: sent.delivered, at }] }, updatedAt: at },
  });
  return { email: { delivered: sent.delivered, notice: sent.notice } };
}

async function cancelConfirmation(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = text(body.id, 40);
  const document = id ? await getTursoDocument(COLLECTION, '', id) : null;
  if (!document) throw new RequestError('Confirmation not found.', 404);
  if (document.data.status !== 'pending') throw new RequestError('Only pending links can be cancelled.');
  await writeTursoDocument({
    type: 'update',
    collection: COLLECTION,
    parentPath: '',
    id,
    data: { status: 'cancelled', cancelledAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  });
  return {};
}

/**
 * Deletes a confirmation link. A confirmed link's booking is kept (it is the
 * customer's record); only the link and its share history are removed.
 */
async function deleteConfirmation(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = text(body.id, 40);
  const document = id ? await getTursoDocument(COLLECTION, '', id) : null;
  if (!document) throw new RequestError('Confirmation not found.', 404);
  await writeTursoDocument({ type: 'delete', collection: COLLECTION, parentPath: '', id });
  return {};
}

/** The admin opened WhatsApp with the link or receipt; kept in the share history. */
async function logWhatsAppShare(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const id = text(body.id, 40);
  const document = id ? await getTursoDocument(COLLECTION, '', id) : null;
  if (!document) throw new RequestError('Confirmation not found.', 404);
  const entry = {
    channel: body.kind === 'receipt' ? 'whatsapp_receipt' : 'whatsapp',
    delivered: true,
    manual: true,
    at: new Date().toISOString(),
  };
  await writeTursoDocument({
    type: 'update',
    collection: COLLECTION,
    parentPath: '',
    id,
    data: { shareLog: { __tursoArrayUnion: [entry] }, updatedAt: entry.at },
  });
  return {};
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

async function isEmailRegistered(email: string): Promise<boolean> {
  const holders = await listTursoDocuments('users', '', [{ field: 'email', operator: '==', value: email }], undefined, 1);
  return holders.length > 0;
}

async function isNicRegistered(nic: string): Promise<boolean> {
  const holders = await listTursoDocuments('users', '', [{ field: 'nic', operator: '==', value: nic }], undefined, 1);
  return holders.length > 0;
}

/**
 * Live form checks. Only answered for a valid pending link, so the endpoint
 * cannot be used to probe the customer list without one.
 */
async function checkDetails(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const document = await findByToken(body.token);
  if (effectiveStatus(document.data) !== 'pending') throw new RequestError('This confirmation link is no longer active.', 410);

  const result: Record<string, unknown> = {};
  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase().slice(0, 254);
    result.email = !EMAIL_PATTERN.test(email) ? 'invalid' : (await isEmailRegistered(email)) ? 'taken' : 'available';
  }
  if (typeof body.nic === 'string' && body.nic.trim()) {
    const nic = parseNic(body.nic);
    result.nic = !nic ? 'invalid' : (await isNicRegistered(nic.nic)) ? 'taken' : 'available';
  }
  return result;
}

/**
 * The confirmation's booking ID. Links created before bookings were used only
 * stored an order ID; the same suffix keeps one booking per link either way.
 */
function bookingIdFor(data: Record<string, unknown>): string {
  return typeof data.bookingId === 'string' && data.bookingId
    ? data.bookingId
    : String(data.orderId || '').replace(/^ORD-/, 'BK-');
}

function bookingFromConfirmation(
  confirmationId: string,
  data: Record<string, unknown>,
  customer: { uid: string; name: string; email: string; phone: string },
  extras: { address: string; notes: string }
): Record<string, unknown> {
  const now = new Date().toISOString();
  const bookingId = bookingIdFor(data);
  const images = data.designImages as string[];
  const venue = String(data.venue || '');
  return {
    id: bookingId,
    customerId: customer.uid,
    customerEmail: customer.email,
    customerName: customer.name,
    customerPhone: customer.phone,
    customer: { fullName: customer.name, email: customer.email, phone: customer.phone, preferredContactMethod: 'whatsapp' },
    divisionId: data.divisionId,
    divisionName: data.divisionName,
    bookingType: 'event',
    serviceId: confirmationId,
    serviceName: data.title,
    serviceImageUrl: images[0] || '',
    packageId: 'design-confirmation',
    packageName: 'Custom design',
    date: data.eventDate || '',
    time: data.eventTime || 'To be confirmed',
    location: { type: 'venue', address: extras.address || venue || 'To be confirmed', venueName: venue || undefined },
    notes: extras.notes,
    price: data.total,
    currency: data.currency,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    lineItems: data.items,
    subtotal: data.subtotal,
    discount: data.discount,
    deliveryFee: data.deliveryFee,
    advanceAmount: data.advanceAmount,
    amountPaid: 0,
    payments: [],
    invoiceNumber: bookingId.replace(/^BK-/, 'INV-'),
    termsNotes: data.notes || undefined,
    designTitle: data.title,
    designImages: images,
    source: 'design_confirmation',
    confirmationId,
    createdAt: now,
    updatedAt: now,
  };
}

function bankLines(): string[] {
  return [
    'Payment details:',
    `Account name: ${BANK_DETAILS.accountName}`,
    `Bank: ${BANK_DETAILS.bankName}`,
    ...(BANK_DETAILS.branch ? [`Branch: ${BANK_DETAILS.branch}`] : []),
    ...(BANK_DETAILS.accountNumber ? [`Account number: ${BANK_DETAILS.accountNumber}`] : []),
  ];
}

function receipt(booking: Record<string, unknown>, origin: string, divisionName: unknown) {
  const items = booking.lineItems as ConfirmationItem[];
  const firstName = String(booking.customerName).split(' ')[0];
  const accountUrl = `${origin}/account/bookings`;
  const lineTotal = (item: ConfirmationItem) => Math.round(item.quantity * item.unitPrice * 100) / 100;
  const advance = Number(booking.advanceAmount) || 0;
  const total = Number(booking.price);
  const textBody = [
    `Hello ${firstName},`,
    '',
    `Your booking ${booking.id} for "${booking.designTitle}" is confirmed. Thank you!`,
    '',
    ...items.map((item) => `- ${item.name} x${item.quantity}: ${formatLkr(lineTotal(item))}`),
    `Total: ${formatLkr(total)}`,
    ...(advance ? [`Advance to reserve the date: ${formatLkr(advance)}`] : []),
    '',
    ...bankLines(),
    '',
    `Track progress and view your invoice: ${accountUrl}`,
    '',
    ...signature(divisionName),
  ].join('\n');
  const rows = items.map((item) => `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(item.name)}${
    item.description ? `<br><span style="color:#64748b;font-size:12px">${escapeHtml(item.description)}</span>` : ''
  }</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right">${formatLkr(lineTotal(item))}</td></tr>`).join('');
  const image = (booking.designImages as string[])[0];
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;max-width:620px;margin:auto">
<h2 style="margin:0 0 8px">Your booking is confirmed</h2>
<p>Hello ${escapeHtml(firstName)}, thank you for confirming <strong>${escapeHtml(String(booking.designTitle))}</strong>. Your booking reference is <strong>${escapeHtml(String(booking.id))}</strong>.</p>
${image && /^https?:\/\//.test(image) ? `<img src="${escapeHtml(image)}" alt="Your approved design" style="width:100%;border-radius:12px;margin:8px 0">` : ''}
<table style="width:100%;border-collapse:collapse;margin:12px 0"><thead><tr style="background:#f1f5f9"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<p style="text-align:right;font-size:16px"><strong>Total: ${formatLkr(total)}</strong>${advance ? `<br><span style="font-size:13px">Advance to reserve the date: ${formatLkr(advance)}</span>` : ''}</p>
<p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:13px">${bankLines().map(escapeHtml).join('<br>')}</p>
<p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#0052FF;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Track my booking &amp; invoice</a></p>
<p style="color:#64748b;font-size:12px">${signature(divisionName).map(escapeHtml).join('<br>')}</p></div>`;
  return { text: textBody, html };
}

async function confirmOrder(req: IncomingMessage, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const identity = await verifyFirebaseIdToken(header(req, 'authorization'));
  const document = await findByToken(body.token);
  const data = document.data;

  // Confirming twice (double click, retry after a lost response) returns the same booking.
  if (data.status === 'confirmed') {
    if (data.customerId === identity.uid) return { bookingId: bookingIdFor(data), alreadyConfirmed: true };
    throw new RequestError('This order has already been confirmed.', 409);
  }
  const status = effectiveStatus(data);
  if (status !== 'pending') {
    throw new RequestError(status === 'expired'
      ? 'This confirmation link has expired. Please ask us for a new one.'
      : 'This confirmation link is no longer active.', 410);
  }

  // Customer details come from the saved account, not from the request.
  const profile = await getTursoDocument('users', '', identity.uid);
  if (!profile) throw new RequestError('Please finish creating your account, then confirm again.', 409);
  const customer = {
    uid: identity.uid,
    name: text(profile.data.name, 100) || String(data.customerName),
    email: text(profile.data.email, 254).toLowerCase() || identity.email || '',
    phone: text(profile.data.phone, 32),
  };
  if (!customer.phone || !profile.data.nic) {
    throw new RequestError('Please add your contact number and NIC to your account, then confirm again.', 409);
  }

  const booking = bookingFromConfirmation(document.id, data, customer, {
    address: text(body.address, 300),
    notes: text(body.notes, 1000),
  });
  const confirmedAt = String(booking.createdAt);
  // Booking and link status change together.
  await writeTursoBatch([
    { type: 'set', collection: 'bookings', parentPath: '', id: String(booking.id), data: booking },
    {
      type: 'update',
      collection: COLLECTION,
      parentPath: '',
      id: document.id,
      data: {
        status: 'confirmed',
        confirmedAt,
        customerId: identity.uid,
        bookingId: booking.id,
        // The account's details, used by the admin's WhatsApp confirmation button.
        confirmedCustomer: { name: customer.name, email: customer.email, phone: customer.phone },
        updatedAt: confirmedAt,
      },
    },
  ]);

  // Booking is saved; messages are best effort and reported back to the page.
  const message = receipt(booking, siteOrigin(data.siteOrigin), data.divisionName);
  const [email] = await Promise.all([
    customer.email
      ? sendCustomerEmail({ to: customer.email, subject: `Booking confirmed: ${booking.id}`, html: message.html, text: message.text })
      : Promise.resolve({ delivered: false, notice: 'No email on the account.' }),
    sendAdminAlertEmail({
      type: 'admin_new_booking',
      subject: `Design booking confirmed: ${booking.id} (${data.title})`,
      message: `${customer.name} confirmed "${data.title}" for ${formatLkr(Number(booking.price))}. Record the advance in Bookings and send the WhatsApp confirmation from Design Confirmations.`,
      data: { bookingId: booking.id, confirmationId: document.id, customerPhone: customer.phone, eventDate: data.eventDate },
    }).catch((error: unknown) => console.error('[OrderConfirmation] Admin alert failed:', error)),
  ]);
  await writeTursoDocument({
    type: 'update',
    collection: COLLECTION,
    parentPath: '',
    id: document.id,
    data: { confirmationSent: { email: email.delivered } },
  }).catch((error: unknown) => console.error('[OrderConfirmation] Could not record delivery:', error));

  return { bookingId: booking.id, emailSent: email.delivered };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export default async function handler(req: ConfirmationRequest, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', 'http://localhost');
  // Express mounts this under /api, Vercel passes the full path.
  const action = url.pathname.replace(/^\/api/, '').replace(/^\/order-confirmations\/?/, '').replace(/\/+$/, '');
  const body = isRecord(req.body) ? req.body : {};
  const ip = getClientIp(req);

  try {
    await ensureDatabase();
    let result: Record<string, unknown>;
    if (action === '' && req.method === 'GET') {
      await requireAdmin(req);
      result = await listConfirmations();
    } else if (action === '' && req.method === 'POST') {
      result = await createConfirmation(body, (await requireAdmin(req)).email);
    } else if (action === 'send' && req.method === 'POST') {
      await requireAdmin(req);
      result = await sendLink(body);
    } else if (action === 'delete' && req.method === 'POST') {
      await requireAdmin(req);
      result = await deleteConfirmation(body);
    } else if (action === 'log-whatsapp' && req.method === 'POST') {
      await requireAdmin(req);
      result = await logWhatsAppShare(body);
    } else if (action === 'cancel' && req.method === 'POST') {
      await requireAdmin(req);
      result = await cancelConfirmation(body);
    } else if (action === 'public' && req.method === 'GET') {
      await consumeRateLimit(`order-confirmation-view:${ip}`, 60, 10 * 60_000);
      result = { confirmation: publicView(await findByToken(url.searchParams.get('token'))) };
    } else if (action === 'check' && req.method === 'POST') {
      await consumeRateLimit(`order-confirmation-check:${ip}`, 40, 10 * 60_000);
      result = await checkDetails(body);
    } else if (action === 'confirm' && req.method === 'POST') {
      await consumeRateLimit(`order-confirmation-confirm:${ip}`, 10, 60 * 60_000);
      result = await confirmOrder(req, body);
    } else {
      sendJson(res, 404, { success: false, error: 'API endpoint not found.' });
      return;
    }
    sendJson(res, 200, { success: true, ...result });
  } catch (error) {
    const known = error instanceof RequestError ||
      error instanceof AdminSessionAuthError ||
      error instanceof FirebaseTokenError ||
      error instanceof RateLimitError;
    if (!known) console.error('[OrderConfirmation] Request failed:', error);
    sendJson(res, known ? (error as { statusCode: number }).statusCode : 500, {
      success: false,
      error: known ? (error as Error).message : 'Something went wrong. Please try again.',
    });
  }
}
