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
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreTrustedCompany } from '../../types/firestore';

const CACHE_TTL_MS = 1000 * 60 * 30;
let cachedCompanies: { data: FirestoreTrustedCompany[]; timestamp: number } | null = null;

export function getDefaultTrustedCompanies(): FirestoreTrustedCompany[] {
  // Phase 60: Real Data Architecture - Zero fake companies by default.
  // Partner companies are managed dynamically via Firestore or Admin Portal.
  return [];
}

export function isPublishedTrustedCompany(company: FirestoreTrustedCompany): boolean {
  return company.isDeleted !== true &&
    company.isPublished !== false &&
    company.status !== 'inactive';
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
      if (!forceRefresh && cachedCompanies) return cachedCompanies.data;
      throw err;
    }
  },

  async saveTrustedCompany(id: string, data: Partial<FirestoreTrustedCompany>): Promise<void> {
    const docRef = doc(db, 'trustedCompanies', id);
    const existing = cachedCompanies?.data.find((company) => company.id === id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      createdAt: data.createdAt || existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
    const companies = cachedCompanies?.data || [];
    const idx = companies.findIndex((company) => company.id === id);
    const updated = { ...existing, ...payload } as FirestoreTrustedCompany;
    const next = idx >= 0
      ? companies.map((company, index) => index === idx ? updated : company)
      : [updated, ...companies];
    cachedCompanies = { data: next, timestamp: Date.now() };
  },

  async createTrustedCompany(data: Omit<FirestoreTrustedCompany, 'id'>): Promise<FirestoreTrustedCompany> {
    const id = `company-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    await this.saveTrustedCompany(id, data);
    const created = cachedCompanies?.data.find((company) => company.id === id);
    if (!created) throw new Error('Company was saved but could not be read from the local cache.');
    return created;
  },

  async deleteTrustedCompany(id: string): Promise<void> {
    const docRef = doc(db, 'trustedCompanies', id);
    await deleteDoc(docRef);
    cachedCompanies = {
      data: (cachedCompanies?.data || []).filter((company) => company.id !== id),
      timestamp: Date.now(),
    };
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
