/**
 * One invoice shape for both shop orders and bookings, used by the account
 * Invoices tab (on screen) and by the downloadable PDF (utils/invoicePdf.ts).
 */

import type { Order } from '../types/order';
import type { Booking } from '../types/booking';

export type InvoiceStatus = 'Paid' | 'Advance paid' | 'Partly paid' | 'Unpaid' | 'Refunded' | 'Cancelled';

export interface InvoiceLine {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoicePaymentLine {
  date: string;
  label: string;
  method: string;
  amount: number;
}

export interface InvoiceDocument {
  /** "INV-…", also the PDF file name. */
  number: string;
  /** Order or booking ID the invoice is for. */
  reference: string;
  kind: 'order' | 'booking';
  issuedAt: string;
  status: InvoiceStatus;
  currency: string;
  divisionId?: string;
  divisionName?: string;
  title?: string;
  billedTo: { name: string; email: string; phone: string; company?: string; address?: string };
  event?: { date?: string; time?: string; venue?: string };
  items: InvoiceLine[];
  subtotal: number;
  discount: number;
  /** Delivery, or transport & setup for bookings. */
  fee: number;
  feeLabel: string;
  tax: number;
  total: number;
  paid: number;
  balance: number;
  advanceAmount: number;
  payments: InvoicePaymentLine[];
  notes?: string;
}

const round = (value: number) => Math.round(value * 100) / 100;

const PAYMENT_KIND_LABELS: Record<string, string> = { advance: 'Advance', balance: 'Balance', other: 'Payment' };

export function invoiceFromOrder(order: Order): InvoiceDocument {
  const paid = order.paymentStatus === 'paid' ? order.total : 0;
  const status: InvoiceStatus =
    order.status === 'cancelled' ? 'Cancelled' : order.paymentStatus === 'refunded' ? 'Refunded' : paid ? 'Paid' : 'Unpaid';
  const address = order.deliveryInfo?.address;
  return {
    number: `INV-${String(order.id || '').replace(/^ORD-/, '')}`,
    reference: order.id,
    kind: 'order',
    issuedAt: order.createdAt,
    status,
    currency: order.currency || 'LKR',
    divisionName: order.items[0]?.divisionName,
    divisionId: order.items[0]?.divisionId,
    billedTo: {
      name: order.customer.fullName,
      email: order.customer.email,
      phone: order.customer.phone,
      company: order.customer.company,
      address: address ? [address.street, address.city, address.country].filter(Boolean).join(', ') : undefined,
    },
    event: order.bookingInfo
      ? { date: order.bookingInfo.preferredDate, time: order.bookingInfo.preferredTimeSlot, venue: order.bookingInfo.venueOrLocation }
      : undefined,
    items: order.items.map((item) => ({
      name: item.name,
      description: item.selectedVariant ? Object.values(item.selectedVariant).filter(Boolean).join(' · ') : undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.lineTotal,
    })),
    subtotal: order.subtotal,
    discount: (order.productDiscounts || 0) + (order.couponDiscount || 0),
    fee: order.shippingFee || 0,
    feeLabel: order.deliveryInfo?.methodName || 'Delivery & handling',
    tax: order.tax || 0,
    total: order.total,
    paid,
    balance: round(order.total - paid),
    advanceAmount: 0,
    payments: paid && order.transactionId
      ? [{ date: order.updatedAt, label: 'Payment', method: order.paymentMethod || 'Online', amount: paid }]
      : [],
    notes: order.customerNotes,
  };
}

export function invoiceFromBooking(booking: Booking): InvoiceDocument {
  const payments = booking.payments || [];
  const paid = booking.amountPaid ?? round(payments.reduce((sum, payment) => sum + payment.amount, 0));
  const total = booking.price;
  const items: InvoiceLine[] = booking.lineItems?.length
    ? booking.lineItems.map((item) => ({ ...item, amount: round(item.quantity * item.unitPrice) }))
    : [{ name: booking.serviceName, description: booking.packageName, quantity: 1, unitPrice: total, amount: total }];
  const status: InvoiceStatus =
    booking.status === 'cancelled' || booking.status === 'rejected'
      ? 'Cancelled'
      : booking.paymentStatus === 'refunded'
        ? 'Refunded'
        : paid >= total - 0.005 && total > 0
          ? 'Paid'
          : paid > 0
            ? booking.advanceAmount && paid >= booking.advanceAmount - 0.005 ? 'Advance paid' : 'Partly paid'
            : 'Unpaid';
  return {
    number: booking.invoiceNumber || `INV-${booking.id.replace(/^BK-/, '')}`,
    reference: booking.id,
    kind: 'booking',
    issuedAt: booking.createdAt,
    status,
    currency: booking.currency || 'LKR',
    divisionId: booking.divisionId,
    divisionName: booking.divisionName,
    title: booking.designTitle || booking.serviceName,
    billedTo: {
      name: booking.customer.fullName,
      email: booking.customer.email,
      phone: booking.customer.phone,
      company: booking.customer.company,
    },
    event: {
      date: booking.date,
      time: booking.time,
      venue: [booking.location.venueName, booking.location.address].filter((part, index, all) => part && all.indexOf(part) === index).join(', '),
    },
    items,
    subtotal: booking.subtotal ?? round(items.reduce((sum, item) => sum + item.amount, 0)),
    discount: booking.discount || 0,
    fee: booking.deliveryFee || 0,
    feeLabel: 'Transport & setup',
    tax: 0,
    total,
    paid,
    balance: round(Math.max(0, total - paid)),
    advanceAmount: booking.advanceAmount || 0,
    payments: payments.map((payment) => ({
      date: payment.paidAt,
      label: PAYMENT_KIND_LABELS[payment.kind] || 'Payment',
      method: payment.method,
      amount: payment.amount,
    })),
    notes: booking.termsNotes,
  };
}

/** Bookings that carry a price get an invoice (free enquiries do not). */
export function bookingHasInvoice(booking: Booking): boolean {
  return booking.price > 0 && booking.status !== 'rejected';
}

export const formatInvoiceDate = (iso?: string) => {
  if (!iso) return '';
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
