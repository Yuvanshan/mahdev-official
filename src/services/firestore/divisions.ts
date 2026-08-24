/**
 * Firestore Divisions Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreDivision, DivisionId } from '../../types/firestore';
import { DIVISIONS } from '../../config/divisions';

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache for divisions
let cachedDivisions: { data: FirestoreDivision[]; timestamp: number } | null = null;

export function getDefaultDivisions(): FirestoreDivision[] {
  return Object.values(DIVISIONS).map((d) => ({
    id: d.id as DivisionId,
    name: d.name,
    slug: d.route.replace('/', ''),
    description: d.description,
    logo: `/assets/images/${d.id}_logo.png`,
    hero: {
      title: d.heroHeadline,
      subtitle: d.heroSubheadline,
      badge: d.badge,
      bgImage: `/assets/images/hero_${d.id}.jpg`,
      ctaText: `Explore ${d.shortName}`,
    },
    status: 'active',
    seo: {
      metaTitle: `${d.name} | Mahdev Pvt Ltd`,
      metaDescription: d.description,
      keywords: [d.id, d.shortName.toLowerCase(), 'mahdev', 'sri lanka'],
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  }));
}

export const firestoreDivisionsService = {
  /**
   * Fetch all 5 active business divisions with cache and fallback
   */
  async getDivisions(forceRefresh = false): Promise<FirestoreDivision[]> {
    const now = Date.now();
    if (!forceRefresh && cachedDivisions && now - cachedDivisions.timestamp < CACHE_TTL_MS) {
      return cachedDivisions.data;
    }

    try {
      const snap = await getDocs(collection(db, 'divisions'));
      if (!snap.empty) {
        const data = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id as DivisionId,
        })) as FirestoreDivision[];
        cachedDivisions = { data, timestamp: now };
        return data;
      }

      // If empty, auto-seed defaults into Firestore
      const defaults = getDefaultDivisions();
      for (const item of defaults) {
        await setDoc(doc(db, 'divisions', item.id), item, { merge: true });
      }
      cachedDivisions = { data: defaults, timestamp: now };
      return defaults;
    } catch (err) {
      console.warn('[Firestore Divisions] getDivisions fallback:', err);
      return cachedDivisions?.data || getDefaultDivisions();
    }
  },

  /**
   * Fetch single division by ID
   */
  async getDivisionById(id: DivisionId): Promise<FirestoreDivision | null> {
    const all = await this.getDivisions();
    return all.find((d) => d.id === id) || null;
  },

  /**
   * Update or create division document
   */
  async saveDivision(id: DivisionId, data: Partial<FirestoreDivision>): Promise<void> {
    const docRef = doc(db, 'divisions', id);
    const payload = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    if (cachedDivisions) {
      const idx = cachedDivisions.data.findIndex((d) => d.id === id);
      if (idx >= 0) {
        cachedDivisions.data[idx] = { ...cachedDivisions.data[idx], ...payload } as FirestoreDivision;
      }
    }
  },

  /**
   * Delete division document
   */
  async deleteDivision(id: DivisionId): Promise<void> {
    const docRef = doc(db, 'divisions', id);
    await deleteDoc(docRef);
    if (cachedDivisions) {
      cachedDivisions.data = cachedDivisions.data.filter((d) => d.id !== id);
    }
  },

  /**
   * Realtime listener for divisions
   */
  subscribeDivisions(
    onData: (data: FirestoreDivision[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'divisions'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id as DivisionId,
          })) as FirestoreDivision[];
          cachedDivisions = { data, timestamp: Date.now() };
          onData(data);
        } else {
          onData(getDefaultDivisions());
        }
      },
      (err) => {
        console.warn('[Firestore Divisions] Listener error:', err);
        if (onError) onError(err);
        onData(cachedDivisions?.data || getDefaultDivisions());
      }
    );
  },
};
