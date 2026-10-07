/**
 * Firestore Testimonials Repository
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
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreTestimonial, DivisionId } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 20;
let cachedTestimonials: { data: FirestoreTestimonial[]; timestamp: number } | null = null;

export function getDefaultTestimonials(): FirestoreTestimonial[] {
  // Phase 60: Real Data Architecture - Zero fake testimonials by default.
  // Testimonials are populated directly through Firestore or Admin Portal.
  return [];
}

export const firestoreTestimonialsService = {
  async getTestimonials(division?: DivisionId | 'all', forceRefresh = false): Promise<FirestoreTestimonial[]> {
    const now = Date.now();
    let allTestimonials: FirestoreTestimonial[] = [];

    if (!forceRefresh && cachedTestimonials && now - cachedTestimonials.timestamp < CACHE_TTL_MS) {
      allTestimonials = cachedTestimonials.data;
    } else {
      try {
        const snap = await getDocs(collection(db, 'testimonials'));
        if (!snap.empty) {
          allTestimonials = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTestimonial[];
          cachedTestimonials = { data: allTestimonials, timestamp: now };
        } else {
          allTestimonials = [];
          cachedTestimonials = { data: [], timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Testimonials] getTestimonials error:', err);
        allTestimonials = cachedTestimonials?.data || [];
      }
    }

    if (division && division !== 'all') {
      return allTestimonials.filter((t) => t.division === division || t.division === 'all');
    }
    return allTestimonials;
  },

  async saveTestimonial(id: string, data: Partial<FirestoreTestimonial>): Promise<void> {
    const docRef = doc(db, 'testimonials', id);
    const payload = sanitizeForFirestore({ ...data, id });
    await setDoc(docRef, payload, { merge: true });
    if (cachedTestimonials) {
      const idx = cachedTestimonials.data.findIndex((t) => t.id === id);
      if (idx >= 0) {
        cachedTestimonials.data[idx] = { ...cachedTestimonials.data[idx], ...payload } as FirestoreTestimonial;
      }
    }
  },

  async deleteTestimonial(id: string): Promise<void> {
    const docRef = doc(db, 'testimonials', id);
    await deleteDoc(docRef);
    if (cachedTestimonials) {
      cachedTestimonials.data = cachedTestimonials.data.filter((t) => t.id !== id);
    }
  },

  async toggleFeature(id: string, isFeatured: boolean): Promise<void> {
    await this.saveTestimonial(id, { isFeatured });
  },

  async toggleHide(id: string, isHidden: boolean): Promise<void> {
    await this.saveTestimonial(id, { isHidden });
  },

  async assignDivision(id: string, divisionId: string, divisionName?: string): Promise<void> {
    await this.saveTestimonial(id, { divisionId, division: divisionId, divisionName });
  },

  subscribeTestimonials(
    onDataOrDivision: ((data: FirestoreTestimonial[]) => void) | DivisionId | 'all' | undefined,
    onDataCallback?: (data: FirestoreTestimonial[]) => void
  ): Unsubscribe {
    const division = typeof onDataOrDivision === 'string' ? onDataOrDivision : undefined;
    const onData = typeof onDataOrDivision === 'function' ? onDataOrDivision : onDataCallback || (() => {});

    const colRef = collection(db, 'testimonials');
    return onSnapshot(
      colRef,
      (snap) => {
        let data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTestimonial[];
        if (division && division !== 'all') {
          data = data.filter((t) => t.division === division || t.division === 'all');
        }
        cachedTestimonials = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Testimonials] Listener error:', err);
        onData(cachedTestimonials?.data || []);
      }
    );
  },
};
