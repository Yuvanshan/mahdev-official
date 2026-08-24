/**
 * Firestore Trusted Companies Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreTrustedCompany } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 30;
let cachedCompanies: { data: FirestoreTrustedCompany[]; timestamp: number } | null = null;

export function getDefaultTrustedCompanies(): FirestoreTrustedCompany[] {
  // Phase 60: Real Data Architecture - Zero fake companies by default.
  // Partner companies are managed dynamically via Firestore or Admin Portal.
  return [];
}

export const firestoreTrustedCompaniesService = {
  async getTrustedCompanies(forceRefresh = false): Promise<FirestoreTrustedCompany[]> {
    const now = Date.now();
    if (!forceRefresh && cachedCompanies && now - cachedCompanies.timestamp < CACHE_TTL_MS) {
      return cachedCompanies.data;
    }

    try {
      const snap = await getDocs(collection(db, 'trustedCompanies'));
      if (!snap.empty) {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTrustedCompany[];
        cachedCompanies = { data, timestamp: now };
        return data;
      }
      cachedCompanies = { data: [], timestamp: now };
      return [];
    } catch (err) {
      console.warn('[Firestore TrustedCompanies] getTrustedCompanies error:', err);
      return cachedCompanies?.data || [];
    }
  },

  async saveTrustedCompany(id: string, data: Partial<FirestoreTrustedCompany>): Promise<void> {
    const docRef = doc(db, 'trustedCompanies', id);
    const payload = sanitizeForFirestore({ ...data, id });
    await setDoc(docRef, payload, { merge: true });
    if (cachedCompanies) {
      const idx = cachedCompanies.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cachedCompanies.data[idx] = { ...cachedCompanies.data[idx], ...payload } as FirestoreTrustedCompany;
      }
    }
  },

  async deleteTrustedCompany(id: string): Promise<void> {
    const docRef = doc(db, 'trustedCompanies', id);
    await deleteDoc(docRef);
    if (cachedCompanies) {
      cachedCompanies.data = cachedCompanies.data.filter((c) => c.id !== id);
    }
  },

  subscribeTrustedCompanies(onData: (data: FirestoreTrustedCompany[]) => void): Unsubscribe {
    return onSnapshot(
      collection(db, 'trustedCompanies'),
      (snap) => {
        const data = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTrustedCompany[];
        cachedCompanies = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore TrustedCompanies] Listener error:', err);
        onData(cachedCompanies?.data || []);
      }
    );
  },
};
