import { safeStorage } from './safeStorage';

/**
 * "Book online" for any service, gallery item or product.
 *
 * Every Book online button calls startOnlineBooking(), which saves what the
 * visitor was looking at and opens /book/{kind}/{id}. The booking page prefers
 * the live database record for that id and falls back to the saved snapshot,
 * so items built from division data (packages, tours, rentals...) can be
 * booked too.
 */
export type OnlineBookingKind = 'service' | 'gallery' | 'product';

export const ONLINE_BOOKING_KINDS: OnlineBookingKind[] = ['service', 'gallery', 'product'];

export interface OnlineBookingItem {
  kind: OnlineBookingKind;
  id: string;
  title: string;
  images: string[];
  description?: string;
  divisionId?: string;
  divisionName?: string;
  /** Starting or unit price in LKR; null/undefined means "price on quotation". */
  price?: number | null;
  /** Price text shown when there is no numeric price, e.g. "From LKR 45,000". */
  priceLabel?: string;
  sku?: string;
  features?: string[];
}

const SNAPSHOT_KEY = 'mahdev_online_booking_item';
// Keeps the saved snapshot small; the booking page only shows a few photos.
const MAX_SNAPSHOT_IMAGES = 6;

export function onlineBookingPath(kind: OnlineBookingKind, id: string): string {
  return `/book/${kind}/${encodeURIComponent(id)}`;
}

/** Division id for a division name or alias ("SWS Event Management" -> "sws"). */
export function divisionIdFromName(name?: string): string | undefined {
  const value = (name || '').toLowerCase();
  if (!value) return undefined;
  if (value.includes('sws') || value.includes('event')) return 'sws';
  if (value.includes('u1') || value.includes('studio')) return 'u1';
  if (value.includes('travel')) return 'travels';
  if (value.includes('mart') || value.includes('shop')) return 'mart';
  if (value.includes(' it') || value.startsWith('it') || value.includes('solution')) return 'it';
  return undefined;
}

/** Saves the item and opens its booking page. */
export function startOnlineBooking(item: OnlineBookingItem, navigate?: (path: string) => void): void {
  const snapshot: OnlineBookingItem = {
    ...item,
    images: item.images.filter(Boolean).slice(0, MAX_SNAPSHOT_IMAGES),
  };
  safeStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));

  const path = onlineBookingPath(item.kind, item.id);
  if (navigate) {
    navigate(path);
    return;
  }
  // Components without an onNavigate prop: the app router listens for popstate.
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** The snapshot saved by startOnlineBooking() for this item, if any. */
export function readOnlineBookingSnapshot(kind: OnlineBookingKind, id: string): OnlineBookingItem | null {
  try {
    const raw = safeStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const item = JSON.parse(raw) as OnlineBookingItem;
    // The router lowercases page addresses, so ids are compared without case.
    return item.kind === kind && item.id.toLowerCase() === id.toLowerCase() ? item : null;
  } catch {
    return null;
  }
}

/** First numeric value in a price string ("LKR 45,000 / day" -> 45000), or null. */
export function parsePriceText(text?: string | null): number | null {
  if (!text) return null;
  const match = String(text).replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const value = match ? Number(match[0]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}
