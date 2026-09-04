import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'new'
  | 'contacted'
  | 'in-progress'
  | 'in-review'
  | 'completed'
  | 'cancelled'
  | 'converted'
  | 'archived';

export interface FirestoreInquiry {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  service?: string;
  serviceId?: string;
  serviceName?: string;
  divisionId?: string;
  division?: string;
  preferredDate?: string;
  location?: string;
  subject?: string;
  message: string;
  status: EnquiryStatus | string;
  notes?: string;
  source?: 'contact_page' | 'cta_banner' | 'division_page' | 'direct' | string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = 'inquiries';

export const firestoreInquiriesService = {
  async getInquiries(): Promise<FirestoreInquiry[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInquiry));
    } catch (err) {
      console.warn(`[FirestoreInquiries] Error fetching inquiries:`, err);
      return [];
    }
  },

  async createInquiry(data: Omit<FirestoreInquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: FirestoreInquiry['status'] }): Promise<string> {
    const id = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      status: data.status || 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized);
    return id;
  },

  async updateInquiry(id: string, data: Partial<FirestoreInquiry>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  },

  async deleteInquiry(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  subscribeInquiries(callback: (inquiries: FirestoreInquiry[]) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snapshot) => {
        const inquiries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInquiry));
        callback(inquiries);
      },
      (err) => {
        console.warn(`[FirestoreInquiries] Snapshot listener error:`, err);
      }
    );
  },
};
