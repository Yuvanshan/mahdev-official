/**
 * Emails sent after a customer creates an order or booking through the
 * database API. Runs only after the record is saved and re-read from the
 * database, so the details come from the stored record, not the request.
 *
 * - Every order or booking: alert email to the Mahdev team.
 * - "Book online" bookings: "booking request received" email to the customer,
 *   sent to the signed-in account's email (set by the server, not the browser).
 */

import { getTursoDocument } from '../db/tursoDatabase.js';
import type { DatabaseAccess } from '../api/tursoRoutes.js';
import { dispatchServerNotification } from './secureNotificationService.js';
import { sendCustomerEmail } from './emailService.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function safeText(value: unknown, fallback: string, maxLength = 160): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/[\r\n]+/g, ' ').slice(0, maxLength)
    : fallback;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

function formatLkr(amount: unknown): string {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0 ? `LKR ${value.toLocaleString('en-LK')}` : 'On quotation';
}

function formatDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function siteOrigin(): string {
  return (process.env.APP_URL || 'https://mahdev.lk').replace(/\/+$/, '');
}

/** Plain-text and HTML "booking request received" email for the customer. */
export function bookingReceivedEmail(id: string, data: Record<string, unknown>, customerName: string) {
  const firstName = customerName.split(' ')[0] || 'there';
  const location = isRecord(data.location) ? safeText(data.location.address, 'To be confirmed', 300) : 'To be confirmed';
  const lineItem = Array.isArray(data.lineItems) && isRecord(data.lineItems[0]) ? data.lineItems[0] : {};
  const quantity = Number(lineItem.quantity) > 1 ? ` x ${Number(lineItem.quantity)}` : '';
  const division = safeText(data.divisionName, 'Mahdev');
  const accountUrl = `${siteOrigin()}/account/bookings`;
  const rows: Array<[string, string]> = [
    ['Booking reference', id],
    ['Item', `${safeText(data.serviceName, 'Booking')}${quantity}`],
    ['Date', formatDate(safeText(data.date, '', 40))],
    ['Time', safeText(data.time, 'To be confirmed', 60)],
    ['Address', location],
    [Number(lineItem.quantity) > 1 ? 'Estimated total' : 'Price', formatLkr(data.price)],
  ];
  const text = [
    `Hello ${firstName},`,
    '',
    `Thank you for booking online with ${division}. We have received your booking request.`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'What happens next:',
    '1. Our team checks availability for your date.',
    '2. We confirm the final price and any advance with you on WhatsApp or email.',
    '3. Your booking is confirmed once we accept it. No payment has been taken yet.',
    '',
    `Follow your booking: ${accountUrl}`,
    '',
    'Cancellations and refunds follow our Refund and Cancellation Policy:',
    `${siteOrigin()}/refund-policy`,
    '',
    `${division},`,
    'Mahdev Pvt Ltd',
    'info.mahdev.lk@gmail.com | 075 092 8078 / 076 898 8970',
  ].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;max-width:560px">
<p>Hello ${escapeHtml(firstName)},</p>
<p>Thank you for booking online with ${escapeHtml(division)}. We have received your booking request.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">${rows
    .map(([label, value]) => `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:bold">${escapeHtml(value)}</td></tr>`)
    .join('')}</table>
<p><strong>What happens next</strong></p>
<ol style="padding-left:20px;margin-top:0">
<li>Our team checks availability for your date.</li>
<li>We confirm the final price and any advance with you on WhatsApp or email.</li>
<li>Your booking is confirmed once we accept it. No payment has been taken yet.</li>
</ol>
<p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#0052FF;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Track my booking</a></p>
<p style="font-size:13px;color:#64748b">Cancellations and refunds follow our <a href="${escapeHtml(`${siteOrigin()}/refund-policy`)}">Refund and Cancellation Policy</a>.</p>
<p>${escapeHtml(division)},<br>Mahdev Pvt Ltd<br>info.mahdev.lk@gmail.com | 075 092 8078 / 076 898 8970</p>
</div>`;
  return { subject: `Booking request received: ${id}`, text, html };
}

/** Sends the team alert (and, for online bookings, the customer email) for a new record. */
export async function notifyForVerifiedSubmission(input: unknown, access: DatabaseAccess): Promise<void> {
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
    console.error(`[Submission alerts] Created ${collection} record ${write.id} could not be reloaded for its alert.`);
    return;
  }

  const data = document.data;
  const customer = isRecord(data.customer) ? data.customer : {};
  const customerName = safeText(customer.fullName || customer.name, 'Website customer');
  // customerEmail is written by the server from the signed-in account.
  const accountEmail = safeText(data.customerEmail, '', 254);
  const customerEmail = accountEmail || safeText(customer.email || data.email, '', 254);
  const recordId = safeText(document.id, 'unknown', 100);
  const isOnlineBooking = collection === 'bookings' && data.source === 'online_booking';
  const type = collection === 'orders' ? 'admin_new_order' : 'admin_new_booking';
  const alertData = collection === 'orders'
    ? {
        orderId: recordId,
        customerName,
        customerEmail,
        total: typeof data.total === 'number' && Number.isFinite(data.total) ? data.total : undefined,
        currency: safeText(data.currency, '', 12),
        itemCount: Array.isArray(data.items) ? data.items.length : 0,
      }
    : {
        bookingId: recordId,
        source: isOnlineBooking ? 'Booked online' : safeText(data.source, 'Website booking', 40),
        customerName,
        customerEmail,
        customerPhone: safeText(customer.phone, '', 32),
        division: safeText(data.divisionName, '', 80),
        serviceName: safeText(data.serviceName, 'Service booking'),
        bookedItem: safeText(data.itemKind, '', 20),
        date: safeText(data.date || data.bookingDate, 'Not specified', 40),
        time: safeText(data.time || data.bookingTime, 'Not specified', 60),
        address: isRecord(data.location) ? safeText(data.location.address, '', 300) : '',
        quantity: Array.isArray(data.lineItems) && isRecord(data.lineItems[0]) ? Number(data.lineItems[0].quantity) || 1 : 1,
        estimatedTotal: formatLkr(data.price),
        notes: safeText(data.notes, '', 1000),
      };
  const message = collection === 'orders'
    ? `A new order was submitted by ${customerName}. Order reference: ${recordId}.`
    : `${isOnlineBooking ? 'A new online booking' : 'A new booking'} was submitted by ${customerName} for ${safeText(data.serviceName, 'a service')} on ${safeText(data.date || data.bookingDate, 'a date to be confirmed')}. Review and confirm it in Admin > Bookings.`;

  // New accounts have not verified their email yet, so the token carries none; use the
  // email saved on the customer's own account profile, as design confirmations do.
  let receiptEmail = accountEmail;
  if (isOnlineBooking && access.role === 'customer' && !receiptEmail && access.identity?.uid) {
    const profile = await getTursoDocument('users', '', access.identity.uid);
    receiptEmail = safeText(profile?.data.email, '', 254).toLowerCase();
  }

  const [teamAlert, customerMail] = await Promise.all([
    dispatchServerNotification({
      type,
      recipient: { name: 'Mahdev Operations', email: 'admin@mahdev.lk', role: 'admin' },
      title: collection === 'orders'
        ? `New Order: ${recordId}`
        : `${isOnlineBooking ? 'New Online Booking' : 'New Booking'}: ${recordId} (${safeText(data.serviceName, 'Service')})`,
      message,
      data: alertData,
      channels: ['email'],
    }),
    // Only to the account's own address, so the email cannot be sent to someone else.
    isOnlineBooking && access.role === 'customer' && receiptEmail
      ? sendCustomerEmail({ to: receiptEmail, ...bookingReceivedEmail(recordId, data, customerName) })
      : Promise.resolve(null),
  ]);

  if (!teamAlert.success) {
    console.error(`[Submission alerts] Team alert for ${collection} record ${recordId} was not delivered: ${teamAlert.message}`);
  }
  if (customerMail && !customerMail.delivered) {
    console.error(`[Submission alerts] Customer email for booking ${recordId} was not delivered: ${customerMail.notice}`);
  }
}
