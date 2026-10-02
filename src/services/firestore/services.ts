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
  return [
    {
      id: 'ser-mtr6myjc-diqc',
      price: 25000,
      turnaroundTime: '2-3 Weeks',
      description: 'Full Cradle Ceremony Decoration with Name reveal board amd Welcome board and colots can be customised ',
      badge: 'Traditional Cradle Ceremony ',
      popular: true,
      quoteEnabled: true,
      divisionName: 'SWS Event Management',
      imageUrl: '/uploads/images/services_ser-mtr6myjc-diqc_imageUrl_munpwzrt.webp',
      status: 'active',
      title: 'Cradle Ceremony Decoration ',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-09-07T11:53:53.503Z',
      images: ['/uploads/images/services_ser-mtr6myjc-diqc_images_0_munpwzxc.webp'],
      iconName: 'Sparkles',
      name: 'Cradle Ceremony Decoration ',
      features: [
        'Colors Can Be Customised',
        'Name Reveal Board',
        'Welcome Board',
        'Grass Carpet',
        'Elegant Design',
      ],
      division: 'sws',
      bookingEnabled: true,
      currency: 'LKR',
      startingPrice: 25000,
      category: 'Cradle Ceremony',
      slug: 'ser-mtr6myjc-diqc',
      divisionId: 'sws',
    },
    {
      id: 'ser-mu71rh63-jxyp',
      badge: 'Wedding Decor',
      price: 45000,
      category: 'Wedding Decoration',
      slug: 'ser-mu71rh63-jxyp',
      status: 'active',
      bookingEnabled: true,
      currency: 'LKR',
      features: [
        '24/7 Dedicated Concierge',
        'Custom Architectural CAD Renderings',
        'High Reliability Delivery',
      ],
      description: "We'll Deliver Elegance Best Ever Decoration for your wedding and special occasions ",
      title: 'Wedding Decoration ',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-09-18T14:21:45.030Z',
      popular: false,
      division: 'sws',
      images: ['/uploads/images/services_ser-mu71rh63-jxyp_images_0_munpx0fc.webp'],
      name: 'Wedding Decoration ',
      iconName: 'Sparkles',
      divisionId: 'sws',
      imageUrl: '/uploads/images/services_ser-mu71rh63-jxyp_imageUrl_munpx0a7.webp',
      startingPrice: 45000,
      quoteEnabled: true,
      divisionName: 'SWS Event Management',
      turnaroundTime: '1 week',
    },
    {
      id: 'ser-mu71u7g1-43hh',
      images: ['/uploads/images/services_ser-mu71u7g1-43hh_images_0_munpx0x7.webp'],
      badge: 'Birthday Decoration ',
      startingPrice: 48000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-09-18T14:23:52.395Z',
      category: 'Birthday Decoration',
      bookingEnabled: true,
      name: 'Birthday Decoration ',
      slug: 'ser-mu71u7g1-43hh',
      description: "We'll Deliver Birthday Decorations",
      sku: 'SRV-SWS-BIRT-291',
      turnaroundTime: '2-3 Weeks',
      popular: true,
      division: 'sws',
      status: 'active',
      features: [
        '24/7 Dedicated Concierge',
        'Custom Architectural CAD Renderings',
        'High Reliability Delivery',
      ],
      price: 48000,
      divisionName: 'SWS Event Management',
      currency: 'LKR',
      quoteEnabled: true,
      divisionId: 'sws',
      title: 'Birthday Decoration ',
      imageUrl: '/uploads/images/services_ser-mu71u7g1-43hh_imageUrl_munpx0ry.webp',
      iconName: 'Sparkles',
    },
    {
      id: 'ser-mubdf0vj-4a2e',
      category: 'Album',
      popular: true,
      divisionName: 'U1 Studio',
      quoteEnabled: true,
      status: 'active',
      badge: 'Mini Album',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-09-21T14:59:04.138Z',
      bookingEnabled: true,
      sku: 'SRV-U1-MINI-452',
      slug: 'ser-mubdf0vj-4a2e',
      divisionId: 'u1',
      division: 'u1',
      features: [
        'High Reliability Delivery',
        '30 Sheets',
        'Onday Event Photography ( 3 to 4 hrs)',
        'One day Out door ( 2 to 3 hrs)',
        'Professional color corrected sift copies ( google drive)',
      ],
      currency: 'LKR',
      description: "30 Sheets Album we'll do the onday event photography (3 to 4 hrs) and one day out doot Photography ",
      turnaroundTime: '4 weeks',
      imageUrl: '/uploads/images/services_ser-mubdf0vj-4a2e_imageUrl_munpx1aq.webp',
      startingPrice: 30000,
      images: [
        '/uploads/images/services_ser-mubdf0vj-4a2e_images_0_munpx1h9.webp',
        '/uploads/images/services_ser-mubdf0vj-4a2e_images_1_munpx1na.webp',
        '/uploads/images/services_ser-mubdf0vj-4a2e_images_2_munpx1t0.webp',
        '/uploads/images/services_ser-mubdf0vj-4a2e_images_3_munpx1xo.webp',
      ],
      name: 'Mini Album',
      title: 'Mini Album',
      iconName: 'Sparkles',
      price: 30000,
    },
    {
      id: 'ser-mubdk7r1-52s1',
      quoteEnabled: true,
      imageUrl: '/uploads/images/services_ser-mubdk7r1-52s1_imageUrl_munpx293.webp',
      divisionName: 'U1 Studio',
      iconName: 'Sparkles',
      divisionId: 'u1',
      status: 'active',
      popular: true,
      badge: '12 x 36 album',
      features: [
        'High Reliability Delivery',
        '12 x 36 size 30 sheets album',
        'Sadangu Day photography',
        'Function day photography',
        'One day outdoor Photography',
      ],
      division: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-09-21T15:03:06.330Z',
      currency: 'LKR',
      description: 'Function Day and Sadangu Day photography and one day outdoor photography full day with 12 x 36 album 30 sheets',
      startingPrice: 148000,
      sku: 'SRV-U1-PUBE-682',
      images: ['/uploads/images/services_ser-mubdk7r1-52s1_images_0_munpx2f7.webp'],
      name: 'Puberty Ceremony Photography ',
      turnaroundTime: '4 weeks',
      category: 'Album',
      price: 148000,
      bookingEnabled: true,
      slug: 'ser-mubdk7r1-52s1',
      title: 'Puberty Ceremony Photography ',
    },
  ];
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
   * Explicitly invalidate in-memory services cache
   */
  clearCache(): void {
    cachedServices = null;
    inFlightServicesPromise = null;
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
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn('[Firestore Services] save warning:', err);
      throw err;
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
      await batch.commit();
    } catch (err) {
      console.warn('[Firestore Services] reorder warning:', err);
      throw err;
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
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore Services] delete warning:', err);
      throw err;
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
