import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';

export interface FirestoreNavigationItem {
  id: string;
  label: string;
  route: string;
  order: number;
  isActive: boolean;
  isExternal?: boolean;
  icon?: string;
  description?: string;
  parentId?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'navigation';

export const firestoreNavigationService = {
  async getNavigationItems(): Promise<FirestoreNavigationItem[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as FirestoreNavigationItem[];
    } catch (err) {
      console.warn(`[FirestoreNavigation] Failed to fetch navigation items:`, err);
      return [];
    }
  },

  async getActiveNavigation(): Promise<FirestoreNavigationItem[]> {
    try {
      const all = await this.getNavigationItems();
      return all.filter((item) => item.isActive !== false);
    } catch (err) {
      console.warn(`[FirestoreNavigation] Failed to get active navigation:`, err);
      return [];
    }
  },

  async saveNavigationItem(id: string, data: Partial<FirestoreNavigationItem>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteNavigationItem(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeNavigation(callback: (items: FirestoreNavigationItem[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as FirestoreNavigationItem))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(items);
      },
      (err) => {
        console.warn(`[FirestoreNavigation] Snapshot listener error:`, err);
      }
    );
  },
};
