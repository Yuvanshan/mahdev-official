/**
 * Booking details for team emails: the same rows are shown as a table in the
 * email and attached as a one-page PDF ("Booking-BK-....pdf"), so the booking
 * can be filed or forwarded without opening the admin panel.
 */

import { jsPDF } from 'jspdf';

export type DetailRow = [label: string, value: string];

export interface BookingDetailsSection {
  title: string;
  rows: DetailRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, maxLength = 300): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, maxLength) : '';
}

function money(amount: unknown, currency = 'LKR'): string {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0
    ? `${currency} ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';
}

function humanise(value: unknown): string {
  const raw = text(value, 40);
  return raw ? raw.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()) : '';
}

/** Booking details grouped for display; empty values are left out. */
export function bookingDetailSections(id: string, data: Record<string, unknown>): BookingDetailsSection[] {
  const customer = isRecord(data.customer) ? data.customer : {};
  const location = isRecord(data.location) ? data.location : {};
  const currency = text(data.currency, 8) || 'LKR';
  const lineItems = Array.isArray(data.lineItems) ? data.lineItems.filter(isRecord) : [];
  const slips = Array.isArray(data.paymentSlips) ? data.paymentSlips.filter(isRecord) : [];
  const price = Number(data.price) || 0;
  const paid = Number(data.amountPaid) || 0;

  const sections: BookingDetailsSection[] = [
    {
      title: 'Booking',
      rows: [
        ['Reference', id],
        ['Status', humanise(data.status) || 'Pending'],
        ['Source', data.source === 'online_booking' ? 'Booked online' : humanise(data.source)],
        ['Created', text(data.createdAt, 40).replace('T', ' ').slice(0, 16)],
      ],
    },
    {
      title: 'Customer',
      rows: [
        ['Name', text(customer.fullName || customer.name, 100)],
        ['Email', text(data.customerEmail || data.contactEmail || customer.email, 254)],
        ['Phone', text(customer.phone, 32)],
      ],
    },
    {
      title: 'Service',
      rows: [
        ['Division', text(data.divisionName, 80)],
        ['Item', text(data.serviceName || data.designTitle, 160)],
        ['Package', text(data.packageName, 120)],
        ['Date', text(data.date || data.bookingDate, 40)],
        ['Time', text(data.time || data.bookingTime, 60)],
        ['Address', [text(location.venueName, 120), text(location.address, 300)].filter(Boolean).join(', ')],
        // Item names can be long, so they go in the value column, not the label.
        ...lineItems.map((item, index): DetailRow => [
          lineItems.length > 1 ? `Line item ${index + 1}` : 'Line item',
          `${text(item.name, 120) || 'Item'} x ${Number(item.quantity) || 1}: ${
            money((Number(item.quantity) || 1) * (Number(item.unitPrice) || 0), currency) || 'On quotation'
          }`,
        ]),
        ['Customer notes', text(data.notes, 1000)],
      ],
    },
    {
      title: 'Payment',
      rows: [
        ['Total', money(price, currency) || 'On quotation'],
        ['Advance', money(data.advanceAmount, currency)],
        ['Paid so far', money(paid, currency)],
        ['Balance', price > 0 ? money(Math.max(0, price - paid), currency) || `${currency} 0.00` : ''],
        ['Payment status', humanise(data.paymentStatus) || 'Unpaid'],
        ...slips.map((slip, index): DetailRow => [
          `Slip ${index + 1}`,
          `${money(slip.amount, currency)} (${humanise(slip.status) || 'Submitted'}, ${text(slip.uploadedAt, 40).slice(0, 10)})`,
        ]),
      ],
    },
  ];
  return sections
    .map((section) => ({ ...section, rows: section.rows.filter(([, value]) => value) }))
    .filter((section) => section.rows.length);
}

/** One-page A4 PDF of the booking details. */
export function bookingDetailsPdf(id: string, data: Record<string, unknown>): { filename: string; content: Buffer; contentType: string } {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 16;
  const width = 210 - margin * 2;
  const labelWidth = 48;
  let y = margin;

  // Header band.
  pdf.setFillColor(10, 17, 40);
  pdf.rect(0, 0, 210, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Booking details', margin, 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Mahdev Pvt Ltd  |  ${id}`, margin, 22);
  y = 40;

  for (const section of bookingDetailSections(id, data)) {
    if (y > 260) {
      pdf.addPage();
      y = margin;
    }
    pdf.setTextColor(0, 82, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(section.title.toUpperCase(), margin, y);
    y += 2;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, margin + width, y);
    y += 6;

    pdf.setFontSize(10);
    for (const [label, value] of section.rows) {
      // Long values (address, notes) wrap onto several lines.
      const lines = pdf.splitTextToSize(value, width - labelWidth) as string[];
      if (y + lines.length * 5 > 285) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(label, margin, y);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(lines, margin + labelWidth, y);
      y += lines.length * 5 + 1.5;
    }
    y += 5;
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by the Mahdev website.`, margin, 290);

  return {
    filename: `Booking-${id.replace(/[^A-Za-z0-9-]/g, '_')}.pdf`,
    content: Buffer.from(pdf.output('arraybuffer')),
    contentType: 'application/pdf',
  };
}
