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

export interface FirestoreFAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  divisionId?: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'faqs';

export const firestoreFaqsService = {
  async getFaqs(): Promise<FirestoreFAQ[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as FirestoreFAQ))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (err) {
      console.warn(`[FirestoreFaqs] Error fetching FAQs:`, err);
      return [];
    }
  },

  async saveFaq(id: string, data: Partial<FirestoreFAQ>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteFaq(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeFaqs(callback: (faqs: FirestoreFAQ[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const faqs = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as FirestoreFAQ))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        callback(faqs);
      },
      (err) => {
        console.warn(`[FirestoreFaqs] Snapshot listener error:`, err);
      }
    );
  },
};
