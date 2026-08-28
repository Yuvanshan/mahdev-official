/**
 * Firestore Packages Repository
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
import { CmsPackage } from '../../types/cms';

export const firestorePackagesService = {
  async getPackages(divisionId?: string): Promise<CmsPackage[]> {
    try {
      const q = divisionId && divisionId !== 'all'
        ? query(collection(db, 'packages'), where('divisionId', '==', divisionId))
        : collection(db, 'packages');
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsPackage[];
    } catch (err) {
      console.warn('[Firestore Packages] getPackages error:', err);
      return [];
    }
  },

  async savePackage(id: string, data: Partial<CmsPackage>): Promise<void> {
    const docRef = doc(db, 'packages', id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
  },

  async deletePackage(id: string): Promise<void> {
    const docRef = doc(db, 'packages', id);
    await deleteDoc(docRef);
  },

  subscribePackages(
    divisionIdOrCallback?: string | ((packages: CmsPackage[]) => void),
    callbackArg?: (packages: CmsPackage[]) => void
  ): Unsubscribe {
    const callback = typeof divisionIdOrCallback === 'function' ? divisionIdOrCallback : callbackArg || (() => {});
    const divisionId = typeof divisionIdOrCallback === 'string' ? divisionIdOrCallback : undefined;
    const q = divisionId && divisionId !== 'all'
      ? query(collection(db, 'packages'), where('divisionId', '==', divisionId))
      : collection(db, 'packages');
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsPackage[];
        callback(items);
      },
      (err) => {
        console.warn('[Firestore Packages] Realtime listener error:', err);
      }
    );
  },
};
