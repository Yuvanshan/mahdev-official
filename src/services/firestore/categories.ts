/**
 * Firestore Categories Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreCategory, DivisionId } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 20; // 20 min cache
let cachedCategories: { data: FirestoreCategory[]; timestamp: number } | null = null;

export function getDefaultCategories(): FirestoreCategory[] {
  // Phase 60: Real Data Architecture - Zero fake categories by default.
  // Categories are populated dynamically from Firestore or created via Admin Portal.
  return [];
}

export const firestoreCategoriesService = {
  /**
   * Fetch categories with division filter and caching
   */
  async getCategories(division?: DivisionId, forceRefresh = false): Promise<FirestoreCategory[]> {
    const now = Date.now();
    let allCategories: FirestoreCategory[] = [];

    if (!forceRefresh && cachedCategories && now - cachedCategories.timestamp < CACHE_TTL_MS) {
      allCategories = cachedCategories.data;
    } else {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        if (!snap.empty) {
          allCategories = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreCategory[];
          cachedCategories = { data: allCategories, timestamp: now };
        } else {
          allCategories = [];
          cachedCategories = { data: [], timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Categories] getCategories error:', err);
        allCategories = cachedCategories?.data || [];
      }
    }

    if (division) {
      return allCategories.filter((c) => c.division === division);
    }
    return allCategories;
  },

  /**
   * Save or update category
   */
  async saveCategory(id: string, data: Partial<FirestoreCategory>): Promise<void> {
    const docRef = doc(db, 'categories', id);
    const payload = sanitizeForFirestore({ ...data, id });
    await setDoc(docRef, payload, { merge: true });
    if (cachedCategories) {
      const idx = cachedCategories.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cachedCategories.data[idx] = { ...cachedCategories.data[idx], ...payload } as FirestoreCategory;
      }
    }
  },

  /**
   * Permanently delete category from Firestore
   */
  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
    if (cachedCategories) {
      cachedCategories.data = cachedCategories.data.filter((c) => c.id !== id);
    }
  },

  /**
   * Realtime listener for categories
   */
  subscribeCategories(
    onDataOrDivision: ((data: FirestoreCategory[]) => void) | DivisionId | undefined,
    onDataCallback?: (data: FirestoreCategory[]) => void
  ): Unsubscribe {
    const division = typeof onDataOrDivision === 'string' ? onDataOrDivision : undefined;
    const onData = typeof onDataOrDivision === 'function' ? onDataOrDivision : onDataCallback || (() => {});

    const colRef = collection(db, 'categories');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;

    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestoreCategory[];
        cachedCategories = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Categories] Listener error:', err);
        onData(cachedCategories?.data || []);
      }
    );
  },
};
