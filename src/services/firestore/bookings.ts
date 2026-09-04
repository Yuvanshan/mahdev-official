/**
 * Firestore Bookings Repository (Optimized - Phase 33)
 * Implements bounded queries, composite index alignment, and targeted single-document subscriptions.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreBooking, BookingStatus } from '../../types/firestore';

export interface BookingQueryOptions {
  customerId?: string;
  divisionId?: string;
  status?: BookingStatus;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedBookingsResult {
  items: FirestoreBooking[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export const firestoreBookingsService = {
  /**
   * Fetch bookings with composite index alignment and bounded limits
   */
  async getBookings(options?: BookingQueryOptions): Promise<FirestoreBooking[]> {
    try {
      const colRef = collection(db, 'bookings');
      const constraints: any[] = [];

      if (options?.customerId) {
        constraints.push(where('customerId', '==', options.customerId));
      }
      if (options?.divisionId) {
        constraints.push(where('divisionId', '==', options.divisionId));
      }
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      // Order by createdAt descending (matches composite indexes)
      constraints.push(orderBy('createdAt', 'desc'));

      const maxLimit = options?.limit && options.limit > 0 ? Math.min(options.limit, 50) : 25;
      constraints.push(firestoreLimit(maxLimit));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreBooking[];
    } catch (err) {
      console.warn('[Firestore Bookings] Optimized getBookings error:', err);
      return [];
    }
  },

  /**
   * Paginated Bookings Fetcher for Customer Portal & Admin Panel
   */
  async getBookingsPaginated(options: BookingQueryOptions = {}): Promise<PaginatedBookingsResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(50, options.pageSize || 10));

    const allBookings = await this.getBookings({
      customerId: options.customerId,
      divisionId: options.divisionId,
      status: options.status,
      limit: 100,
    });

    const totalCount = allBookings.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = allBookings.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Point lookup for single booking
   */
  async getBookingById(id: string): Promise<FirestoreBooking | null> {
    try {
      const snap = await getDoc(doc(db, 'bookings', id));
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as FirestoreBooking) : null;
    } catch (err) {
      console.warn('[Firestore Bookings] getBookingById error:', err);
      return null;
    }
  },

  /**
   * Create new booking
   */
  async createBooking(booking: FirestoreBooking): Promise<void> {
    const docRef = doc(db, 'bookings', booking.id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...booking,
      bookingDate: booking.bookingDate || booking.date,
      bookingTime: booking.bookingTime || booking.time,
      amount: booking.amount ?? booking.price ?? 0,
      price: booking.price ?? booking.amount ?? 0,
      date: booking.date || booking.bookingDate,
      time: booking.time || booking.bookingTime,
      createdAt: booking.createdAt || now,
      updatedAt: now,
    });
    await setDoc(docRef, payload);
  },

  /**
   * Update booking status or notes
   */
  async updateBooking(id: string, updates: Partial<FirestoreBooking>): Promise<void> {
    const docRef = doc(db, 'bookings', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...updates,
      updatedAt: now,
    });
    await updateDoc(docRef, payload);
  },

  /**
   * Targeted Single-Booking Realtime Listener (Avoids whole collection snapshot)
   */
  subscribeToBooking(bookingId: string, onData: (booking: FirestoreBooking | null) => void): Unsubscribe {
    const docRef = doc(db, 'bookings', bookingId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onData({ ...snap.data(), id: snap.id } as FirestoreBooking);
        } else {
          onData(null);
        }
      },
      (err) => {
        console.warn(`[Firestore Bookings] subscribeToBooking error for ${bookingId}:`, err);
        onData(null);
      }
    );
  },

  /**
   * Realtime listener for all bookings (Admin dashboard and telemetry)
   */
  subscribeAllBookings(
    onData: (bookings: FirestoreBooking[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'bookings'),
      (snap) => {
        const bookings = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreBooking[];
        bookings.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onData(bookings);
      },
      (err) => {
        console.warn('[Firestore Bookings] subscribeAllBookings error:', err);
        if (onError) onError(err);
        else onData([]);
      }
    );
  },

  /**
   * Realtime listener for recent bookings (Admin live operations only)
   */
  subscribeRecentBookings(limitCount = 10, onData: (bookings: FirestoreBooking[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(Math.min(limitCount, 20))
    );

    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreBooking[]);
      },
      (err) => {
        console.warn('[Firestore Bookings] subscribeRecentBookings error:', err);
        onData([]);
      }
    );
  },

  /**
   * Fetch all bookings from Firestore
   */
  async getAllBookings(): Promise<FirestoreBooking[]> {
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreBooking[];
    } catch (err) {
      console.warn('[Firestore Bookings] getAllBookings error:', err);
      return [];
    }
  },

  /**
   * Delete booking by ID from Firestore
   */
  async deleteBooking(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      return true;
    } catch (err) {
      console.warn(`[Firestore Bookings] deleteBooking error for ${id}:`, err);
      return false;
    }
  },
};
