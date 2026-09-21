/**
 * Firestore Gallery Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreGallery, DivisionId } from '../../types/firestore';
import { isSameDivision } from './divisions';

const CACHE_TTL_MS = 1000 * 60 * 20;
let cachedGallery: { data: FirestoreGallery[]; timestamp: number } | null = null;
let inFlightGalleryPromise: Promise<FirestoreGallery[]> | null = null;

export function getDefaultGallery(): FirestoreGallery[] {
  // Phase 60: Real Data Architecture - Zero fake media by default.
  // Gallery items are populated via Admin Portal or Firestore collection.
  return [];
}

export const firestoreGalleryService = {
  async getGallery(division?: DivisionId, forceRefresh = false): Promise<FirestoreGallery[]> {
    const now = Date.now();
    let allItems: FirestoreGallery[] = [];

    // 1. Return fresh in-memory cache immediately if not forced to refresh
    if (!forceRefresh && cachedGallery && now - cachedGallery.timestamp < CACHE_TTL_MS) {
      allItems = cachedGallery.data;
    } else if (inFlightGalleryPromise) {
      // 2. Reuse concurrent in-flight request to avoid duplicate network roundtrips
      allItems = await inFlightGalleryPromise;
    } else {
      // 3. Initiate single deduplicated Firestore query
      inFlightGalleryPromise = (async () => {
        try {
          const snap = await getDocs(collection(db, 'gallery'));
          if (!snap.empty) {
            const items = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[];
            cachedGallery = { data: items, timestamp: Date.now() };
            return items;
          } else {
            cachedGallery = { data: [], timestamp: Date.now() };
            return [];
          }
        } catch (err) {
          console.warn('[Firestore Gallery] getGallery error:', err);
          return cachedGallery?.data || [];
        } finally {
          inFlightGalleryPromise = null;
        }
      })();
      allItems = await inFlightGalleryPromise;
    }

    if (division) {
      return allItems.filter(
        (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
      );
    }
    return allItems;
  },

  async saveGallery(id: string, data: Partial<FirestoreGallery>): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    const payload = sanitizeForFirestore({ ...data, id });
    await setDoc(docRef, payload, { merge: true });
    if (cachedGallery) {
      const idx = cachedGallery.data.findIndex((g) => g.id === id);
      if (idx >= 0) {
        cachedGallery.data[idx] = { ...cachedGallery.data[idx], ...payload } as FirestoreGallery;
      }
    }
  },

  async deleteGallery(id: string): Promise<void> {
    const docRef = doc(db, 'gallery', id);
    await deleteDoc(docRef);
    if (cachedGallery) {
      cachedGallery.data = cachedGallery.data.filter((g) => g.id !== id);
    }
  },

  subscribeGallery(division: DivisionId | undefined, onData: (data: FirestoreGallery[]) => void): Unsubscribe {
    const colRef = collection(db, 'gallery');

    return onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreGallery[];
        cachedGallery = { data, timestamp: Date.now() };
        if (division) {
          const filtered = data.filter(
            (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
          );
          onData(filtered);
        } else {
          onData(data);
        }
      },
      (err) => {
        console.warn('[Firestore Gallery] Listener error:', err);
        const fallback = cachedGallery?.data || [];
        if (division) {
          onData(
            fallback.filter(
              (g) => isSameDivision(g.division, division) || isSameDivision((g as any).divisionId, division)
            )
          );
        } else {
          onData(fallback);
        }
      }
    );
  },
};
