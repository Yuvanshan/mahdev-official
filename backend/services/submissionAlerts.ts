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
import { BANK_DETAILS } from '../../src/config/company.js';

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
  const bankRows: Array<[string, string]> = ([
    ['Account name', BANK_DETAILS.accountName],
    ['Bank', BANK_DETAILS.bankName],
    ['Branch', BANK_DETAILS.branch],
    ['Account number', BANK_DETAILS.accountNumber],
    ['Reference', id],
  ] as Array<[string, string]>).filter(([, value]) => value);
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
    'Pay the advance by bank transfer once we confirm the amount:',
    ...bankRows.map(([label, value]) => `${label}: ${value}`),
    'Please send the transfer slip on WhatsApp (075 092 8078) with your booking reference.',
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
<p><strong>Pay the advance by bank transfer</strong> once we confirm the amount:</p>
<table style="border-collapse:collapse;width:100%;font-size:14px;margin:0 0 8px">${bankRows
    .map(([label, value]) => `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:bold">${escapeHtml(value)}</td></tr>`)
    .join('')}</table>
<p style="font-size:13px;color:#64748b">Please send the transfer slip on WhatsApp (075 092 8078) with your booking reference.</p>
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
  // customerEmail (verified) and contactEmail (not yet verified) are written by the
  // server from the signed-in account; browser-sent email fields are removed.
  const customerEmail = safeText(data.customerEmail || data.contactEmail || customer.email || data.email, '', 254);
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

  // The confirmation goes only to the sign-in account's own email (from its verified
  // token), never to an address taken from the booking. New accounts are not verified yet,
  // so their sign-in email is used.
  const receiptEmail = access.role === 'customer'
    ? safeText(access.identity?.email || access.identity?.accountEmail, '', 254).toLowerCase()
    : '';

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

/** "Booking / order confirmed" email for the customer, with how to pay the advance. */
export function confirmedEmail(collection: 'orders' | 'bookings', id: string, data: Record<string, unknown>, customerName: string) {
  const firstName = customerName.split(' ')[0] || 'there';
  const isBooking = collection === 'bookings';
  const division = safeText(data.divisionName, 'Mahdev');
  const accountUrl = `${siteOrigin()}/account/${isBooking ? 'bookings' : 'orders'}`;
  const total = Number(isBooking ? data.price : data.total ?? data.grandTotal);
  const paid = Number(data.amountPaid) || 0;
  const advance = Number(data.advanceAmount) || 0;
  const toPay = advance > paid ? advance - paid : Math.max(0, total - paid);
  const location = isRecord(data.location) ? safeText(data.location.address, '', 300) : '';
  const rows: Array<[string, string]> = ([
    [isBooking ? 'Booking reference' : 'Order reference', id],
    ...(isBooking
      ? [
          ['Item', safeText(data.serviceName, 'Booking')],
          ['Date', formatDate(safeText(data.date, '', 40))],
          ['Time', safeText(data.time, '', 60)],
          ['Address', location],
        ]
      : []),
    ['Total', formatLkr(total)],
    ...(paid > 0 ? [['Paid so far', formatLkr(paid)]] : []),
    ...(toPay > 0 ? [[advance > paid ? 'Advance to pay' : 'Balance to pay', formatLkr(toPay)]] : []),
  ] as Array<[string, string]>).filter(([, value]) => value);
  const bankRows: Array<[string, string]> = ([
    ['Account name', BANK_DETAILS.accountName],
    ['Bank', BANK_DETAILS.bankName],
    ['Branch', BANK_DETAILS.branch],
    ['Account number', BANK_DETAILS.accountNumber],
    ['Reference', id],
  ] as Array<[string, string]>).filter(([, value]) => value);
  const what = isBooking ? 'booking' : 'order';
  const text = [
    `Hello ${firstName},`,
    '',
    `Good news: your ${what} with ${division} is confirmed.`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(toPay > 0
      ? ['', 'Please pay by bank transfer:', ...bankRows.map(([label, value]) => `${label}: ${value}`),
        'Send the transfer slip on WhatsApp (075 092 8078) with your reference.']
      : []),
    '',
    `See your ${what}: ${accountUrl}`,
    '',
    'Cancellations and refunds follow our Refund and Cancellation Policy:',
    `${siteOrigin()}/refund-policy`,
    '',
    `${division},`,
    'Mahdev Pvt Ltd',
    'info.mahdev.lk@gmail.com | 075 092 8078 / 076 898 8970',
  ].join('\n');
  const table = (items: Array<[string, string]>) => `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0">${items
    .map(([label, value]) => `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:bold">${escapeHtml(value)}</td></tr>`)
    .join('')}</table>`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#0f172a;line-height:1.6;max-width:560px">
<p>Hello ${escapeHtml(firstName)},</p>
<p><strong>Good news: your ${what} with ${escapeHtml(division)} is confirmed.</strong></p>
${table(rows)}
${toPay > 0 ? `<p><strong>Please pay by bank transfer:</strong></p>${table(bankRows)}<p style="font-size:13px;color:#64748b">Send the transfer slip on WhatsApp (075 092 8078) with your reference.</p>` : ''}
<p><a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:#0052FF;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">See my ${what}</a></p>
<p style="font-size:13px;color:#64748b">Cancellations and refunds follow our <a href="${escapeHtml(`${siteOrigin()}/refund-policy`)}">Refund and Cancellation Policy</a>.</p>
<p>${escapeHtml(division)},<br>Mahdev Pvt Ltd<br>info.mahdev.lk@gmail.com | 075 092 8078 / 076 898 8970</p>
</div>`;
  return { subject: `${isBooking ? 'Booking' : 'Order'} confirmed: ${id}`, text, html };
}

/**
 * When an admin moves an order or booking to "confirmed", email the customer.
 * Only admin writes trigger it, and the address comes from the stored record
 * (set by the server from the customer's sign-in account).
 */
export async function notifyCustomerOfConfirmation(input: unknown, access: DatabaseAccess): Promise<void> {
  if (access.role !== 'admin' || !isRecord(input) || input.action !== 'write' || !isRecord(input.write)) return;
  const write = input.write;
  const collection = write.collection;
  if ((collection !== 'orders' && collection !== 'bookings') || typeof write.id !== 'string' || !isRecord(write.data)) return;
  // Only the change to "confirmed" sends the email (not every later edit).
  if (write.data.status !== 'confirmed' && write.data.orderStatus !== 'confirmed') return;

  const document = await getTursoDocument(collection, '', write.id);
  if (!document) return;
  const data = document.data;
  const customer = isRecord(data.customer) ? data.customer : {};
  const to = safeText(data.customerEmail || data.contactEmail || customer.email || data.email, '', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.warn(`[Submission alerts] ${collection} ${document.id} confirmed, but it has no customer email.`);
    return;
  }
  const customerName = safeText(customer.fullName || customer.name || data.customerName, 'there');
  const result = await sendCustomerEmail({ to, ...confirmedEmail(collection, document.id, data, customerName) });
  if (!result.delivered) {
    console.error(`[Submission alerts] Confirmation email for ${collection} ${document.id} was not delivered: ${result.notice}`);
  }
}
