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
import { authService } from './authService';
import { safeStorage } from '../utils/safeStorage';
import type { Order } from '../types/order';
import type { Booking } from '../types/booking';
import type { CustomerUser } from '../types/customer';
import type { PaymentGatewayType, PaymentState, PaymentTransaction } from '../types/payment';

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

const PAYMENT_STATES: PaymentState[] = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'];
const PAYMENT_GATEWAYS: PaymentGatewayType[] = ['stripe_card', 'lankapay_ipg', 'bank_wire'];

/** The customer's payment records, in one request (the server returns only their own). */
export async function loadMyPayments(user: CustomerUser): Promise<PaymentTransaction[]> {
  const snapshot = await getDocs(collection(db, 'payments'));
  return snapshot.docs
    .map((document): PaymentTransaction => {
      const data = document.data();
      const status = String(data.paymentStatus || data.status || 'pending') as PaymentState;
      const gateway = String(data.gateway || data.gatewayId || 'bank_wire') as PaymentGatewayType;
      const timestamp = String(data.timestamp || data.createdAt || data.updatedAt || '');
      return {
        transactionId: String(data.transactionId || document.id),
        orderId: String(data.orderId || data.bookingId || ''),
        amount: Number(data.amount) || 0,
        currency: String(data.currency || 'LKR'),
        gateway: PAYMENT_GATEWAYS.includes(gateway) ? gateway : 'bank_wire',
        gatewayName: String(data.gatewayName || gateway),
        paymentStatus: PAYMENT_STATES.includes(status) ? status : 'pending',
        timestamp,
        updatedAt: String(data.updatedAt || timestamp),
        customerEmail: String(data.customerEmail || data.email || user.email),
        customerName: String(data.customerName || user.fullName),
      };
    })
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
}

// ---------------------------------------------------------------------------
// Cached account history
// ---------------------------------------------------------------------------

export interface AccountData {
  orders: Order[];
  bookings: Booking[];
  payments: PaymentTransaction[];
  /** Set when part of the history could not be loaded. */
  error: string | null;
  loadedAt: number;
}

/** Fresh enough to show without asking the server again. */
const ACCOUNT_CACHE_MS = 2 * 60_000;

// Kept in memory, with a copy in this tab's sessionStorage so a refresh shows the history
// at once. That copy has the same lifetime as the sign-in (the tab) and is cleared on
// sign-out; nothing is kept in long-lived storage on shared computers.
const ACCOUNT_TAB_KEY = 'mahdev_account_tab_cache';
let accountCache: { uid: string; data: AccountData; stale: boolean } | null = readTabCache();
let accountRequest: { uid: string; promise: Promise<AccountData> } | null = null;

/** Writes the cache to this tab's storage (cleared when the tab closes or on sign-out). */
function saveTabCache() {
  if (accountCache) safeStorage.setItem(ACCOUNT_TAB_KEY, JSON.stringify(accountCache));
  else safeStorage.removeItem(ACCOUNT_TAB_KEY);
}

function readTabCache(): typeof accountCache {
  try {
    const saved = JSON.parse(safeStorage.getItem(ACCOUNT_TAB_KEY) || 'null');
    return saved && typeof saved.uid === 'string' && saved.data ? saved : null;
  } catch {
    return null;
  }
}

/** Cached history for this customer, if any (may be older than the refresh window). */
export function peekAccountData(uid: string): AccountData | null {
  return accountCache?.uid === uid ? accountCache.data : null;
}

/** Whether cached history should be refreshed in the background. */
export function isAccountDataStale(uid: string): boolean {
  if (accountCache?.uid !== uid) return true;
  return accountCache.stale || Date.now() - accountCache.data.loadedAt > ACCOUNT_CACHE_MS;
}

/**
 * Orders, bookings and payments for the signed-in customer: three requests in
 * parallel, shared by everyone asking at the same time and reused for two minutes.
 * If the server cannot be reached, the last loaded history (or this session's
 * records) is kept rather than showing an empty account.
 */
export function loadAccountData(user: CustomerUser, { force = false } = {}): Promise<AccountData> {
  const uid = user.uid || user.id;
  if (!force && accountCache?.uid === uid && !isAccountDataStale(uid)) return Promise.resolve(accountCache.data);
  if (accountRequest?.uid === uid) return accountRequest.promise;

  const promise = (async (): Promise<AccountData> => {
    const previous = peekAccountData(uid);
    const [orders, bookings, payments] = await Promise.allSettled([loadMyOrders(user), loadMyBookings(user), loadMyPayments(user)]);
    const failed = [orders, bookings, payments].some((result) => result.status === 'rejected');
    if (failed) console.warn('[Account] Could not load part of the account history:', { orders, bookings, payments });
    const data: AccountData = {
      orders: orders.status === 'fulfilled' ? orders.value : previous?.orders ?? orderService.getOrdersByEmail(user.email),
      bookings: bookings.status === 'fulfilled' ? bookings.value : previous?.bookings ?? bookingService.getBookingsByCustomerEmail(user.email),
      payments: payments.status === 'fulfilled' ? payments.value : previous?.payments ?? [],
      error: failed ? 'Some of your history could not be loaded. Please try again shortly.' : null,
      loadedAt: Date.now(),
    };
    // A partly failed load is shown but retried on the next visit.
    if (authService.getCurrentUser()?.uid === uid || authService.getCurrentUser()?.id === uid) {
      accountCache = { uid, data, stale: failed };
      saveTabCache();
    }
    return data;
  })().finally(() => {
    if (accountRequest?.promise === promise) accountRequest = null;
  });
  accountRequest = { uid, promise };
  return promise;
}

/** Marks the cached history out of date (e.g. after a new order); the next visit refreshes it. */
export function markAccountDataStale() {
  if (!accountCache || accountCache.stale) return;
  accountCache.stale = true;
  saveTabCache();
}

// New orders and bookings in this session make the cache stale; signing out clears it.
orderService.subscribe(markAccountDataStale);
bookingService.subscribe(markAccountDataStale);
authService.subscribe((signedIn) => {
  if (!signedIn || (accountCache && accountCache.uid !== (signedIn.uid || signedIn.id))) {
    accountCache = null;
    accountRequest = null;
    saveTabCache();
  }
});

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

// Orders confirmed from a design link: decorations are prepared and set up, not shipped.
const DESIGN_ORDER_STEPS: ProgressStep[] = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'advance', label: 'Advance paid' },
  { key: 'preparing', label: 'In preparation' },
  { key: 'setup', label: 'Setup day' },
  { key: 'completed', label: 'Completed' },
];

function designOrderProgress(order: Order): Progress {
  if (order.status === 'cancelled') return { steps: DESIGN_ORDER_STEPS, current: 0, stopped: 'Cancelled' };
  const statusStep: Record<Order['status'], number> = {
    pending_payment: 1,
    confirmed: 1,
    processing: 2,
    dispatched: 3,
    completed: 4,
    cancelled: 0,
  };
  // A paid confirmed order is already waiting on preparation.
  const current = Math.max(statusStep[order.status], order.paymentStatus === 'paid' ? 2 : 0);
  return { steps: DESIGN_ORDER_STEPS, current };
}

export function orderProgress(order: Order): Progress {
  if (order.source === 'design_confirmation') return designOrderProgress(order);
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
// Booking alerts (changes our team made, saved on each booking)
// ---------------------------------------------------------------------------

const BOOKING_ALERT_READS_KEY = 'mahdev_customer_booking_alert_reads_v1';

export interface BookingAlert {
  id: string;
  bookingId: string;
  title: string;
  message: string;
  at: string;
  read: boolean;
}

function readBookingAlertReceipts(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BOOKING_ALERT_READS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Every update our team made to the customer's bookings, newest first. */
export function bookingAlerts(bookings: Booking[]): BookingAlert[] {
  const receipts = readBookingAlertReceipts();
  return bookings
    .flatMap((booking) =>
      (booking.customerUpdates || []).map((update) => ({
        id: `booking-update-${update.id}`,
        bookingId: booking.id,
        title: update.title,
        message: `${update.message} (Booking ${booking.id})`,
        at: update.at,
        read: Boolean(receipts[`booking-update-${update.id}`]),
      }))
    )
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** Remembers on this device that the customer has seen these alerts. */
export function markBookingAlertsRead(ids: string[]): void {
  if (ids.length === 0) return;
  try {
    const receipts = readBookingAlertReceipts();
    const now = new Date().toISOString();
    ids.forEach((id) => {
      receipts[id] = now;
    });
    // Keep the most recent 500 so the record stays small.
    const recent = Object.entries(receipts).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 500);
    localStorage.setItem(BOOKING_ALERT_READS_KEY, JSON.stringify(Object.fromEntries(recent)));
  } catch (error) {
    console.warn('[Account] Could not save alert read state:', error);
  }
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
