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
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreCategory, DivisionId } from '../../types/firestore';
import { MASTER_CATALOG_CATEGORIES } from '../../data/catalog/categories';

const CACHE_TTL_MS = 1000 * 60 * 20; // 20 min cache
let cachedCategories: { data: FirestoreCategory[]; timestamp: number } | null = null;

export function getDefaultCategories(): FirestoreCategory[] {
  return MASTER_CATALOG_CATEGORIES.map((c) => ({
    id: c.id,
    division: (c.divisionId || 'mart') as DivisionId,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    order: c.sortOrder || 0,
    status: c.status === 'active' ? 'active' : 'inactive',
  }));
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
          const defaults = getDefaultCategories();
          for (const cat of defaults) {
            await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
          }
          allCategories = defaults;
          cachedCategories = { data: defaults, timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Categories] getCategories fallback to defaults:', err);
        allCategories = cachedCategories?.data || getDefaultCategories();
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
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedCategories) {
      const idx = cachedCategories.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cachedCategories.data[idx] = { ...cachedCategories.data[idx], ...data } as FirestoreCategory;
      }
    }
  },

  /**
   * Realtime listener for categories
   */
  subscribeCategories(
    division: DivisionId | undefined,
    onData: (data: FirestoreCategory[]) => void
  ): Unsubscribe {
    const colRef = collection(db, 'categories');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;

    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreCategory[];
          onData(data);
        } else {
          const defaults = getDefaultCategories();
          onData(division ? defaults.filter((c) => c.division === division) : defaults);
        }
      },
      () => {
        const defaults = getDefaultCategories();
        onData(division ? defaults.filter((c) => c.division === division) : defaults);
      }
    );
  },
};
