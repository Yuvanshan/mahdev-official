import { jsPDF } from 'jspdf';
import { COMPANY_INFO } from '../../src/config/company.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, limit = 240): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, limit) : '';
}

function money(value: unknown, currency: string): string {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `${currency} ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
}

export function bookingConfirmationPdf(
  id: string,
  data: Record<string, unknown>
): { filename: string; content: Buffer; contentType: string } {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const customer = isRecord(data.customer) ? data.customer : {};
  const location = isRecord(data.location) ? data.location : {};
  const currency = text(data.currency, 8) || 'LKR';
  const serviceName = text(data.serviceName || data.designTitle, 160) || 'Booking request';
  const packageName = text(data.packageName, 120);
  const price = Number(data.price);
  const paid = Number(data.amountPaid) || 0;
  const balance = Number.isFinite(price) ? Math.max(0, price - paid) : 0;
  const margin = 16;
  const contentWidth = 210 - margin * 2;
  let y = 52;

  const setText = (size: number, colour: [number, number, number], bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...colour);
  };
  const addRow = (label: string, value: string) => {
    if (!value) return;
    const lines = pdf.splitTextToSize(value, contentWidth - 48) as string[];
    setText(9, [100, 116, 139]);
    pdf.text(label, margin, y);
    setText(9, [15, 23, 42], true);
    pdf.text(lines, margin + 48, y);
    y += Math.max(6, lines.length * 4.5 + 1);
  };
  const addSection = (title: string) => {
    y += 4;
    setText(10, [30, 27, 75], true);
    pdf.text(title.toUpperCase(), margin, y);
    y += 2;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 7;
  };

  pdf.setFillColor(30, 27, 75);
  pdf.rect(0, 0, 210, 42, 'F');
  pdf.setFillColor(196, 154, 44);
  pdf.rect(0, 42, 210, 1.2, 'F');
  setText(20, [255, 255, 255], true);
  pdf.text('BOOKING CONFIRMATION', margin, 17);
  setText(10, [255, 255, 255]);
  pdf.text(COMPANY_INFO.legalName, margin, 25);
  setText(9, [235, 222, 181]);
  pdf.text(`Reference: ${id}`, margin, 33);
  pdf.text('PENDING CONFIRMATION', 210 - margin, 33, { align: 'right' });

  addSection('Customer');
  addRow('Name', text(customer.fullName || customer.name, 100));
  addRow('Email', text(data.customerEmail || data.contactEmail || customer.email, 254));
  addRow('Phone', text(customer.phone, 32));

  addSection('Booking details');
  addRow('Division', text(data.divisionName, 100));
  addRow('Service', serviceName);
  addRow('Package', packageName);
  addRow('Date', text(data.date || data.bookingDate, 40));
  addRow('Time', text(data.time || data.bookingTime, 60));
  addRow('Venue', [text(location.venueName, 120), text(location.address, 240), text(location.city, 80)].filter(Boolean).join(', '));

  addSection('Estimate');
  addRow('Estimated total', money(data.price, currency) || 'On quotation');
  if (paid > 0) addRow('Paid so far', money(paid, currency));
  if (Number.isFinite(price) && price > 0) addRow('Estimated balance', money(balance, currency));

  y += 10;
  setText(8, [100, 116, 139]);
  const note = 'Thank you for your booking request. This document confirms receipt only; your date and service are not confirmed until the Mahdev team reviews and approves the request. Pricing shown is an estimate, not a tax invoice. No payment is due until you receive confirmation.';
  pdf.text(pdf.splitTextToSize(note, contentWidth), margin, y);
  y += 16;
  setText(8, [100, 116, 139]);
  pdf.text(`${COMPANY_INFO.email}  |  ${COMPANY_INFO.primaryPhone}`, margin, Math.min(y, 282));

  return {
    filename: `Booking-confirmation-${id.replace(/[^A-Za-z0-9-]/g, '_')}.pdf`,
    content: Buffer.from(pdf.output('arraybuffer')),
    contentType: 'application/pdf',
  };
}
