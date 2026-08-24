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
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreContactSubmission } from '../../types/firestore';

export const firestoreContactsService = {
  async getContacts(): Promise<FirestoreContactSubmission[]> {
    try {
      const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreContactSubmission[];
    } catch (err) {
      console.warn('[Firestore Contacts] getContacts error:', err);
      return [];
    }
  },

  subscribeContacts(onData: (items: FirestoreContactSubmission[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const q = query(collection(db, 'contactSubmissions'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreContactSubmission[]);
      },
      (err) => {
        console.warn('[Firestore Contacts] subscribeContacts error:', err);
        if (onError) onError(err);
        else onData([]);
      }
    );
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
