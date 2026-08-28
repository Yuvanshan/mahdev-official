/**
 * Firestore Coupons Repository
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
import { CmsCoupon } from '../../types/cms';

export const firestoreCouponsService = {
  async getCoupons(): Promise<CmsCoupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsCoupon[];
    } catch (err) {
      console.warn('[Firestore Coupons] getCoupons error:', err);
      return [];
    }
  },

  async saveCoupon(id: string, data: Partial<CmsCoupon>): Promise<void> {
    const docRef = doc(db, 'coupons', id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
  },

  async deleteCoupon(id: string): Promise<void> {
    const docRef = doc(db, 'coupons', id);
    await deleteDoc(docRef);
  },

  subscribeCoupons(callback: (coupons: CmsCoupon[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'coupons'),
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id })) as CmsCoupon[];
        callback(items);
      },
      (err) => {
        console.warn('[Firestore Coupons] Realtime listener error:', err);
      }
    );
  },
};
