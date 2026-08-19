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
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestoreService, DivisionId } from '../../types/firestore';
import { MASTER_BOOKABLE_SERVICES } from '../../data/bookingServices';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15 min cache
let cachedServices: { data: FirestoreService[]; timestamp: number } | null = null;

export function getDefaultServices(): FirestoreService[] {
  return MASTER_BOOKABLE_SERVICES.map((item) => ({
    id: item.id,
    division: item.divisionId as DivisionId,
    name: item.name,
    slug: item.id,
    description: item.description,
    images: [item.imageUrl],
    price: item.packages[0]?.price || 100,
    currency: item.packages[0]?.currency || 'USD',
    status: 'active',
    bookingEnabled: true,
    quoteEnabled: true,
    metadata: {
      sku: item.sku,
      bookingType: item.bookingType,
      leadTimeDays: item.leadTimeDays,
      maxBookingsPerDay: item.maxBookingsPerDay,
      availableTimeSlots: item.availableTimeSlots,
      packages: item.packages,
      locationTypeDefault: item.locationTypeDefault,
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  }));
}

export const firestoreServicesService = {
  /**
   * Fetch all services with optional division filtering and caching
   */
  async getServices(division?: DivisionId, forceRefresh = false): Promise<FirestoreService[]> {
    const now = Date.now();
    let allServices: FirestoreService[] = [];

    if (!forceRefresh && cachedServices && now - cachedServices.timestamp < CACHE_TTL_MS) {
      allServices = cachedServices.data;
    } else {
      try {
        const snap = await getDocs(collection(db, 'services'));
        if (!snap.empty) {
          allServices = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreService[];
          cachedServices = { data: allServices, timestamp: now };
        } else {
          // Auto-seed defaults if collection is empty
          const defaults = getDefaultServices();
          for (const s of defaults) {
            await setDoc(doc(db, 'services', s.id), s, { merge: true });
          }
          allServices = defaults;
          cachedServices = { data: defaults, timestamp: now };
        }
      } catch (err) {
        console.warn('[Firestore Services] getServices fallback to local defaults:', err);
        allServices = cachedServices?.data || getDefaultServices();
      }
    }

    if (division) {
      return allServices.filter((s) => s.division === division);
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
    const payload = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    if (cachedServices) {
      const idx = cachedServices.data.findIndex((s) => s.id === id);
      if (idx >= 0) {
        cachedServices.data[idx] = { ...cachedServices.data[idx], ...payload } as FirestoreService;
      } else {
        cachedServices.data.push(payload as FirestoreService);
      }
    }
  },

  /**
   * Realtime listener for services
   */
  subscribeServices(
    division: DivisionId | undefined,
    onData: (data: FirestoreService[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const colRef = collection(db, 'services');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;

    return onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const data = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreService[];
          onData(data);
        } else {
          const defaults = getDefaultServices();
          onData(division ? defaults.filter((d) => d.division === division) : defaults);
        }
      },
      (err) => {
        console.warn('[Firestore Services] Listener error:', err);
        if (onError) onError(err);
        const defaults = getDefaultServices();
        onData(division ? defaults.filter((d) => d.division === division) : defaults);
      }
    );
  },
};
