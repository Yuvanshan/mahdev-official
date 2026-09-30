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
  const canonicalOrder = ['sws', 'u1', 'it', 'travels', 'mart'];
  const mapByCanonical = new Map<string, FirestoreDivision>();

  // 1. ALWAYS seed with all 5 foundational canonical divisions as the baseline!
  // This guarantees that all 5 divisions are ALWAYS present across the website and admin portal.
  const defaults = getDefaultDivisions();
  for (const def of defaults) {
    const { shortId, canonicalDocId } = normalizeDivisionId(def.id || def.slug || '');
    if (shortId) {
      mapByCanonical.set(shortId, {
        ...def,
        id: shortId,
        slug: shortId,
        canonicalDocId,
      });
    }
  }

  // 2. Overlay incoming items from Firestore / admin updates
  for (const item of (Array.isArray(list) ? list : [])) {
    if (!item) continue;
    const { canonicalDocId, shortId } = normalizeDivisionId(item.id || item.slug || '');
    if (!shortId) continue;

    const isDefaultComingSoon = shortId === 'it' || shortId === 'travels' || shortId === 'mart';
    const isComingSoon = (item as any).isComingSoon !== undefined
      ? !!(item as any).isComingSoon
      : (item as any).comingSoon !== undefined
      ? !!(item as any).comingSoon
      : item.status !== undefined
      ? item.status === 'coming_soon'
      : isDefaultComingSoon;

    const existing = mapByCanonical.get(shortId);
    const normalizedItem: FirestoreDivision = {
      ...(existing || {}),
      ...item,
      id: shortId,
      slug: shortId,
      canonicalDocId,
      isComingSoon,
      comingSoon: isComingSoon,
      status: isComingSoon ? 'coming_soon' : (item.status || 'active'),
    } as any;

    if (!existing) {
      mapByCanonical.set(shortId, normalizedItem);
    } else {
      // Pick the document with newer updatedAt as primary, but merge all defined fields
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      const itemTime = new Date(normalizedItem.updatedAt || 0).getTime();
      const primary = itemTime >= existingTime ? normalizedItem : existing;
      const secondary = itemTime >= existingTime ? existing : normalizedItem;

      const resolvedLogo = primary.logoUrl || secondary.logoUrl || (primary as any).logo || (secondary as any).logo || existing.logoUrl || (existing as any).logo || '';
      const resolvedImg =
        (primary as any).defaultImageUrl ||
        (secondary as any).defaultImageUrl ||
        (primary as any).fallbackImageUrl ||
        (secondary as any).fallbackImageUrl ||
        primary.hero?.imageUrl ||
        secondary.hero?.imageUrl ||
        primary.hero?.defaultImageUrl ||
        secondary.hero?.defaultImageUrl ||
        primary.heroImageUrl ||
        secondary.heroImageUrl ||
        primary.imageUrl ||
        secondary.imageUrl ||
        primary.hero?.bgImage ||
        secondary.hero?.bgImage ||
        existing.imageUrl ||
        '';

      const mergedHero = {
        ...(secondary.hero || {}),
        ...(primary.hero || {}),
        title: primary.hero?.title || secondary.hero?.title || primary.heroHeadline || secondary.heroHeadline || primary.name,
        subtitle: primary.hero?.subtitle || secondary.hero?.subtitle || primary.heroSubheadline || secondary.heroSubheadline || primary.shortDescription || secondary.shortDescription,
        badge: primary.hero?.badge || secondary.hero?.badge || primary.badge || secondary.badge,
        videoUrl: primary.hero?.videoUrl || secondary.hero?.videoUrl || (primary as any).heroVideoUrl || (secondary as any).heroVideoUrl || (primary as any).videoUrl || (secondary as any).videoUrl,
        imageUrl: resolvedImg,
        bgImage: primary.hero?.bgImage || secondary.hero?.bgImage || resolvedImg,
      };

      mapByCanonical.set(shortId, {
        ...secondary,
        ...primary,
        id: shortId,
        slug: shortId,
        canonicalDocId,
        name: primary.name || secondary.name || existing.name,
        shortName: primary.shortName || secondary.shortName || existing.shortName,
        heroHeadline: primary.heroHeadline || secondary.heroHeadline || mergedHero.title,
        heroSubheadline: primary.heroSubheadline || secondary.heroSubheadline || mergedHero.subtitle,
        shortDescription: primary.shortDescription || secondary.shortDescription || existing.shortDescription,
        description: primary.description || secondary.description || existing.description,
        badge: primary.badge || secondary.badge || existing.badge,
        imageUrl: resolvedImg,
        heroImageUrl: resolvedImg,
        defaultImageUrl: resolvedImg,
        fallbackImageUrl: resolvedImg,
        videoUrl: primary.videoUrl || secondary.videoUrl || mergedHero.videoUrl,
        heroVideoUrl: primary.heroVideoUrl || secondary.heroVideoUrl || mergedHero.videoUrl,
        logoUrl: resolvedLogo,
        logo: resolvedLogo,
        hero: {
          ...mergedHero,
          imageUrl: resolvedImg,
          defaultImageUrl: resolvedImg,
          bgImage: resolvedImg,
        },
        status: primary.status || secondary.status,
        isComingSoon: primary.isComingSoon !== undefined ? primary.isComingSoon : secondary.isComingSoon,
        comingSoon: primary.comingSoon !== undefined ? primary.comingSoon : secondary.comingSoon,
      });
    }
  }

  // Preserve canonical baseline divisions AND any newly created custom divisions!
  const allDivisions: FirestoreDivision[] = [];
  const handled = new Set<string>();

  for (const key of canonicalOrder) {
    const div = mapByCanonical.get(key);
    if (div) {
      allDivisions.push(div);
      handled.add(key);
    }
  }

  for (const [key, div] of mapByCanonical.entries()) {
    if (!handled.has(key)) {
      allDivisions.push(div);
    }
  }

  return allDivisions.sort((a, b) => {
    const orderA = typeof a.order === 'number' && a.order > 0 ? a.order : getDivisionFallbackOrder(a.id);
    const orderB = typeof b.order === 'number' && b.order > 0 ? b.order : getDivisionFallbackOrder(b.id);
    return orderA - orderB;
  });
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
      if (cachedDivisions.data && cachedDivisions.data.length >= 5) {
        return cachedDivisions.data;
      }
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
              const fresh = !snap.empty
                ? (snap.docs.map((d) => ({ ...d.data(), id: d.id })) as FirestoreDivision[])
                : [];
              const sorted = sortDivisions(fresh);
              cachedDivisions = { data: sorted, timestamp: Date.now() };
              try {
                localStorage.setItem('mahdev_cached_divisions', JSON.stringify(sorted));
              } catch {}
              if (fresh.length < 5) {
                ensureAllCanonicalDivisionsInFirestore().catch(() => {});
              }
            }).catch(() => {});
            return data;
          }
        }
      } catch {}
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
          localStorage.setItem('mahdev_cached_divisions', JSON.stringify(data));
        } catch {}
      }
      if (raw.length < 5) {
        ensureAllCanonicalDivisionsInFirestore().catch(() => {});
      }
      return data;
    } catch (err) {
      console.warn('[Firestore Divisions] getDivisions error:', err);
      const fallback = cachedDivisions?.data && cachedDivisions.data.length >= 5
        ? cachedDivisions.data
        : sortDivisions(getDefaultDivisions());
      return fallback;
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
            localStorage.setItem('mahdev_cached_divisions', JSON.stringify(data));
          } catch {}
        }
        if (raw.length < 5) {
          ensureAllCanonicalDivisionsInFirestore().catch(() => {});
        }
        callback(data);
      },
      (err) => {
        console.warn('[Firestore Divisions] subscribe error:', err);
        const fallback = cachedDivisions?.data && cachedDivisions.data.length >= 5
          ? cachedDivisions.data
          : sortDivisions(getDefaultDivisions());
        callback(fallback);
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
