/**
 * Firestore Pages & Content Repository
 * Phase 2 - CMS Firestore Single Source of Truth
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
import { CmsPage } from '../../types/cms';

export const firestorePagesService = {
  async getPages(): Promise<CmsPage[]> {
    try {
      const snap = await getDocs(collection(db, 'pages'));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsPage[];
    } catch (err) {
      console.warn('[Firestore Pages] getPages error:', err);
      return [];
    }
  },

  async savePage(id: string, data: Partial<CmsPage>): Promise<void> {
    const docRef = doc(db, 'pages', id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
  },

  async deletePage(id: string): Promise<void> {
    const docRef = doc(db, 'pages', id);
    await deleteDoc(docRef);
  },

  subscribePages(callback: (pages: CmsPage[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'pages'),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsPage[];
        callback(items);
      },
      (err) => {
        console.warn('[Firestore Pages] Realtime listener error:', err);
      }
    );
  },
};
