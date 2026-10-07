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
} from '../../lib/tursoFirestore';
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
    imageUrl: '',
    logoUrl: '/assets/images/sws_logo.svg',
    route: '/sws',
    order: 1,
  },
  'u1-studio': {
    docId: 'u1',
    name: 'U1 Studio',
    slug: 'u1',
    shortDescription: 'State-of-the-art photography, 8K cinematic films, wedding photojournalism, and studio fashion productions.',
    description: DIVISIONS.u1.description,
    imageUrl: '',
    logoUrl: '/assets/images/u1_logo.svg',
    route: '/u1',
    order: 2,
  },
  'it-solutions': {
    docId: 'it',
    name: 'Mahdev IT Solutions',
    slug: 'it',
    shortDescription: 'Enterprise software engineering, modern cloud architecture, scalable web/mobile platforms, and cybersecurity.',
    description: DIVISIONS.it.description,
    imageUrl: '',
    logoUrl: '/assets/images/it_logo.svg',
    route: '/it',
    order: 3,
  },
  travels: {
    docId: 'travels',
    name: 'Mahdev Travels',
    slug: 'travels',
    shortDescription: 'Bespoke travel curation, VIP corporate retreats, luxury island expeditions, and chauffeur services.',
    description: DIVISIONS.travels.description,
    imageUrl: '',
    logoUrl: '/assets/images/travels_logo.svg',
    route: '/travels',
    order: 4,
  },
  'online-mart': {
    docId: 'mart',
    name: 'Mahdev Online Mart',
    slug: 'mart',
    shortDescription: 'Curated e-commerce storefront delivering verified camera gear, audio hardware, and computing essentials.',
    description: DIVISIONS.mart.description,
    imageUrl: '',
    logoUrl: '/assets/images/mart_logo.svg',
    route: '/mart',
    order: 5,
  },
};

export function normalizeDivisionId(id: string): { canonicalDocId: string; alternateId: string; shortId: string } {
  const clean = (id || '').toLowerCase().replace(/^div-/, '').trim();
  if (clean === 'sws' || clean === 'sws-event-management' || clean === 'sws-events' || clean === 'events') {
    return { canonicalDocId: 'sws', alternateId: 'sws', shortId: 'sws' };
  }
  if (clean === 'u1' || clean === 'u1-studio' || clean === 'u1-cinema' || clean === 'studio' || clean === 'photography') {
    return { canonicalDocId: 'u1', alternateId: 'u1', shortId: 'u1' };
  }
  if (clean === 'it' || clean === 'it-solutions' || clean === 'mahdev-it' || clean === 'solutions') {
    return { canonicalDocId: 'it', alternateId: 'it', shortId: 'it' };
  }
  if (clean === 'travels' || clean === 'mahdev-travels' || clean === 'travel') {
    return { canonicalDocId: 'travels', alternateId: 'travels', shortId: 'travels' };
  }
  if (clean === 'mart' || clean === 'online-mart' || clean === 'mahdev-mart' || clean === 'shop') {
    return { canonicalDocId: 'mart', alternateId: 'mart', shortId: 'mart' };
  }
  return { canonicalDocId: clean, alternateId: clean, shortId: clean };
}

export function getCanonicalDivisionId(id: string): string {
  const { shortId } = normalizeDivisionId(id);
  return shortId;
}

/**
 * Check if two division IDs represent the exact same division
 * e.g., matches 'sws' and 'sws-event-management' and 'div-sws'
 */
export function isSameDivision(divA?: string, divB?: string): boolean {
  if (!divA || !divB) return false;
  const a = normalizeDivisionId(divA).shortId;
  const b = normalizeDivisionId(divB).shortId;
  return Boolean(a && b && a === b);
}

export function getDivisionFallbackOrder(id: string): number {
  const canonical = getCanonicalDivisionId(id);
  if (canonical === 'sws') return 1;
  if (canonical === 'u1') return 2;
  if (canonical === 'it') return 3;
  if (canonical === 'travels') return 4;
  if (canonical === 'mart') return 5;
  return 99;
}

export function sortDivisions(list: FirestoreDivision[]): FirestoreDivision[] {
  const mapByCanonical = new Map<string, FirestoreDivision>();
  for (const item of (Array.isArray(list) ? list : [])) {
    if (!item) continue;
    const { canonicalDocId, shortId } = normalizeDivisionId(item.id || item.slug || '');
    if (!shortId) continue;
    const normalized: FirestoreDivision = {
      ...item,
      id: shortId,
      slug: item.slug || shortId,
      canonicalDocId,
      divisionKey: item.divisionKey || shortId,
    };
    const existing = mapByCanonical.get(shortId);
    if (!existing || new Date(normalized.updatedAt || 0) >= new Date(existing.updatedAt || 0)) {
      mapByCanonical.set(shortId, normalized);
    }
  }

  return Array.from(mapByCanonical.values()).sort(
    (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
  );
}

export function getDefaultDivisions(): FirestoreDivision[] {
  return Object.values(DIVISION_DOCUMENT_MAP).map((d) => {
    const shortKey = (d.docId === 'u1-studio' ? 'u1' : d.docId === 'it-solutions' ? 'it' : d.docId === 'online-mart' ? 'mart' : d.docId) as DivisionId;
    const isComingSoonDefault = shortKey === 'it' || shortKey === 'travels' || shortKey === 'mart';
    const config = DIVISIONS[shortKey] || {};

    const item: FirestoreDivision = {
      id: shortKey,
      name: d.name,
      slug: shortKey,
      shortName: (config as any).shortName || d.name,
      shortDescription: d.shortDescription || config.description || '',
      description: d.description || config.description || '',
      imageUrl: d.imageUrl,
      heroImageUrl: d.imageUrl,
      defaultImageUrl: d.imageUrl,
      logoUrl: d.logoUrl,
      logo: d.logoUrl,
      route: d.route,
      isPublished: true,
      order: d.order,
      badge: (config as any).badge || d.name,
      accentColor: (config as any).accentColor || '#1d4ed8',
      gradient: (config as any).gradient || 'from-blue-600 to-indigo-700',
      iconName: (config as any).iconName || 'Sparkles',
      heroHeadline: (config as any).heroHeadline || d.name,
      heroSubheadline: (config as any).heroSubheadline || d.shortDescription,
      tagline: (config as any).tagline || d.shortDescription,
      contactPhone: '075 092 8078',
      contactNumber: '075 092 8078',
      contactEmail: 'info.mahdev.lk@gmail.com',
      aboutHeading: (config as any).aboutHeading || '',
      aboutText: (config as any).aboutText || d.description,
      mission: (config as any).mission || '',
      vision: (config as any).vision || '',
      stats: (config as any).stats || [],
      coreServices: (config as any).coreServices || [],
      cardHighlight: '',
      hero: {
        title: (config as any).heroHeadline || d.name,
        subtitle: (config as any).heroSubheadline || d.shortDescription,
        badge: (config as any).badge || d.name,
        bgImage: d.imageUrl,
        imageUrl: d.imageUrl,
        defaultImageUrl: d.imageUrl,
        ctaText: `Explore ${d.name}`,
        secondaryCtaText: 'Contact Division',
      },
      status: isComingSoonDefault ? 'coming_soon' : 'active',
      isComingSoon: isComingSoonDefault,
      comingSoon: isComingSoonDefault,
      seo: {
        metaTitle: `${d.name} | Mahdev Pvt Ltd`,
        metaDescription: d.shortDescription || d.description,
        keywords: [shortKey, d.docId, d.slug, 'mahdev', 'sri lanka'],
        ogImage: d.imageUrl,
        canonicalUrl: `https://mahdev.lk${d.route}`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return item;
  });
}

/**
 * Ensures all 5 canonical divisions exist in Firestore
 */
export async function ensureAllCanonicalDivisionsInFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'divisions'));
    const existingShortIds = new Set<string>();
    snap.docs.forEach((docSnap) => {
      const { shortId } = normalizeDivisionId(docSnap.id);
      if (shortId) existingShortIds.add(shortId);
    });

    const defaults = getDefaultDivisions();
    for (const def of defaults) {
      const { canonicalDocId, shortId } = normalizeDivisionId(def.id);
      if (!existingShortIds.has(shortId)) {
        console.log(`[Firestore Divisions] Auto-seeding missing canonical division: ${canonicalDocId}`);
        const docRef = doc(db, 'divisions', canonicalDocId);
        await setDoc(docRef, sanitizeForFirestore({ ...def, id: canonicalDocId }), { merge: true });
      }
    }
  } catch (err) {
    console.warn('[Firestore Divisions] Auto-seeding check notice:', err);
  }
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

    // Use only records previously fetched from the database as an instant cache.
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const localRaw = sessionStorage.getItem('mahdev_cached_divisions');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            const data = sortDivisions(parsed);
            cachedDivisions = { data, timestamp: now };
            getDocs(collection(db, 'divisions')).then((snap) => {
              const fresh = !snap.empty
                ? (snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreDivision[])
                : [];
              const sorted = sortDivisions(fresh);
              cachedDivisions = { data: sorted, timestamp: Date.now() };
              try {
                sessionStorage.setItem('mahdev_cached_divisions', JSON.stringify(sorted));
              } catch (error) {
                console.warn('[Firestore Divisions] Could not refresh session cache:', error);
              }
            }).catch((error) => {
              console.error('[Firestore Divisions] Background refresh failed:', error);
            });
            return data;
          }
        }
      } catch (error) {
        console.warn('[Firestore Divisions] Session cache could not be read:', error);
      }
    }

    try {
      const snap = await getDocs(collection(db, 'divisions'));
      const raw = !snap.empty
        ? (snap.docs.map((docSnap) => ({
            ...docSnap.data(),
            id: docSnap.id,
          })) as FirestoreDivision[])
        : [];
      const data = sortDivisions(raw);
      cachedDivisions = { data, timestamp: now };
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('mahdev_cached_divisions', JSON.stringify(data));
        } catch (error) {
          console.warn('[Firestore Divisions] Could not cache database records for this session:', error);
        }
      }
      return data;
    } catch (err) {
      console.warn('[Firestore Divisions] getDivisions error:', err);
      if (cachedDivisions) return cachedDivisions.data;
      throw err;
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
    const { canonicalDocId, alternateId, shortId } = normalizeDivisionId(id as string);

    const effectiveHeroVideo =
      (data as any).heroVideoUrl ||
      (data as any).videoUrl ||
      data.hero?.videoUrl ||
      '';

    const effectiveHeroImage =
      (data as any).defaultImageUrl ||
      (data as any).heroImageUrl ||
      (data as any).imageUrl ||
      data.hero?.defaultImageUrl ||
      data.hero?.imageUrl ||
      data.hero?.bgImage ||
      '';

    const effectiveMediaType =
      (data as any).heroMediaType ||
      data.hero?.mediaType ||
      (effectiveHeroVideo ? 'video' : 'image');

    const effectiveLogo =
      (data as any).logoUrl ||
      (data as any).logo ||
      '';

    const payload = sanitizeForFirestore({
      ...data,
      id: canonicalDocId,
      divisionKey: shortId,
      heroVideoUrl: effectiveHeroVideo,
      videoUrl: effectiveHeroVideo,
      defaultImageUrl: effectiveHeroImage,
      heroImageUrl: effectiveHeroImage,
      fallbackImageUrl: effectiveHeroImage,
      imageUrl: effectiveHeroImage || (data as any).imageUrl,
      heroMediaType: effectiveMediaType,
      logoUrl: effectiveLogo,
      logo: effectiveLogo,
      hero: {
        ...((data as any).hero || {}),
        title: (data as any).heroHeadline || (data as any).hero?.title || (data as any).name || '',
        subtitle: (data as any).heroSubheadline || (data as any).hero?.subtitle || (data as any).description || '',
        badge: (data as any).badge || (data as any).hero?.badge || '',
        bgImage: effectiveHeroImage,
        imageUrl: effectiveHeroImage,
        defaultImageUrl: effectiveHeroImage,
        fallbackImageUrl: effectiveHeroImage,
        videoUrl: effectiveHeroVideo || (data as any).hero?.videoUrl || '',
        mediaType: effectiveMediaType,
      },
      updatedAt: new Date().toISOString(),
    });

    try {
      const docRef = doc(db, 'divisions', canonicalDocId);
      await setDoc(docRef, payload, { merge: true });
    } catch (fsErr) {
      console.error(`[Turso Divisions] Could not save "${canonicalDocId}":`, fsErr);
      throw fsErr;
    }

    const current = cachedDivisions?.data || [];
    const next = sortDivisions([
      ...current.filter((division) => normalizeDivisionId(division.id || division.slug || '').shortId !== shortId),
      { ...payload, id: canonicalDocId } as FirestoreDivision,
    ]);
    cachedDivisions = { data: next, timestamp: Date.now() };
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('mahdev_cached_divisions', JSON.stringify(next));
      } catch (error) {
        console.warn('[Firestore Divisions] Could not update session cache:', error);
      }
      window.dispatchEvent(
        new CustomEvent('mahdev_division_updated', {
          detail: { id: canonicalDocId, shortId, division: payload },
        })
      );
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
      cachedDivisions.timestamp = Date.now();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('mahdev_cached_divisions', JSON.stringify(cachedDivisions.data));
        } catch (error) {
          console.warn('[Firestore Divisions] Could not update session cache after delete:', error);
        }
      }
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
        const raw = !snap.empty
          ? (snap.docs.map((docSnap) => ({
              ...docSnap.data(),
              id: docSnap.id,
            })) as FirestoreDivision[])
          : [];
        const data = sortDivisions(raw);
        cachedDivisions = { data, timestamp: Date.now() };
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('mahdev_cached_divisions', JSON.stringify(data));
          } catch (error) {
            console.warn('[Firestore Divisions] Could not cache subscription data:', error);
          }
        }
        callback(data);
      },
      (err) => {
        console.warn('[Firestore Divisions] subscribe error:', err);
        if (cachedDivisions) callback(cachedDivisions.data);
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
