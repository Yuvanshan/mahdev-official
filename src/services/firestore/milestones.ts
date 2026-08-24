/**
 * Firestore Milestones Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreMilestone } from '../../types/firestore';
import { COMPANY_MILESTONES } from '../../data/homeData';

const CACHE_TTL_MS = 1000 * 60 * 30;
let cachedMilestones: { data: FirestoreMilestone[]; timestamp: number } | null = null;

export function getDefaultMilestones(): FirestoreMilestone[] {
  return COMPANY_MILESTONES.map((m, idx) => ({
    id: `ms-${m.year}`,
    year: m.year,
    title: m.title,
    description: m.description,
    order: idx + 1,
  }));
}

export const firestoreMilestonesService = {
  async getMilestones(forceRefresh = false): Promise<FirestoreMilestone[]> {
    const now = Date.now();
    if (!forceRefresh && cachedMilestones && now - cachedMilestones.timestamp < CACHE_TTL_MS) {
      return cachedMilestones.data;
    }

    try {
      const snap = await getDocs(collection(db, 'milestones'));
      if (!snap.empty) {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreMilestone[];
        data.sort((a, b) => (a.order || 0) - (b.order || 0));
        cachedMilestones = { data, timestamp: now };
        return data;
      }
      const defaults = getDefaultMilestones();
      for (const item of defaults) {
        await setDoc(doc(db, 'milestones', item.id), item, { merge: true });
      }
      cachedMilestones = { data: defaults, timestamp: now };
      return defaults;
    } catch (err) {
      console.warn('[Firestore Milestones] getMilestones fallback:', err);
      return cachedMilestones?.data || getDefaultMilestones();
    }
  },

  async saveMilestone(id: string, data: Partial<FirestoreMilestone>): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedMilestones) {
      const idx = cachedMilestones.data.findIndex((m) => m.id === id);
      if (idx >= 0) {
        cachedMilestones.data[idx] = { ...cachedMilestones.data[idx], ...data } as FirestoreMilestone;
      }
    }
  },

  async deleteMilestone(id: string): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    await deleteDoc(docRef);
    if (cachedMilestones) {
      cachedMilestones.data = cachedMilestones.data.filter((m) => m.id !== id);
    }
  },

  subscribeMilestones(onData: (data: FirestoreMilestone[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'milestones'),
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreMilestone[];
          data.sort((a, b) => (a.order || 0) - (b.order || 0));
          onData(data);
        } else {
          onData(getDefaultMilestones());
        }
      },
      () => {
        onData(getDefaultMilestones());
      }
    );
  },
};
