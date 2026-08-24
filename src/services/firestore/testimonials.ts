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
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreTestimonial, DivisionId } from '../../types/firestore';
import { TESTIMONIALS_DATA } from '../../data/corporateData';

const CACHE_TTL_MS = 1000 * 60 * 20;
let cachedTestimonials: { data: FirestoreTestimonial[]; timestamp: number } | null = null;

export function getDefaultTestimonials(): FirestoreTestimonial[] {
  return TESTIMONIALS_DATA.map((t) => ({
    id: t.id,
    author: t.author,
    role: t.role,
    company: t.company,
    avatarUrl: t.photoUrl,
    quote: t.quote,
    division: t.divisionId || 'all',
    rating: t.rating || 5,
    status: 'approved',
  }));
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
          const defaults = getDefaultTestimonials();
          for (const item of defaults) {
            await setDoc(doc(db, 'testimonials', item.id), item, { merge: true });
          }
          allTestimonials = defaults;
          cachedTestimonials = { data: defaults, timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Testimonials] getTestimonials fallback:', err);
        allTestimonials = cachedTestimonials?.data || getDefaultTestimonials();
      }
    }

    if (division && division !== 'all') {
      return allTestimonials.filter((t) => t.division === division || t.division === 'all');
    }
    return allTestimonials;
  },

  async saveTestimonial(id: string, data: Partial<FirestoreTestimonial>): Promise<void> {
    const docRef = doc(db, 'testimonials', id);
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedTestimonials) {
      const idx = cachedTestimonials.data.findIndex((t) => t.id === id);
      if (idx >= 0) {
        cachedTestimonials.data[idx] = { ...cachedTestimonials.data[idx], ...data } as FirestoreTestimonial;
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
        if (!snap.empty) {
          let data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTestimonial[];
          if (division && division !== 'all') {
            data = data.filter((t) => t.division === division || t.division === 'all');
          }
          onData(data);
        } else {
          const defaults = getDefaultTestimonials();
          onData(division && division !== 'all' ? defaults.filter((t) => t.division === division || t.division === 'all') : defaults);
        }
      },
      () => {
        const defaults = getDefaultTestimonials();
        onData(division && division !== 'all' ? defaults.filter((t) => t.division === division || t.division === 'all') : defaults);
      }
    );
  },
};
