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
  limit,
  onSnapshot,
  Unsubscribe,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreContactSubmission } from '../../types/firestore';

const ADMIN_INBOX_POLL_INTERVAL_MS = 2500;
type ContactSubscriber = {
  onData: (items: FirestoreContactSubmission[]) => void;
  onError?: (error: Error) => void;
};
const contactSubscribers = new Set<ContactSubscriber>();
let stopContactFeed: Unsubscribe | null = null;

function startContactFeed(): void {
  if (stopContactFeed) return;
  let errorNotified = false;
  const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'), limit(250));
  stopContactFeed = onSnapshot(
    q,
    (snap) => {
      errorNotified = false;
      const contacts = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreContactSubmission[];
      contactSubscribers.forEach(({ onData }) => onData(contacts));
    },
    (err) => {
      if (!errorNotified) {
        errorNotified = true;
        console.warn('[Firestore Contacts] subscribeContacts error:', err);
        contactSubscribers.forEach(({ onError }) => onError?.(err));
      }
    },
    ADMIN_INBOX_POLL_INTERVAL_MS
  );
}

export const firestoreContactsService = {
  async getContacts(): Promise<FirestoreContactSubmission[]> {
    const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'), limit(250));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreContactSubmission[];
  },

  subscribeContacts(onData: (items: FirestoreContactSubmission[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const subscriber = { onData, onError };
    contactSubscribers.add(subscriber);
    startContactFeed();
    return () => {
      contactSubscribers.delete(subscriber);
      if (contactSubscribers.size === 0 && stopContactFeed) {
        stopContactFeed();
        stopContactFeed = null;
      }
    };
  },

  async submitContact(data: Omit<FirestoreContactSubmission, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const id = `CNT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const docRef = doc(db, 'contactSubmissions', id);
    const payload: FirestoreContactSubmission = sanitizeForFirestore({
      id,
      ...data,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    
    await setDoc(docRef, payload);

    // Trigger backend notification and email routing to info.mahdev.lk@gmail.com
    try {
      await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          referenceId: id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          division: data.division,
          subject: data.subject,
          message: data.message,
        }),
      });
    } catch (apiErr) {
      console.warn('[Contact Submit] Backend email dispatch notice:', apiErr);
    }

    return id;
  },

  async updateContactStatus(id: string, status: FirestoreContactSubmission['status']): Promise<void> {
    const docRef = doc(db, 'contactSubmissions', id);
    await updateDoc(docRef, { status });
  },

  async deleteContact(id: string): Promise<void> {
    await deleteDoc(doc(db, 'contactSubmissions', id));
  },
};
