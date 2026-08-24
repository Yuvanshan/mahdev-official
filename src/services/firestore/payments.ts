/**
 * Firestore Payments Repository (Phase 57 Compliant)
 * Secure transaction recording for orders and bookings
 * Note: Never store sensitive card/CVV data.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestorePayment } from '../../types/firestore';

export interface PaymentQueryOptions {
  customerId?: string;
  orderId?: string;
  bookingId?: string;
  status?: string;
  limit?: number;
}

export const firestorePaymentsService = {
  /**
   * Fetch payments with optional filtering
   */
  async getPayments(options?: PaymentQueryOptions): Promise<FirestorePayment[]> {
    try {
      const colRef = collection(db, 'payments');
      const constraints: any[] = [];

      if (options?.customerId) {
        constraints.push(where('customerId', '==', options.customerId));
      }
      if (options?.orderId) {
        constraints.push(where('orderId', '==', options.orderId));
      }
      if (options?.bookingId) {
        constraints.push(where('bookingId', '==', options.bookingId));
      }
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      const maxLimit = options?.limit ? Math.min(options.limit, 100) : 50;
      constraints.push(firestoreLimit(maxLimit));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestorePayment[];
    } catch (err) {
      console.warn('[Firestore Payments] getPayments error:', err);
      return [];
    }
  },

  /**
   * Get single payment by ID
   */
  async getPaymentById(id: string): Promise<FirestorePayment | null> {
    try {
      const snap = await getDoc(doc(db, 'payments', id));
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as FirestorePayment) : null;
    } catch (err) {
      console.warn('[Firestore Payments] getPaymentById error:', err);
      return null;
    }
  },

  /**
   * Record a new payment
   */
  async recordPayment(payment: FirestorePayment): Promise<string> {
    const id = payment.id || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const docRef = doc(db, 'payments', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...payment,
      id,
      createdAt: payment.createdAt || now,
    });
    await setDoc(docRef, payload);
    return id;
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: FirestorePayment['status']): Promise<void> {
    const docRef = doc(db, 'payments', id);
    await updateDoc(docRef, { status });
  },

  /**
   * Realtime payments subscription for an admin or customer
   */
  subscribePayments(
    options: PaymentQueryOptions,
    onData: (payments: FirestorePayment[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'payments');
    const constraints: any[] = [];

    if (options?.customerId) {
      constraints.push(where('customerId', '==', options.customerId));
    }
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(firestoreLimit(50));

    const q = query(colRef, ...constraints);
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestorePayment[]);
      },
      (err) => {
        console.warn('[Firestore Payments] subscription error:', err);
        if (onError) onError(err);
        else onData([]);
      }
    );
  },
};
