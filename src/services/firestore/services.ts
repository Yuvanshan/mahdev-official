/**
 * Firestore Services Repository
 * Phase 23 - Real Firestore Data Integration
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreService, DivisionId } from '../../types/firestore';
import { isSameDivision } from './divisions';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 min cache
let cachedServices: { data: FirestoreService[]; timestamp: number } | null = null;
let inFlightServicesPromise: Promise<FirestoreService[]> | null = null;

export function getDefaultServices(): FirestoreService[] {
  // Phase 60: Real Data Architecture - Zero fake services by default.
  // Services are created by Admin or pulled directly from Firestore.
  return [];
}

export const firestoreServicesService = {
  /**
   * Fetch all services with optional division filtering, memory caching, and in-flight deduplication
   */
  async getServices(division?: DivisionId, forceRefresh = false): Promise<FirestoreService[]> {
    const now = Date.now();
    let allServices: FirestoreService[] = [];

    // 1. Return fresh in-memory cache immediately if not forced to refresh
    if (!forceRefresh && cachedServices && now - cachedServices.timestamp < CACHE_TTL_MS) {
      allServices = cachedServices.data;
    } else if (inFlightServicesPromise) {
      // 2. Reuse concurrent in-flight request to avoid duplicate network roundtrips
      allServices = await inFlightServicesPromise;
    } else {
      // 3. Initiate single deduplicated Firestore query
      inFlightServicesPromise = (async () => {
        try {
          const snap = await getDocs(collection(db, 'services'));
          if (!snap.empty) {
            const items = snap.docs.map((d) => ({
              ...d.data(),
              id: d.id,
            })) as FirestoreService[];
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            cachedServices = { data: items, timestamp: Date.now() };
            return items;
          } else {
            cachedServices = { data: [], timestamp: Date.now() };
            return [];
          }
        } catch (err) {
          console.warn('[Firestore Services] getServices error:', err);
          return cachedServices?.data || [];
        } finally {
          inFlightServicesPromise = null;
        }
      })();
      allServices = await inFlightServicesPromise;
    }

    if (division) {
      return allServices.filter(
        (s) => isSameDivision(s.division, division) || isSameDivision((s as any).divisionId, division)
      );
    }
    return allServices;
  },

  /**
   * Fetch single service by ID
   */
  async getServiceById(id: string): Promise<FirestoreService | null> {
    const all = await this.getServices();
    return all.find((s) => s.id === id) || null;
  },

  /**
   * Create or update service
   */
  async saveService(id: string, data: Partial<FirestoreService>): Promise<void> {
    const docRef = doc(db, 'services', id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    if (cachedServices) {
      const idx = cachedServices.data.findIndex((s) => s.id === id);
      if (idx >= 0) {
        cachedServices.data[idx] = { ...cachedServices.data[idx], ...payload } as FirestoreService;
      } else {
        cachedServices.data.push(payload as FirestoreService);
      }
      cachedServices.data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    try {
      await Promise.race([
        setDoc(docRef, payload, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (err) {
      console.warn('[Firestore Services] save warning:', err);
    }
  },

  /**
   * Batch update service display order
   */
  async reorderServices(orderedIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    orderedIds.forEach((id, index) => {
      const docRef = doc(db, 'services', id);
      batch.update(docRef, { order: index + 1, updatedAt: now });
    });

    try {
      await Promise.race([
        batch.commit(),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (err) {
      console.warn('[Firestore Services] reorder warning:', err);
    }

    if (cachedServices) {
      cachedServices.data = cachedServices.data
        .map((s) => {
          const newOrder = orderedIds.indexOf(s.id);
          return newOrder >= 0 ? { ...s, order: newOrder + 1 } : s;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  },

  /**
   * Permanently delete service from Firestore
   */
  async deleteService(id: string): Promise<void> {
    const docRef = doc(db, 'services', id);
    if (cachedServices) {
      cachedServices.data = cachedServices.data.filter((s) => s.id !== id);
    }
    try {
      await Promise.race([
        deleteDoc(docRef),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
    } catch (err) {
      console.warn('[Firestore Services] delete warning:', err);
    }
  },

  /**
   * Realtime listener for services
   */
  subscribeServices(
    onDataOrDivision: ((data: FirestoreService[]) => void) | DivisionId | undefined,
    onDataCallback?: (data: FirestoreService[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const division = typeof onDataOrDivision === 'string' ? onDataOrDivision : undefined;
    const onData = typeof onDataOrDivision === 'function' ? onDataOrDivision : onDataCallback || (() => {});

    const colRef = collection(db, 'services');

    return onSnapshot(
      colRef,
      (snap) => {
        let data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestoreService[];
        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        cachedServices = { data, timestamp: Date.now() };

        if (division) {
          const filtered = data.filter(
            (s) => isSameDivision(s.division, division) || isSameDivision((s as any).divisionId, division)
          );
          onData(filtered);
        } else {
          onData(data);
        }
      },
      (err) => {
        console.warn('[Firestore Services] Listener error:', err);
        if (onError) onError(err);
        const fallback = cachedServices?.data || [];
        if (division) {
          onData(
            fallback.filter(
              (s) => isSameDivision(s.division, division) || isSameDivision((s as any).divisionId, division)
            )
          );
        } else {
          onData(fallback);
        }
      }
    );
  },
};
