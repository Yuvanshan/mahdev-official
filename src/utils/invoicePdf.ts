/**
 * Downloadable A4 invoice (PDF) drawn with jsPDF: only the invoice, with the
 * Mahdev and division logos, billing and event details, line items, totals,
 * payments received and bank details. jsPDF is loaded on demand, so it is not
 * part of the main bundle.
 */

import type { jsPDF as JsPdf } from 'jspdf';
import { BANK_DETAILS, COMPANY_INFO } from '../config/company';
import { formatCurrency } from './currency';
import { formatInvoiceDate, type InvoiceDocument } from './invoiceDocument';

// Brand colours taken from the Mahdev logo.
const INDIGO: [number, number, number] = [30, 27, 75];
const INDIGO_SOFT: [number, number, number] = [238, 236, 250];
const GOLD: [number, number, number] = [196, 154, 44];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const DIVISION_LOGOS: Record<string, string> = {
  sws: '/assets/images/sws_logo.jpeg',
  u1: '/assets/images/u1_logo.jpeg',
  it: '/assets/images/it_logo.png',
  travels: '/assets/images/travels_logo.png',
  mart: '/assets/images/mart_logo.png',
};

const STATUS_COLOURS: Record<string, [number, number, number]> = {
  Paid: [5, 150, 105],
  'Advance paid': [37, 99, 235],
  'Partly paid': [37, 99, 235],
  Unpaid: [217, 119, 6],
  Refunded: [100, 116, 139],
  Cancelled: [220, 38, 38],
};

interface LoadedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Loads an image through a canvas as PNG (works for any format, including progressive JPEG). */
function loadImage(src: string): Promise<LoadedImage | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), width: image.naturalWidth, height: image.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Draws `image` inside a box, keeping its proportions and centring it. */
function drawContained(pdf: JsPdf, image: LoadedImage, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  pdf.addImage(image.dataUrl, 'PNG', x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

export interface InvoiceCompanyDetails {
  legalName?: string;
  addresses?: string[];
  phone?: string;
  email?: string;
}

/** Saves the invoice as "<invoice number>.pdf". */
export async function downloadInvoicePdf(invoice: InvoiceDocument, companyOverrides?: InvoiceCompanyDetails): Promise<void> {
  const pdf = await buildInvoicePdf(invoice, companyOverrides);
  pdf.save(`${invoice.number}.pdf`);
}

export async function buildInvoicePdf(invoice: InvoiceDocument, companyOverrides?: InvoiceCompanyDetails): Promise<JsPdf> {
  const [{ jsPDF }, logo, divisionLogo] = await Promise.all([
    import('jspdf'),
    loadImage('/logo.png'),
    invoice.divisionId && DIVISION_LOGOS[invoice.divisionId] ? loadImage(DIVISION_LOGOS[invoice.divisionId]) : Promise.resolve(null),
  ]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const money = (value: number) => formatCurrency(value, invoice.currency);
  const company = {
    legalName: companyOverrides?.legalName || COMPANY_INFO.legalName,
    addresses: companyOverrides?.addresses || [COMPANY_INFO.offices.colombo.address, COMPANY_INFO.offices.trincomalee.address],
    phone: companyOverrides?.phone || COMPANY_INFO.primaryPhone,
    email: companyOverrides?.email || COMPANY_INFO.email,
  };

  const setText = (size: number, colour: [number, number, number], style: 'normal' | 'bold' = 'normal') => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.setTextColor(...colour);
  };

  // ---- Header band ------------------------------------------------------------
  pdf.setFillColor(...INDIGO);
  pdf.rect(0, 0, PAGE_WIDTH, 46, 'F');
  pdf.setFillColor(...GOLD);
  pdf.rect(0, 46, PAGE_WIDTH, 1.2, 'F');

  // Logos sit on white tiles so their own backgrounds blend in.
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(MARGIN, 8, 44, 30, 3, 3, 'F');
  if (logo) drawContained(pdf, logo, MARGIN + 2, 9, 40, 28);
  if (divisionLogo) {
    pdf.roundedRect(MARGIN + 48, 8, 30, 30, 3, 3, 'F');
    drawContained(pdf, divisionLogo, MARGIN + 50, 10, 26, 26);
  }

  setText(24, [255, 255, 255], 'bold');
  pdf.text('INVOICE', PAGE_WIDTH - MARGIN, 20, { align: 'right' });
  setText(10, GOLD, 'bold');
  pdf.text(invoice.number, PAGE_WIDTH - MARGIN, 27, { align: 'right' });
  setText(9, [199, 210, 254]);
  pdf.text(`Issued ${formatInvoiceDate(invoice.issuedAt)}`, PAGE_WIDTH - MARGIN, 33, { align: 'right' });

  // Status pill
  const statusColour = STATUS_COLOURS[invoice.status] || MUTED;
  setText(8, [255, 255, 255], 'bold');
  const statusText = invoice.status.toUpperCase();
  const pillWidth = pdf.getTextWidth(statusText) + 8;
  pdf.setFillColor(...statusColour);
  pdf.roundedRect(PAGE_WIDTH - MARGIN - pillWidth, 36, pillWidth, 6, 3, 3, 'F');
  pdf.text(statusText, PAGE_WIDTH - MARGIN - pillWidth / 2, 40.2, { align: 'center' });

  // ---- From / Bill to / Details -------------------------------------------------
  let y = 56;
  const columnWidth = (CONTENT_WIDTH - 8) / 3;
  const block = (x: number, heading: string, lines: Array<string | undefined>, boldFirst = true) => {
    setText(7.5, GOLD, 'bold');
    pdf.text(heading.toUpperCase(), x, y);
    let lineY = y + 5;
    lines.filter(Boolean).forEach((line, index) => {
      setText(index === 0 && boldFirst ? 9.5 : 8.5, index === 0 && boldFirst ? INK : MUTED, index === 0 && boldFirst ? 'bold' : 'normal');
      const wrapped = pdf.splitTextToSize(String(line), columnWidth);
      pdf.text(wrapped, x, lineY);
      lineY += wrapped.length * 4.2;
    });
    return lineY;
  };
  const fromEnd = block(MARGIN, 'From', [
    invoice.divisionName ? `${invoice.divisionName}` : company.legalName,
    invoice.divisionName ? company.legalName : undefined,
    ...company.addresses,
    company.phone,
    company.email,
    COMPANY_INFO.registrationNumber ? `Reg. No. ${COMPANY_INFO.registrationNumber}` : undefined,
  ]);
  const billEnd = block(MARGIN + columnWidth + 4, 'Billed to', [
    invoice.billedTo.name,
    invoice.billedTo.company,
    invoice.billedTo.address,
    invoice.billedTo.phone,
    invoice.billedTo.email,
  ]);
  const detailEnd = block(MARGIN + (columnWidth + 4) * 2, invoice.kind === 'booking' ? 'Booking details' : 'Order details', [
    invoice.title || invoice.reference,
    `Reference: ${invoice.reference}`,
    invoice.event?.date ? `Event date: ${formatInvoiceDate(invoice.event.date)}` : undefined,
    invoice.event?.time && invoice.event.time !== 'To be confirmed' ? `Time: ${invoice.event.time}` : undefined,
    invoice.event?.venue ? `Venue: ${invoice.event.venue}` : undefined,
  ]);
  y = Math.max(fromEnd, billEnd, detailEnd) + 6;

  // ---- Items table ---------------------------------------------------------------
  const columns = { qty: MARGIN + 112, unit: MARGIN + 145, amount: PAGE_WIDTH - MARGIN };
  const tableHeader = () => {
    pdf.setFillColor(...INDIGO);
    pdf.roundedRect(MARGIN, y, CONTENT_WIDTH, 9, 2, 2, 'F');
    setText(8, [255, 255, 255], 'bold');
    pdf.text('DESCRIPTION', MARGIN + 4, y + 6);
    pdf.text('QTY', columns.qty, y + 6, { align: 'center' });
    pdf.text('UNIT PRICE', columns.unit, y + 6, { align: 'right' });
    pdf.text('AMOUNT', columns.amount - 4, y + 6, { align: 'right' });
    y += 12;
  };
  const ensureSpace = (needed: number, repeatHeader = false) => {
    if (y + needed <= PAGE_HEIGHT - 24) return;
    pdf.addPage();
    y = MARGIN;
    if (repeatHeader) tableHeader();
  };

  tableHeader();
  invoice.items.forEach((item, index) => {
    const nameLines: string[] = pdf.splitTextToSize(item.name, 92);
    const descriptionLines: string[] = item.description ? pdf.splitTextToSize(item.description, 92) : [];
    const rowHeight = nameLines.length * 4.6 + descriptionLines.length * 3.8 + 4;
    ensureSpace(rowHeight, true);
    if (index % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(MARGIN, y - 4, CONTENT_WIDTH, rowHeight, 'F');
    }
    setText(9, INK, 'bold');
    pdf.text(nameLines, MARGIN + 4, y);
    if (descriptionLines.length) {
      setText(7.8, MUTED);
      pdf.text(descriptionLines, MARGIN + 4, y + nameLines.length * 4.6);
    }
    setText(9, INK);
    pdf.text(String(item.quantity), columns.qty, y, { align: 'center' });
    pdf.text(money(item.unitPrice), columns.unit, y, { align: 'right' });
    setText(9, INK, 'bold');
    pdf.text(money(item.amount), columns.amount - 4, y, { align: 'right' });
    y += rowHeight;
    pdf.setDrawColor(...LINE);
    pdf.line(MARGIN, y - 4, PAGE_WIDTH - MARGIN, y - 4);
  });

  // ---- Totals (right) and bank details (left) --------------------------------------
  const totals: Array<[string, string, 'normal' | 'discount']> = [['Subtotal', money(invoice.subtotal), 'normal']];
  if (invoice.discount > 0) totals.push(['Discount', `- ${money(invoice.discount)}`, 'discount']);
  if (invoice.fee > 0) totals.push([invoice.feeLabel, money(invoice.fee), 'normal']);
  if (invoice.tax > 0) totals.push(['Tax', money(invoice.tax), 'normal']);
  const totalsHeight = totals.length * 6 + 12 + 14;
  ensureSpace(Math.max(totalsHeight, 44) + 6);
  y += 4;
  const totalsX = PAGE_WIDTH - MARGIN - 78;
  let totalsY = y;
  totals.forEach(([label, value, tone]) => {
    setText(9, tone === 'discount' ? [5, 150, 105] : MUTED);
    pdf.text(label, totalsX, totalsY);
    pdf.text(value, PAGE_WIDTH - MARGIN - 4, totalsY, { align: 'right' });
    totalsY += 6;
  });
  pdf.setFillColor(...INDIGO);
  pdf.roundedRect(totalsX - 4, totalsY - 4, 82, 10, 2, 2, 'F');
  setText(10.5, [255, 255, 255], 'bold');
  pdf.text('Total', totalsX, totalsY + 2.5);
  pdf.text(money(invoice.total), PAGE_WIDTH - MARGIN - 4, totalsY + 2.5, { align: 'right' });
  totalsY += 13;
  setText(9, MUTED);
  pdf.text('Paid', totalsX, totalsY);
  pdf.text(money(invoice.paid), PAGE_WIDTH - MARGIN - 4, totalsY, { align: 'right' });
  totalsY += 7;
  setText(10.5, invoice.balance > 0 ? GOLD : [5, 150, 105], 'bold');
  pdf.text('Balance due', totalsX, totalsY);
  pdf.text(money(invoice.balance), PAGE_WIDTH - MARGIN - 4, totalsY, { align: 'right' });

  // Bank details box
  const bankRows = [
    ['Account name', BANK_DETAILS.accountName],
    ['Bank', BANK_DETAILS.bankName],
    ['Branch', BANK_DETAILS.branch],
    ['Account no.', BANK_DETAILS.accountNumber],
    ['Reference', invoice.reference],
  ].filter(([, value]) => value);
  const bankHeight = bankRows.length * 5 + 12 + (invoice.advanceAmount > 0 && invoice.paid < invoice.advanceAmount ? 5 : 0);
  pdf.setFillColor(...INDIGO_SOFT);
  pdf.roundedRect(MARGIN, y - 4, 86, bankHeight, 2, 2, 'F');
  setText(7.5, INDIGO, 'bold');
  pdf.text('PAYMENT DETAILS (BANK TRANSFER)', MARGIN + 4, y + 1.5);
  let bankY = y + 7.5;
  bankRows.forEach(([label, value]) => {
    setText(8.3, MUTED);
    pdf.text(label, MARGIN + 4, bankY);
    setText(8.3, INK, 'bold');
    pdf.text(String(value), MARGIN + 30, bankY);
    bankY += 5;
  });
  if (invoice.advanceAmount > 0 && invoice.paid < invoice.advanceAmount) {
    setText(8.3, GOLD, 'bold');
    pdf.text(`Advance to reserve the date: ${money(invoice.advanceAmount)}`, MARGIN + 4, bankY);
  }
  y = Math.max(totalsY, y - 4 + bankHeight) + 10;

  // ---- Payments received ------------------------------------------------------------
  if (invoice.payments.length) {
    ensureSpace(14 + invoice.payments.length * 6);
    setText(7.5, GOLD, 'bold');
    pdf.text('PAYMENTS RECEIVED', MARGIN, y);
    y += 5;
    invoice.payments.forEach((payment) => {
      setText(8.5, INK);
      pdf.text(formatInvoiceDate(payment.date), MARGIN, y);
      pdf.text(payment.label, MARGIN + 32, y);
      setText(8.5, MUTED);
      pdf.text(payment.method, MARGIN + 62, y);
      setText(8.5, INK, 'bold');
      pdf.text(money(payment.amount), PAGE_WIDTH - MARGIN - 4, y, { align: 'right' });
      pdf.setDrawColor(...LINE);
      pdf.line(MARGIN, y + 2, PAGE_WIDTH - MARGIN, y + 2);
      y += 6;
    });
    y += 4;
  }

  // ---- Notes ------------------------------------------------------------------------
  if (invoice.notes) {
    const noteLines: string[] = pdf.splitTextToSize(invoice.notes, CONTENT_WIDTH);
    ensureSpace(10 + noteLines.length * 4);
    setText(7.5, GOLD, 'bold');
    pdf.text('NOTES & TERMS', MARGIN, y);
    setText(8.3, MUTED);
    pdf.text(noteLines, MARGIN, y + 5);
  }

  // ---- Footer on every page ---------------------------------------------------------
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, PAGE_HEIGHT - 16, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 16);
    setText(8, INDIGO, 'bold');
    pdf.text(`Thank you for choosing ${invoice.divisionName || COMPANY_INFO.name}.`, MARGIN, PAGE_HEIGHT - 11);
    setText(7, MUTED);
    pdf.text('This is a computer-generated invoice and does not require a signature.', MARGIN, PAGE_HEIGHT - 7);
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: 'right' });
  }

  return pdf;
}
