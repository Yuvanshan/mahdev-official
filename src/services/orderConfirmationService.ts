/**
 * Design order confirmation links (see backend/api/handlers/orderConfirmations.ts).
 *
 * Admin calls use the admin session cookie; the customer's confirm call sends
 * their Firebase token so the order is created on their own account.
 */

import { auth } from '../lib/firebase';

export interface ConfirmationItem {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

export interface ConfirmationInput {
  title: string;
  divisionId: string;
  divisionName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  designImages: string[];
  items: ConfirmationItem[];
  eventDate: string;
  eventTime: string;
  venue: string;
  notes: string;
  discount: number;
  deliveryFee: number;
  advanceAmount: number;
  expiresInDays: number;
}

export interface OrderConfirmation extends ConfirmationInput {
  id: string;
  status: ConfirmationStatus;
  subtotal: number;
  total: number;
  currency: string;
  /** Booking created when the customer confirms (allocated up front). */
  bookingId: string;
  shareUrl: string;
  expiresAt: string;
  createdAt: string;
  confirmedAt?: string;
  /** The customer's account details, saved when they confirm. */
  confirmedCustomer?: { name: string; email: string; phone: string };
  shareLog?: Array<{ channel: string; delivered: boolean; manual?: boolean; at: string }>;
}

/** What the customer sees on the link page. */
export interface PublicConfirmation {
  reference: string;
  status: ConfirmationStatus;
  title: string;
  divisionName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  designImages: string[];
  items: ConfirmationItem[];
  eventDate: string;
  eventTime: string;
  venue: string;
  notes: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  advanceAmount: number;
  total: number;
  currency: string;
  expiresAt: string;
  bookingId?: string;
}

export type AvailabilityResult = 'available' | 'taken' | 'invalid';

export interface DeliveryResult {
  delivered: boolean;
  notice?: string;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/order-confirmations${path}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload as T;
}

const post = <T>(path: string, body: unknown, headers?: Record<string, string>) =>
  call<T>(path, { method: 'POST', body: JSON.stringify(body), headers });

// Admin -----------------------------------------------------------------------

export async function listConfirmations(): Promise<OrderConfirmation[]> {
  return (await call<{ confirmations: OrderConfirmation[] }>('')).confirmations;
}

export async function createConfirmation(input: ConfirmationInput): Promise<OrderConfirmation> {
  // The link is built on the admin's current site address (works on previews too).
  return (await post<{ confirmation: OrderConfirmation }>('', { ...input, siteOrigin: window.location.origin })).confirmation;
}

/** Emails the link to the customer (WhatsApp is shared by hand with a wa.me link). */
export function sendConfirmationLink(id: string) {
  return post<{ email?: DeliveryResult }>('/send', { id });
}

/** Records that the admin opened WhatsApp with the link or the order confirmation. */
export function logWhatsAppShare(id: string, kind: 'link' | 'receipt') {
  return post<Record<string, never>>('/log-whatsapp', { id, kind });
}

export function cancelConfirmation(id: string) {
  return post<Record<string, never>>('/cancel', { id });
}

/** Removes the link. A confirmed link's booking stays in Bookings. */
export function deleteConfirmation(id: string) {
  return post<Record<string, never>>('/delete', { id });
}

// Customer --------------------------------------------------------------------

export async function getPublicConfirmation(token: string): Promise<PublicConfirmation> {
  return (await call<{ confirmation: PublicConfirmation }>(`/public?token=${encodeURIComponent(token)}`)).confirmation;
}

/** Whether an email and/or NIC already belongs to an account. */
export function checkCustomerDetails(token: string, details: { email?: string; nic?: string }) {
  return post<{ email?: AvailabilityResult; nic?: AvailabilityResult }>('/check', { token, ...details });
}

export async function confirmOrder(token: string, details: { address: string; notes: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to confirm your order.');
  return post<{ bookingId: string; emailSent?: boolean; alreadyConfirmed?: boolean }>(
    '/confirm',
    { token, ...details },
    { Authorization: `Bearer ${await user.getIdToken()}` }
  );
}
