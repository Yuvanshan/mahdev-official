/**
 * Firestore Milestones Repository
 * Phase 54: Real-time Firestore Milestone Synchronization (Single Source of Truth)
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreMilestone } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15-minute memoized cache
let cachedMilestones: { data: FirestoreMilestone[]; timestamp: number } | null = null;
let inFlightMilestonesPromise: Promise<FirestoreMilestone[]> | null = null;

export const firestoreMilestonesService = {
  /**
   * Fetch all milestones directly from Firestore
   */
  async getMilestones(forceRefresh = false): Promise<FirestoreMilestone[]> {
    const now = Date.now();
    if (!forceRefresh && cachedMilestones && now - cachedMilestones.timestamp < CACHE_TTL_MS) {
      return cachedMilestones.data;
    }

    if (inFlightMilestonesPromise && !forceRefresh) {
      return inFlightMilestonesPromise;
    }

    inFlightMilestonesPromise = (async () => {
      try {
        const q = query(collection(db, 'milestones'), orderBy('order', 'asc'));
        let snap;
        try {
          snap = await getDocs(q);
        } catch {
          // If indexing or order field is missing on some documents, fallback to unsorted query and sort in memory
          snap = await getDocs(collection(db, 'milestones'));
        }

        if (!snap.empty) {
          const data = snap.docs.map((d) => {
            const item = d.data();
            return {
              ...item,
              id: d.id,
              order: typeof item.order === 'number' ? item.order : 0,
              isPublished: item.isPublished !== undefined ? item.isPublished : item.status !== 'draft' && item.status !== 'archived',
            } as FirestoreMilestone;
          });

          data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          cachedMilestones = { data, timestamp: Date.now() };
          return data;
        }

        // Return empty array when no documents exist in Firestore
        cachedMilestones = { data: [], timestamp: Date.now() };
        return [];
      } catch (err) {
        console.warn('[Firestore Milestones] getMilestones error:', err);
        return cachedMilestones?.data || [];
      } finally {
        inFlightMilestonesPromise = null;
      }
    })();

    return inFlightMilestonesPromise;
  },

  /**
   * Create a new milestone in Firestore
   */
  async createMilestone(data: Omit<FirestoreMilestone, 'id'> & { id?: string }): Promise<string> {
    const id = data.id || `ms-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const payload: FirestoreMilestone = sanitizeForFirestore({
      ...data,
      id,
      order: typeof data.order === 'number' ? data.order : 1,
      isPublished: data.isPublished ?? true,
      status: data.status || (data.isPublished === false ? 'draft' : 'published'),
      createdAt: data.createdAt || now,
      updatedAt: now,
    });

    const docRef = doc(db, 'milestones', id);
    await setDoc(docRef, payload, { merge: true });

    if (cachedMilestones) {
      cachedMilestones.data = [...cachedMilestones.data, payload].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
    }

    return id;
  },

  /**
   * Save or update an existing milestone in Firestore
   */
  async saveMilestone(id: string, data: Partial<FirestoreMilestone>): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: now,
    });

    await setDoc(docRef, payload, { merge: true });

    if (cachedMilestones) {
      const idx = cachedMilestones.data.findIndex((m) => m.id === id);
      if (idx >= 0) {
        cachedMilestones.data[idx] = { ...cachedMilestones.data[idx], ...payload } as FirestoreMilestone;
        cachedMilestones.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } else {
        cachedMilestones.data.push(payload as FirestoreMilestone);
        cachedMilestones.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    }
  },

  /**
   * Delete a milestone permanently from Firestore
   */
  async deleteMilestone(id: string): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    await deleteDoc(docRef);

    if (cachedMilestones) {
      cachedMilestones.data = cachedMilestones.data.filter((m) => m.id !== id);
    }
  },

  /**
   * Toggle published state for a milestone
   */
  async togglePublish(id: string, isPublished: boolean): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      isPublished,
      status: isPublished ? ('published' as const) : ('draft' as const),
      updatedAt: now,
    });

    await setDoc(docRef, payload, { merge: true });

    if (cachedMilestones) {
      const idx = cachedMilestones.data.findIndex((m) => m.id === id);
      if (idx >= 0) {
        cachedMilestones.data[idx] = { ...cachedMilestones.data[idx], ...payload };
      }
    }
  },

  /**
   * Batch update milestone order
   */
  async reorderMilestones(orderedIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    orderedIds.forEach((id, index) => {
      const docRef = doc(db, 'milestones', id);
      batch.update(docRef, { order: index + 1, updatedAt: now });
    });

    await batch.commit();

    if (cachedMilestones) {
      cachedMilestones.data = cachedMilestones.data
        .map((m) => {
          const newOrder = orderedIds.indexOf(m.id);
          return newOrder >= 0 ? { ...m, order: newOrder + 1 } : m;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  },

  /**
   * Realtime Firestore subscription for Milestones
   */
  subscribeMilestones(
    onData: (data: FirestoreMilestone[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, 'milestones'),
      (snap) => {
        const data = snap.docs.map((d) => {
          const item = d.data();
          return {
            ...item,
            id: d.id,
            order: typeof item.order === 'number' ? item.order : 0,
            isPublished: item.isPublished !== undefined ? item.isPublished : item.status !== 'draft' && item.status !== 'archived',
          } as FirestoreMilestone;
        });

        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        cachedMilestones = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Milestones] Realtime listener error:', err);
        if (onError) {
          onError(err);
        } else {
          onData(cachedMilestones?.data || []);
        }
      }
    );
  },
};
