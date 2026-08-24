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
import { db } from '../../lib/firebase';
import { FirestoreTrustedCompany } from '../../types/firestore';
import { TRUSTED_COMPANIES } from '../../data/homeData';

const CACHE_TTL_MS = 1000 * 60 * 30;
let cachedCompanies: { data: FirestoreTrustedCompany[]; timestamp: number } | null = null;

export function getDefaultTrustedCompanies(): FirestoreTrustedCompany[] {
  return TRUSTED_COMPANIES.map((c, idx) => ({
    id: c.id || `co-${idx + 1}`,
    name: c.name,
    logoUrl: c.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=0f172a&color=38bdf8`,
    tier: 'enterprise',
    status: 'active',
  }));
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
      const defaults = getDefaultTrustedCompanies();
      for (const item of defaults) {
        await setDoc(doc(db, 'trustedCompanies', item.id), item, { merge: true });
      }
      cachedCompanies = { data: defaults, timestamp: now };
      return defaults;
    } catch (err) {
      console.warn('[Firestore TrustedCompanies] getTrustedCompanies fallback:', err);
      return cachedCompanies?.data || getDefaultTrustedCompanies();
    }
  },

  async saveTrustedCompany(id: string, data: Partial<FirestoreTrustedCompany>): Promise<void> {
    const docRef = doc(db, 'trustedCompanies', id);
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedCompanies) {
      const idx = cachedCompanies.data.findIndex((c) => c.id === id);
      if (idx >= 0) {
        cachedCompanies.data[idx] = { ...cachedCompanies.data[idx], ...data } as FirestoreTrustedCompany;
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
        if (!snap.empty) {
          onData(snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreTrustedCompany[]);
        } else {
          onData(getDefaultTrustedCompanies());
        }
      },
      () => {
        onData(getDefaultTrustedCompanies());
      }
    );
  },
};
