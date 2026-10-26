/**
 * The signed-in customer's own orders, bookings and activity for the account pages.
 *
 * Reads go through the database API with the customer's Firebase token; the server
 * only returns records owned by that customer (matched by account id or email), so
 * this never sees anyone else's data. Records created in this browser session but
 * not yet saved are merged in, so a brand-new order shows immediately.
 */

import { collection, getDocs } from '../lib/tursoFirestore';
import { db } from '../lib/firebase';
import { orderService } from './orderService';
import { bookingService, mapFirestoreBookingToUniversal } from './bookingService';
import type { Order } from '../types/order';
import type { Booking } from '../types/booking';
import type { CustomerUser } from '../types/customer';

const newestFirst = <T extends { createdAt: string }>(items: T[]) =>
  items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

/** Saved records win over session copies with the same id. */
function mergeById<T extends { id: string; createdAt: string }>(saved: T[], session: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of session) byId.set(item.id, item);
  for (const item of saved) byId.set(item.id, item);
  return newestFirst([...byId.values()]);
}

export async function loadMyOrders(user: CustomerUser): Promise<Order[]> {
  const session = orderService.getOrdersByEmail(user.email);
  const snapshot = await getDocs(collection(db, 'orders'));
  const saved = snapshot.docs.map((document) => orderService.mapFirestoreOrder({ ...document.data(), id: document.id }));
  return mergeById(saved, session);
}

export async function loadMyBookings(user: CustomerUser): Promise<Booking[]> {
  const session = bookingService.getBookingsByCustomerEmail(user.email);
  const snapshot = await getDocs(collection(db, 'bookings'));
  const saved = snapshot.docs.map((document) => mapFirestoreBookingToUniversal({ ...document.data(), id: document.id }));
  return mergeById(saved, session);
}

// ---------------------------------------------------------------------------
// Progress steps
// ---------------------------------------------------------------------------

export interface ProgressStep {
  key: string;
  label: string;
}

export interface Progress {
  steps: ProgressStep[];
  /** Index of the current step (all earlier steps are done). */
  current: number;
  /** Set when the order or booking was stopped (cancelled / rejected). */
  stopped?: string;
}

const ORDER_STEPS: ProgressStep[] = [
  { key: 'placed', label: 'Placed' },
  { key: 'paid', label: 'Payment' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'dispatched', label: 'On the way' },
  { key: 'completed', label: 'Delivered' },
];

export function orderProgress(order: Order): Progress {
  if (order.status === 'cancelled') return { steps: ORDER_STEPS, current: 0, stopped: 'Cancelled' };
  const paid = order.paymentStatus === 'paid';
  const statusStep: Record<Order['status'], number> = {
    pending_payment: 0,
    processing: 2,
    confirmed: 2,
    dispatched: 3,
    completed: 4,
    cancelled: 0,
  };
  // Payment is step 1; later stages imply it, an unpaid order waits there.
  const current = Math.max(statusStep[order.status], paid ? 2 : 1);
  return { steps: ORDER_STEPS, current: order.status === 'completed' ? 4 : current };
}

const BOOKING_STEPS: ProgressStep[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

export function bookingProgress(booking: Booking): Progress {
  if (booking.status === 'cancelled') return { steps: BOOKING_STEPS, current: 0, stopped: 'Cancelled' };
  if (booking.status === 'rejected') return { steps: BOOKING_STEPS, current: 0, stopped: 'Not available' };
  const index: Record<string, number> = { pending: 0, confirmed: 1, scheduled: 2, in_progress: 3, completed: 4 };
  return { steps: BOOKING_STEPS, current: index[booking.status] ?? 0 };
}

// ---------------------------------------------------------------------------
// Activity timeline
// ---------------------------------------------------------------------------

export type ActivityKind = 'account' | 'order' | 'payment' | 'booking';

export interface ActivityEntry {
  id: string;
  at: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  /** Page to open for this entry, if any. */
  route?: string;
}

const humanise = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** Account, order, payment and booking events, newest first. */
export function buildActivity(user: CustomerUser, orders: Order[], bookings: Booking[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  if (user.createdAt) {
    entries.push({ id: 'account-created', at: user.createdAt, kind: 'account', title: 'Account created', detail: `Welcome to Mahdev, ${user.fullName.split(' ')[0]}.` });
  }
  if (user.lastLogin) {
    entries.push({ id: 'last-login', at: user.lastLogin, kind: 'account', title: 'Signed in', detail: 'Most recent sign-in to your account.' });
  }
  for (const order of orders) {
    const items = order.items.length === 1 ? order.items[0].name : `${order.items.length} items`;
    entries.push({ id: `order-${order.id}`, at: order.createdAt, kind: 'order', title: `Order ${order.id} placed`, detail: items, route: `/order/${order.id}` });
    if (order.updatedAt && order.updatedAt !== order.createdAt && order.status !== 'pending_payment') {
      entries.push({
        id: `order-status-${order.id}`,
        at: order.updatedAt,
        kind: order.paymentStatus === 'paid' && order.status === 'processing' ? 'payment' : 'order',
        title: `Order ${order.id}: ${humanise(order.status)}`,
        detail: `Payment ${humanise(order.paymentStatus).toLowerCase()}.`,
        route: `/order/${order.id}`,
      });
    }
  }
  for (const booking of bookings) {
    const when = booking.date ? ` for ${new Date(`${booking.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : '';
    entries.push({ id: `booking-${booking.id}`, at: booking.createdAt, kind: 'booking', title: `Booked ${booking.serviceName}`, detail: `${booking.divisionName}${when}`, route: '/account/bookings' });
    if (booking.updatedAt && booking.updatedAt !== booking.createdAt && booking.status !== 'pending') {
      entries.push({ id: `booking-status-${booking.id}`, at: booking.updatedAt, kind: 'booking', title: `${booking.serviceName}: ${humanise(booking.status)}`, detail: booking.rejectionReason || booking.cancellationReason || booking.divisionName, route: '/account/bookings' });
    }
  }
  return entries
    .filter((entry) => !Number.isNaN(new Date(entry.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
