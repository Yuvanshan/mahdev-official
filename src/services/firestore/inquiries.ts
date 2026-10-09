import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
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
const ADMIN_INBOX_POLL_INTERVAL_MS = 2500;
type InquirySubscriber = {
  callback: (inquiries: FirestoreInquiry[]) => void;
  onError?: (error: Error) => void;
};
const inquirySubscribers = new Set<InquirySubscriber>();
let stopInquiryFeed: (() => void) | null = null;

function startInquiryFeed(): void {
  if (stopInquiryFeed) return;
  let errorNotified = false;
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(250));
  stopInquiryFeed = onSnapshot(
    q,
    (snapshot) => {
      errorNotified = false;
      const inquiries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInquiry));
      inquirySubscribers.forEach(({ callback }) => callback(inquiries));
    },
    (err) => {
      if (!errorNotified) {
        errorNotified = true;
        console.warn('[FirestoreInquiries] Snapshot listener error:', err);
        inquirySubscribers.forEach(({ onError }) => onError?.(err));
      }
    },
    ADMIN_INBOX_POLL_INTERVAL_MS
  );
}

export const firestoreInquiriesService = {
  async getInquiries(): Promise<FirestoreInquiry[]> {
    const snapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'), limit(250))
    );
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreInquiry));
  },

  async createInquiry(data: Omit<FirestoreInquiry, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string; status?: FirestoreInquiry['status'] }): Promise<string> {
    const id = data.id || `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COLLECTION_NAME, id);
    const sanitized = sanitizeForFirestore({
      ...data,
      id,
      status: data.status || 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, sanitized);

    // Dispatch email to info.mahdev.lk@gmail.com via backend mail gateway
    try {
      await fetch('/api/inquiries/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          referenceId: id,
          fullName: data.fullName || data.name,
          name: data.name || data.fullName,
          email: data.email,
          phone: data.phone,
          division: data.division || data.divisionId,
          service: data.service || data.serviceName,
          subject: data.subject || (data.service ? `Enquiry for ${data.service}` : 'Website Customer Enquiry'),
          message: data.message,
          preferredDate: data.preferredDate,
          location: data.location,
        }),
      });
    } catch (apiErr) {
      console.warn('[FirestoreInquiries] Backend email dispatch notice:', apiErr);
    }

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

  subscribeInquiries(
    callback: (inquiries: FirestoreInquiry[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const subscriber = { callback, onError };
    inquirySubscribers.add(subscriber);
    startInquiryFeed();
    return () => {
      inquirySubscribers.delete(subscriber);
      if (inquirySubscribers.size === 0 && stopInquiryFeed) {
        stopInquiryFeed();
        stopInquiryFeed = null;
      }
    };
  },
};
