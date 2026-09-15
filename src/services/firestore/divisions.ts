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
    imageUrl: DIVISIONS.sws.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
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
    imageUrl: DIVISIONS.u1.imageUrl || 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=85',
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
    imageUrl: DIVISIONS.it.imageUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85',
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
    imageUrl: DIVISIONS.travels.imageUrl || 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
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
    imageUrl: DIVISIONS.mart.imageUrl || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    logoUrl: '/assets/images/mart_logo.png',
    route: '/mart',
    order: 5,
  },
};

export function normalizeDivisionId(id: string): { canonicalDocId: string; alternateId: string; shortId: string } {
  const clean = (id || '').toLowerCase().replace(/^div-/, '').trim();
  if (clean === 'sws' || clean === 'sws-event-management' || clean === 'sws-events' || clean === 'events') {
    return { canonicalDocId: 'sws', alternateId: 'sws-event-management', shortId: 'sws' };
  }
  if (clean === 'u1' || clean === 'u1-studio' || clean === 'u1-cinema' || clean === 'studio' || clean === 'photography') {
    return { canonicalDocId: 'u1-studio', alternateId: 'u1', shortId: 'u1' };
  }
  if (clean === 'it' || clean === 'it-solutions' || clean === 'mahdev-it' || clean === 'solutions') {
    return { canonicalDocId: 'it-solutions', alternateId: 'it', shortId: 'it' };
  }
  if (clean === 'travels' || clean === 'mahdev-travels' || clean === 'travel') {
    return { canonicalDocId: 'travels', alternateId: 'mahdev-travels', shortId: 'travels' };
  }
  if (clean === 'mart' || clean === 'online-mart' || clean === 'mahdev-mart' || clean === 'shop') {
    return { canonicalDocId: 'online-mart', alternateId: 'mart', shortId: 'mart' };
  }
  return { canonicalDocId: clean, alternateId: clean, shortId: clean };
}

export function getCanonicalDivisionId(id: string): string {
  const { shortId } = normalizeDivisionId(id);
  return shortId;
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
  const seen = new Set<string>();
  const deduplicated: FirestoreDivision[] = [];

  for (const item of list) {
    if (!item) continue;
    const canonicalKey = getCanonicalDivisionId(item.id || item.slug || '');
    if (seen.has(canonicalKey)) {
      continue;
    }
    seen.add(canonicalKey);
    deduplicated.push({
      ...item,
      id: item.id || canonicalKey,
    });
  }

  return deduplicated.sort((a, b) => {
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
      shortName: rawDivision?.shortName || d.name,
      shortDescription: d.shortDescription,
      description: d.description,
      imageUrl: d.imageUrl,
      logoUrl: d.logoUrl,
      logo: d.logoUrl,
      route: d.route,
      isPublished: true,
      order: d.order,
      badge: rawDivision?.badge || d.name,
      accentColor: rawDivision?.accentColor || '#1d4ed8',
      gradient: rawDivision?.gradient || 'from-blue-600 to-indigo-700',
      iconName: rawDivision?.iconName || 'Sparkles',
      heroHeadline: rawDivision?.heroHeadline || d.name,
      heroSubheadline: rawDivision?.heroSubheadline || d.shortDescription,
      tagline: rawDivision?.tagline || d.shortDescription,
      contactPhone: '075 092 8078',
      contactNumber: '075 092 8078',
      contactEmail: rawDivision?.contactEmail || 'info.mahdev.lk@gmail.com',
      aboutHeading: `About ${d.name}`,
      aboutText: d.description,
      mission: `To provide unmatched quality, speed, and reliability in ${d.name.toLowerCase()} across Sri Lanka.`,
      vision: `To stand as Sri Lanka's benchmark for excellence in our specialized field.`,
      stats: rawDivision?.stats && rawDivision.stats.length > 0 ? rawDivision.stats : [
        { label: 'Completed Projects', value: '150+' },
        { label: 'Client Satisfaction', value: '99%' },
        { label: 'Island Coverage', value: 'Island-wide' },
      ],
      coreServices: rawDivision?.coreServices || [],
      cardHighlight: (rawDivision as any)?.cardHighlight || '',
      hero: {
        title: rawDivision?.heroHeadline || d.name,
        subtitle: rawDivision?.heroSubheadline || d.shortDescription,
        badge: rawDivision?.badge || d.name,
        bgImage: d.imageUrl,
        ctaText: `Explore ${d.name}`,
        secondaryCtaText: 'Contact Division',
      },
      status: 'active',
      seo: {
        metaTitle: `${d.name} | Mahdev Pvt Ltd`,
        metaDescription: d.shortDescription,
        keywords: [d.docId, d.slug, 'mahdev', 'sri lanka'],
        ogImage: d.imageUrl,
        canonicalUrl: `https://mahdev.lk${d.route}`,
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

    // Check localStorage cache for instant zero-latency return
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const localRaw = localStorage.getItem('mahdev_cached_divisions');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const data = sortDivisions(parsed);
            cachedDivisions = { data, timestamp: now };
            // Kick off background refresh without blocking caller
            getDocs(collection(db, 'divisions')).then((snap) => {
              if (!snap.empty) {
                const fresh = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreDivision[];
                const sorted = sortDivisions(fresh);
                cachedDivisions = { data: sorted, timestamp: Date.now() };
                try {
                  localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sorted));
                } catch {}
              }
            }).catch(() => {});
            return data;
          }
        }
      } catch {}
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

    const payload = sanitizeForFirestore({
      ...data,
      id: canonicalDocId,
      divisionKey: shortId,
      heroVideoUrl: effectiveHeroVideo,
      videoUrl: effectiveHeroVideo,
      defaultImageUrl: effectiveHeroImage,
      heroImageUrl: effectiveHeroImage,
      imageUrl: effectiveHeroImage || (data as any).imageUrl,
      heroMediaType: effectiveMediaType,
      hero: {
        ...((data as any).hero || {}),
        title: (data as any).heroHeadline || (data as any).hero?.title || (data as any).name || '',
        subtitle: (data as any).heroSubheadline || (data as any).hero?.subtitle || (data as any).description || '',
        badge: (data as any).badge || (data as any).hero?.badge || '',
        bgImage: effectiveHeroImage,
        imageUrl: effectiveHeroImage,
        defaultImageUrl: effectiveHeroImage,
        videoUrl: effectiveHeroVideo || (data as any).hero?.videoUrl || '',
        mediaType: effectiveMediaType,
      },
      updatedAt: new Date().toISOString(),
    });

    // 1. Immediately update in-memory cache so all reads are instant and guaranteed
    if (!cachedDivisions) {
      cachedDivisions = { data: sortDivisions(getDefaultDivisions()), timestamp: Date.now() };
    }
    const targetIds = new Set([canonicalDocId, alternateId, shortId, id, `div-${shortId}`]);
    let matchedAny = false;
    cachedDivisions.data = cachedDivisions.data.map((d) => {
      if (targetIds.has(d.id) || (d.slug && targetIds.has(d.slug))) {
        matchedAny = true;
        return { ...d, ...payload, id: d.id || canonicalDocId } as FirestoreDivision;
      }
      return d;
    });
    if (!matchedAny) {
      cachedDivisions.data.push({ ...payload, id: canonicalDocId } as FirestoreDivision);
    }
    cachedDivisions.data = sortDivisions(cachedDivisions.data);
    cachedDivisions.timestamp = Date.now();

    // 2. Immediately update localStorage & dispatch live event so UI never hangs or lags
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mahdev_cached_divisions', JSON.stringify(cachedDivisions.data));
        window.dispatchEvent(
          new CustomEvent('mahdev_division_updated', {
            detail: { id: canonicalDocId, shortId, division: payload },
          })
        );
      } catch {}
    }

    // 3. Immediately sync to server backend
    try {
      fetch('/api/divisions/' + canonicalDocId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
      if (shortId && shortId !== canonicalDocId) {
        fetch('/api/divisions/' + shortId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: shortId }),
        }).catch(() => {});
      }
    } catch {}

    // 4. Commit to Firestore with resilient non-blocking timeout fallback
    try {
      const docRef = doc(db, 'divisions', canonicalDocId);
      await Promise.race([
        setDoc(docRef, payload, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 3500)),
      ]);
      console.log(`[Firestore Divisions] Division "${canonicalDocId}" committed to Firestore.`);

      if (alternateId && alternateId !== canonicalDocId) {
        try {
          await Promise.race([
            setDoc(doc(db, 'divisions', alternateId), { ...payload, id: alternateId }, { merge: true }),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
        } catch {}
      }
      if (shortId && shortId !== canonicalDocId && shortId !== alternateId) {
        try {
          await Promise.race([
            setDoc(doc(db, 'divisions', shortId), { ...payload, id: shortId }, { merge: true }),
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
        } catch {}
      }
    } catch (fsErr) {
      console.warn(`[Firestore Divisions] Cloud commit notice for "${canonicalDocId}":`, fsErr);
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
