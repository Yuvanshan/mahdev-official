/**
 * Mahdev Enterprise Secure Fiscal Invoice Generator (Server-side)
 * 
 * Generates verified, cryptographically signed enterprise invoices
 * with sequential fiscal numbering, tax breakdown, and tamper detection.
 */

import crypto from 'crypto';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface GenerateInvoiceInput {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerAddress?: string;
  companyName?: string;
  taxRegistrationNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
}

export interface GeneratedFiscalInvoice {
  invoiceNumber: string;
  fiscalYear: string;
  orderId: string;
  issuedAt: string;
  dueAt: string;
  issuer: {
    name: string;
    registrationNumber: string;
    vatNumber: string;
    address: string;
    phone: string;
    email: string;
  };
  client: {
    name: string;
    email: string;
    company?: string;
    vatNumber?: string;
    address?: string;
  };
  items: InvoiceItem[];
  financials: {
    subtotal: number;
    discount: number;
    tax: number;
    taxRatePercentage: number;
    shipping: number;
    total: number;
    currency: string;
    isPaid: boolean;
    paymentMethod: string;
    transactionId?: string;
  };
  digitalSignature: string;
  verificationUrl: string;
}

const INVOICE_SIGNING_SALT =
  process.env.INVOICE_SIGNING_SALT || 'mahdev_fiscal_invoice_cryptographic_salt_2026';

let invoiceCounter = 1042;

/**
 * Generates digital signature for the fiscal invoice
 */
export function signInvoicePayload(invoiceNumber: string, orderId: string, total: number): string {
  const data = `${invoiceNumber}:${orderId}:${total.toFixed(2)}:${INVOICE_SIGNING_SALT}`;
  return crypto.createHmac('sha256', INVOICE_SIGNING_SALT).update(data).digest('hex');
}

/**
 * Generates a signed enterprise invoice
 */
export function generateSecureFiscalInvoice(input: GenerateInvoiceInput): GeneratedFiscalInvoice {
  invoiceCounter += 1;
  const now = new Date();
  const invoiceNumber = `INV-2026-${invoiceCounter.toString().padStart(5, '0')}`;
  const digitalSignature = signInvoicePayload(invoiceNumber, input.orderId, input.total);

  const due = new Date(now.getTime() + 14 * 24 * 3600 * 1000); // 14-day standard terms

  return {
    invoiceNumber,
    fiscalYear: '2026/2027',
    orderId: input.orderId,
    issuedAt: now.toISOString(),
    dueAt: due.toISOString(),
    issuer: {
      name: 'Mahdev Pvt Ltd',
      registrationNumber: 'PV-00289410',
      vatNumber: 'VAT-LK-998821034',
      address: '41/22, Pickerings Road, Kotahena, Colombo 13, Sri Lanka',
      phone: '076 898 8970 / 075 092 8078',
      email: 'info.mahdev.lk@gmail.com',
    },
    client: {
      name: input.customerName,
      email: input.customerEmail,
      company: input.companyName,
      vatNumber: input.taxRegistrationNumber,
      address: input.customerAddress || 'Direct Commercial Delivery Address',
    },
    items: input.items,
    financials: {
      subtotal: input.subtotal,
      discount: input.discount,
      tax: input.tax,
      taxRatePercentage: 8.0, // Standard 8% SSCL / VAT
      shipping: input.shipping,
      total: input.total,
      currency: input.currency || 'USD',
      isPaid: true,
      paymentMethod: input.paymentMethod,
      transactionId: input.transactionId,
    },
    digitalSignature,
    verificationUrl: `https://mahdev.lk/verify/invoice/${invoiceNumber}?sig=${digitalSignature.substring(0, 16)}`,
  };
}
