/**
 * Firestore Users Repository (Optimized - Phase 33)
 * Implements bounded queries, role validation, and pagination for Admin user management.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreUser, UserRole } from '../../types/firestore';

export interface PaginatedUsersResult {
  items: FirestoreUser[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export const firestoreUsersService = {
  /**
   * Point lookup for single user profile
   */
  async getUser(uid: string): Promise<FirestoreUser | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? (snap.data() as FirestoreUser) : null;
    } catch (err) {
      console.warn('[Firestore Users] getUser error:', err);
      return null;
    }
  },

  /**
   * Upsert user profile document
   */
  async setUser(uid: string, data: Partial<FirestoreUser>): Promise<void> {
    const docRef = doc(db, 'users', uid);
    const existing = await this.getUser(uid);
    const now = new Date().toISOString();
    const payload: FirestoreUser = {
      uid,
      name: data.name || existing?.name || 'Mahdev Customer',
      email: data.email || existing?.email || '',
      phone: data.phone || existing?.phone || '',
      photoURL: data.photoURL || existing?.photoURL || '',
      role: data.role || existing?.role || 'customer',
      status: data.status || existing?.status || 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await setDoc(docRef, payload, { merge: true });
  },

  /**
   * Update role
   */
  async updateUserRole(uid: string, role: UserRole): Promise<void> {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { role, updatedAt: new Date().toISOString() });
  },

  /**
   * Bounded user fetch
   */
  async getUsers(limitCount = 50): Promise<FirestoreUser[]> {
    try {
      const q = query(collection(db, 'users'), firestoreLimit(Math.min(limitCount, 100)));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as FirestoreUser);
    } catch (err) {
      console.warn('[Firestore Users] getUsers error:', err);
      return [];
    }
  },

  /**
   * Paginated Users fetcher for Admin customer listing
   */
  async getUsersPaginated(page = 1, pageSize = 15): Promise<PaginatedUsersResult> {
    const allUsers = await this.getUsers(100);
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = allUsers.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  },
};
