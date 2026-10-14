/**
 * Firestore Announcements Repository (Phase 57 Compliant)
 * Broadcast notices and site banners
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
  orderBy,
  onSnapshot,
  Unsubscribe,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreAnnouncement } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 min cache
let cachedAnnouncements: { data: FirestoreAnnouncement[]; timestamp: number } | null = null;

export const firestoreAnnouncementsService = {
  /**
   * Fetch all announcements
   */
  async getAnnouncements(forceRefresh = false): Promise<FirestoreAnnouncement[]> {
    const now = Date.now();
    if (!forceRefresh && cachedAnnouncements && now - cachedAnnouncements.timestamp < CACHE_TTL_MS) {
      return cachedAnnouncements.data;
    }

    try {
      const q = query(collection(db, 'announcements'), orderBy('order', 'asc'));
      let snap;
      try {
        snap = await getDocs(q);
      } catch {
        snap = await getDocs(collection(db, 'announcements'));
      }

      if (!snap.empty) {
        const data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestoreAnnouncement[];
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        cachedAnnouncements = { data, timestamp: now };
        return data;
      }

      cachedAnnouncements = { data: [], timestamp: now };
      return [];
    } catch (err) {
      console.warn('[Firestore Announcements] getAnnouncements fallback:', err);
      return cachedAnnouncements?.data || [];
    }
  },

  /**
   * Save announcement
   */
  async saveAnnouncement(id: string, data: Partial<FirestoreAnnouncement>): Promise<void> {
    const docRef = doc(db, 'announcements', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: now,
    });
    await setDoc(docRef, payload, { merge: true });
    if (cachedAnnouncements) {
      const idx = cachedAnnouncements.data.findIndex((a) => a.id === id);
      if (idx >= 0) {
        cachedAnnouncements.data[idx] = { ...cachedAnnouncements.data[idx], ...payload } as FirestoreAnnouncement;
      } else {
        cachedAnnouncements.data.push(payload as FirestoreAnnouncement);
      }
      cachedAnnouncements.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  },

  /**
   * Delete announcement
   */
  async deleteAnnouncement(id: string): Promise<void> {
    await deleteDoc(doc(db, 'announcements', id));
    if (cachedAnnouncements) {
      cachedAnnouncements.data = cachedAnnouncements.data.filter((a) => a.id !== id);
    }
  },

  /**
   * Realtime announcements listener
   */
  subscribeAnnouncements(onData: (items: FirestoreAnnouncement[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreAnnouncement[];
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        cachedAnnouncements = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Announcements] Realtime error:', err);
        onData(cachedAnnouncements?.data || []);
      }
    );
  },
};
