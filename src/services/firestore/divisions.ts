/**
 * Firestore Divisions Repository (Phase 57 Compliant)
 * Handles divisions collection with canonical document IDs:
 * - sws
 * - u1-studio
 * - it-solutions
 * - travels
 * - online-mart
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreDivision, DivisionId } from '../../types/firestore';
import { DIVISIONS } from '../../config/divisions';

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes cache for divisions
let cachedDivisions: { data: FirestoreDivision[]; timestamp: number } | null = null;

// Map configuration keys to Phase 57 Document IDs and details
export const DIVISION_DOCUMENT_MAP: Record<string, {
  docId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  logoUrl: string;
  route: string;
  order: number;
}> = {
  sws: {
    docId: 'sws',
    name: 'SWS Event Management',
    slug: 'sws',
    shortDescription: 'Premier luxury wedding and stage decorations, audio-visual production, mandap architecture, and concert staging.',
    description: DIVISIONS.sws.description,
    imageUrl: '/assets/images/hero_sws.jpg',
    logoUrl: '/assets/images/sws_logo.png',
    route: '/sws',
    order: 1,
  },
  'u1-studio': {
    docId: 'u1-studio',
    name: 'U1 Studio',
    slug: 'u1-studio',
    shortDescription: 'State-of-the-art photography, 8K cinematic films, wedding photojournalism, and studio fashion productions.',
    description: DIVISIONS.u1.description,
    imageUrl: '/assets/images/hero_u1.jpg',
    logoUrl: '/assets/images/u1_logo.png',
    route: '/u1',
    order: 2,
  },
  'it-solutions': {
    docId: 'it-solutions',
    name: 'Mahdev IT Solutions',
    slug: 'it-solutions',
    shortDescription: 'Enterprise software engineering, modern cloud architecture, scalable web/mobile platforms, and cybersecurity.',
    description: DIVISIONS.it.description,
    imageUrl: '/assets/images/hero_it.jpg',
    logoUrl: '/assets/images/it_logo.png',
    route: '/it',
    order: 3,
  },
  travels: {
    docId: 'travels',
    name: 'Mahdev Travels',
    slug: 'travels',
    shortDescription: 'Bespoke travel curation, VIP corporate retreats, luxury island expeditions, and chauffeur services.',
    description: DIVISIONS.travels.description,
    imageUrl: '/assets/images/hero_travels.jpg',
    logoUrl: '/assets/images/travels_logo.png',
    route: '/travels',
    order: 4,
  },
  'online-mart': {
    docId: 'online-mart',
    name: 'Mahdev Online Mart',
    slug: 'online-mart',
    shortDescription: 'Curated e-commerce storefront delivering verified camera gear, audio hardware, and computing essentials.',
    description: DIVISIONS.mart.description,
    imageUrl: '/assets/images/hero_mart.jpg',
    logoUrl: '/assets/images/mart_logo.png',
    route: '/mart',
    order: 5,
  },
};

export function getDivisionFallbackOrder(id: string): number {
  if (id === 'sws') return 1;
  if (id === 'u1' || id === 'u1-studio') return 2;
  if (id === 'it' || id === 'it-solutions') return 3;
  if (id === 'travels') return 4;
  if (id === 'mart' || id === 'online-mart') return 5;
  return 99;
}

export function sortDivisions(list: FirestoreDivision[]): FirestoreDivision[] {
  return [...list].sort((a, b) => {
    const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : getDivisionFallbackOrder(a.id);
    const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : getDivisionFallbackOrder(b.id);
    return orderA - orderB;
  });
}

export function getDefaultDivisions(): FirestoreDivision[] {
  const now = new Date().toISOString();
  return Object.values(DIVISION_DOCUMENT_MAP).map((d) => {
    const rawDivision = DIVISIONS[d.docId === 'u1-studio' ? 'u1' : d.docId === 'it-solutions' ? 'it' : d.docId === 'online-mart' ? 'mart' : (d.docId as keyof typeof DIVISIONS)];
    const item: FirestoreDivision = {
      id: d.docId,
      name: d.name,
      slug: d.slug,
      shortDescription: d.shortDescription,
      description: d.description,
      imageUrl: d.imageUrl,
      logoUrl: d.logoUrl,
      logo: d.logoUrl,
      route: d.route,
      isPublished: true,
      order: d.order,
      hero: {
        title: rawDivision?.heroHeadline || d.name,
        subtitle: rawDivision?.heroSubheadline || d.shortDescription,
        badge: rawDivision?.badge || d.name,
        bgImage: d.imageUrl,
        ctaText: `Explore ${d.name}`,
      },
      status: 'active',
      seo: {
        metaTitle: `${d.name} | Mahdev Pvt Ltd`,
        metaDescription: d.shortDescription,
        keywords: [d.docId, d.slug, 'mahdev', 'sri lanka'],
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: now,
    };
    return sanitizeForFirestore(item);
  });
}

export const firestoreDivisionsService = {
  /**
   * Fetch all 5 active business divisions with cache and fallback
   */
  async getDivisions(forceRefresh = false): Promise<FirestoreDivision[]> {
    const now = Date.now();
    if (!forceRefresh && cachedDivisions && now - cachedDivisions.timestamp < CACHE_TTL_MS) {
      return cachedDivisions.data;
    }

    try {
      const snap = await getDocs(collection(db, 'divisions'));
      if (!snap.empty) {
        const raw = snap.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as FirestoreDivision[];
        const data = sortDivisions(raw);
        cachedDivisions = { data, timestamp: now };
        return data;
      }

      const defaultDivs = sortDivisions(getDefaultDivisions());
      cachedDivisions = { data: defaultDivs, timestamp: now };
      return defaultDivs;
    } catch (err) {
      console.warn('[Firestore Divisions] getDivisions error:', err);
      return cachedDivisions?.data || sortDivisions(getDefaultDivisions());
    }
  },

  /**
   * Fetch single division by ID
   */
  async getDivisionById(id: DivisionId | string): Promise<FirestoreDivision | null> {
    const all = await this.getDivisions();
    const normalizedId = id === 'u1' ? 'u1-studio' : id === 'it' ? 'it-solutions' : id === 'mart' ? 'online-mart' : id;
    return all.find((d) => d.id === id || d.id === normalizedId || d.slug === id) || null;
  },

  /**
   * Update or create division document
   */
  async saveDivision(id: DivisionId | string, data: Partial<FirestoreDivision>): Promise<void> {
    const docRef = doc(db, 'divisions', id);
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, payload, { merge: true });
    if (cachedDivisions) {
      const idx = cachedDivisions.data.findIndex((d) => d.id === id);
      if (idx >= 0) {
        cachedDivisions.data[idx] = { ...cachedDivisions.data[idx], ...payload } as FirestoreDivision;
        cachedDivisions.data = sortDivisions(cachedDivisions.data);
      }
    }
  },

  /**
   * Reorder all divisions with sequential orders (1, 2, 3...)
   */
  async reorderDivisions(orderedIds: string[]): Promise<void> {
    const promises = orderedIds.map((id, index) => {
      const order = index + 1;
      return this.saveDivision(id, { order });
    });
    await Promise.all(promises);
    await this.getDivisions(true);
  },

  /**
   * Update a single division's order index
   */
  async updateDivisionOrder(id: DivisionId | string, order: number): Promise<void> {
    await this.saveDivision(id, { order });
    await this.getDivisions(true);
  },

  /**
   * Delete division
   */
  async deleteDivision(id: DivisionId | string): Promise<void> {
    await deleteDoc(doc(db, 'divisions', id));
    if (cachedDivisions) {
      cachedDivisions.data = cachedDivisions.data.filter((d) => d.id !== id);
    }
  },

  /**
   * Realtime subscription
   */
  subscribeToDivisions(callback: (divisions: FirestoreDivision[]) => void): Unsubscribe {
    const colRef = collection(db, 'divisions');
    return onSnapshot(
      colRef,
      (snap) => {
        if (!snap.empty) {
          const raw = snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id,
          })) as FirestoreDivision[];
          const data = sortDivisions(raw);
          cachedDivisions = { data, timestamp: Date.now() };
          callback(data);
        } else {
          const defaultDivs = cachedDivisions?.data?.length
            ? sortDivisions(cachedDivisions.data)
            : sortDivisions(getDefaultDivisions());
          callback(defaultDivs);
        }
      },
      (err) => {
        console.warn('[Firestore Divisions] subscribe error:', err);
        callback(
          cachedDivisions?.data?.length
            ? sortDivisions(cachedDivisions.data)
            : sortDivisions(getDefaultDivisions())
        );
      }
    );
  },

  /**
   * Alias for backwards compatibility
   */
  subscribeDivisions(callback: (divisions: FirestoreDivision[]) => void): Unsubscribe {
    return this.subscribeToDivisions(callback);
  },
};
