/**
 * Firestore Orders Repository (Optimized - Phase 33)
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
import { FirestoreOrder, OrderStatus } from '../../types/firestore';

export interface OrderQueryOptions {
  customerId?: string;
  status?: OrderStatus;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedOrdersResult {
  items: FirestoreOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export const firestoreOrdersService = {
  /**
   * Fetch orders with composite index alignment and bounded limits
   */
  async getOrders(options?: OrderQueryOptions): Promise<FirestoreOrder[]> {
    try {
      const colRef = collection(db, 'orders');
      const constraints: any[] = [];

      if (options?.customerId) {
        constraints.push(where('customerId', '==', options.customerId));
      }
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }

      // Order by creation time descending (matches composite indexes)
      constraints.push(orderBy('createdAt', 'desc'));

      const maxLimit = options?.limit && options.limit > 0 ? Math.min(options.limit, 50) : 25;
      constraints.push(firestoreLimit(maxLimit));

      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreOrder[];
    } catch (err) {
      console.warn('[Firestore Orders] Optimized getOrders error:', err);
      return [];
    }
  },

  /**
   * Paginated Orders Fetcher for Customer Account and Admin Dashboard
   */
  async getOrdersPaginated(options: OrderQueryOptions = {}): Promise<PaginatedOrdersResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(50, options.pageSize || 10));

    const allOrders = await this.getOrders({
      customerId: options.customerId,
      status: options.status,
      limit: 100,
    });

    const totalCount = allOrders.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = allOrders.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Fetch single order by ID (efficient point-lookup)
   */
  async getOrderById(id: string): Promise<FirestoreOrder | null> {
    try {
      const snap = await getDoc(doc(db, 'orders', id));
      return snap.exists() ? ({ ...snap.data(), id: snap.id } as FirestoreOrder) : null;
    } catch (err) {
      console.warn('[Firestore Orders] getOrderById error:', err);
      return null;
    }
  },

  /**
   * Create new order with timestamp
   */
  async createOrder(order: FirestoreOrder): Promise<void> {
    const docRef = doc(db, 'orders', order.id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...order,
      orderStatus: order.orderStatus || order.status || 'pending',
      status: order.status || order.orderStatus || 'pending',
      shippingAddress: order.shippingAddress || order.shipping?.address || {},
      createdAt: order.createdAt || now,
      updatedAt: now,
    });
    await setDoc(docRef, payload);
  },

  /**
   * Update order status or tracking details
   */
  async updateOrder(id: string, updates: Partial<FirestoreOrder>): Promise<void> {
    const docRef = doc(db, 'orders', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...updates,
      updatedAt: now,
    });
    await updateDoc(docRef, payload);
  },

  /**
   * Targeted Single-Order Realtime Listener (Avoids full collection listening)
   */
  subscribeToOrder(orderId: string, onData: (order: FirestoreOrder | null) => void): Unsubscribe {
    const docRef = doc(db, 'orders', orderId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onData({ ...snap.data(), id: snap.id } as FirestoreOrder);
        } else {
          onData(null);
        }
      },
      (err) => {
        console.warn(`[Firestore Orders] subscribeToOrder error for ${orderId}:`, err);
        onData(null);
      }
    );
  },

  /**
   * Realtime listener for all orders (Admin dashboard and telemetry)
   */
  subscribeAllOrders(
    onData: (orders: FirestoreOrder[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const orders = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreOrder[];
        // Sort in memory by createdAt descending
        orders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onData(orders);
      },
      (err) => {
        console.warn('[Firestore Orders] subscribeAllOrders error:', err);
        if (onError) onError(err);
        else onData([]);
      }
    );
  },

  /**
   * Realtime listener for recent orders (Admin dashboard only)
   */
  subscribeRecentOrders(limitCount = 10, onData: (orders: FirestoreOrder[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(Math.min(limitCount, 20))
    );

    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreOrder[]);
      },
      (err) => {
        console.warn('[Firestore Orders] subscribeRecentOrders error:', err);
        onData([]);
      }
    );
  },

  /**
   * Fetch all orders from Firestore
   */
  async getAllOrders(): Promise<FirestoreOrder[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreOrder[];
    } catch (err) {
      console.warn('[Firestore Orders] getAllOrders error:', err);
      return [];
    }
  },

  /**
   * Delete order by ID from Firestore
   */
  async deleteOrder(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'orders', id));
      return true;
    } catch (err) {
      console.warn(`[Firestore Orders] deleteOrder error for ${id}:`, err);
      return false;
    }
  },
};
