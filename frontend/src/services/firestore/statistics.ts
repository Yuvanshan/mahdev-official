import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';

export interface FirestoreStatistic {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  subtext?: string;
  order: number;
  isActive: boolean;
  divisionId?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'statistics';

export const firestoreStatisticsService = {
  async getStatistics(): Promise<FirestoreStatistic[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreStatistic))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (err) {
      console.warn(`[FirestoreStatistics] Error fetching statistics:`, err);
      return [];
    }
  },

  async saveStatistic(id: string, data: Partial<FirestoreStatistic>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteStatistic(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeStatistics(callback: (stats: FirestoreStatistic[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const stats = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as FirestoreStatistic))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(stats);
      },
      (err) => {
        console.warn(`[FirestoreStatistics] Snapshot listener error:`, err);
      }
    );
  },
};
