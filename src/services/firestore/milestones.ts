/**
 * Turso milestones repository.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from '../../lib/tursoFirestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreMilestone } from '../../types/firestore';

// Official verified 8-card trajectory (2021-2027+)
export const DEFAULT_OFFICIAL_MILESTONES: FirestoreMilestone[] = [
  {
    id: 'ms-2021',
    year: '2021',
    title: 'Founding Vision',
    subtitle: 'Strategic Inception',
    description: 'Conceived the multi-division vision for bespoke event architecture, creative technology, and islandwide execution.',
    badge: 'Inception',
    keyOutcome: 'Blueprint established for unified corporate services and creative disciplines.',
    order: 1,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2022',
    year: '2022',
    title: 'SWS Event Management',
    subtitle: 'Creative Production',
    description: 'Launched SWS Event Management, establishing our foundation in creative event staging, mandap design, and spatial production.',
    badge: 'Foundation',
    keyOutcome: 'Core event management and spatial production operations established.',
    order: 2,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2023',
    year: '2023',
    title: 'U1 Studio Cinema & Media',
    subtitle: 'Photography & Film',
    description: 'Launched U1 Studio, expanding into professional 8K cinema, wedding photojournalism, visual storytelling, and commercial studio media.',
    badge: 'Media & Film',
    keyOutcome: 'Cinema 8K production suites, drone aerials, and wedding photojournalism.',
    order: 3,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2024',
    year: '2024',
    title: 'Islandwide Reach & 500+ Projects',
    subtitle: 'All 9 Provinces',
    description: 'Expanded delivery infrastructure nationwide to serve commercial and private clients across all 9 provinces in Sri Lanka.',
    badge: 'National Scale',
    keyOutcome: 'Operational capacity scaled nationwide with 500+ delivered grand events.',
    order: 4,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2025',
    year: '2025',
    title: 'IT & Solutions Division',
    subtitle: 'Digital Transformation',
    description: 'Introduced IT & Solutions, expanding into custom enterprise software engineering, responsive web platforms, cloud systems, and cybersecurity.',
    badge: 'Tech Innovation',
    keyOutcome: 'Enterprise SaaS, modern web platforms, cloud architecture, and cybersecurity.',
    order: 5,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2026',
    year: '2026',
    title: 'Mahdev Pvt Ltd Incorporation',
    subtitle: 'Company Registration',
    description: 'Officially registered Mahdev Pvt Ltd, unifying all specialized divisions under established private enterprise governance.',
    badge: 'Registered Entity',
    keyOutcome: 'Unified business divisions under registered corporate governance in Colombo & Trincomalee.',
    order: 6,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2026-travels',
    year: '2026',
    title: 'Mahdev Travels & Smart Mart',
    subtitle: 'Tourism & E-Commerce',
    description: 'Launched Mahdev Travels for bespoke island tours and corporate mobility, alongside Mahdev Online Mart curated marketplace.',
    badge: 'Commercial Scale',
    keyOutcome: 'VIP fleet logistics, curated tour itineraries, and smart commercial catalog.',
    order: 7,
    isPublished: true,
    status: 'published',
  },
  {
    id: 'ms-2027',
    year: '2027+',
    title: 'Global Horizons & Scaled AI',
    subtitle: 'International Reach',
    description: 'Expanding regional capabilities, cross-border digital deployments, and next-generation automated client workflows.',
    badge: 'Future Vision',
    keyOutcome: 'South Asian expansion, high-performance automated solutions, and 2,500+ clients.',
    order: 8,
    isPublished: true,
    status: 'published',
  },
];

const CACHE_TTL_MS = 1000 * 60 * 30;
const MILESTONES_POLL_INTERVAL_MS = 3000;
let cachedMilestones: { data: FirestoreMilestone[]; timestamp: number } | null = (() => {
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('mahdev_cached_milestones');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { data: parsed, timestamp: Date.now() };
        }
      }
    }
  } catch {}
  return null;
})();
let inFlightMilestonesPromise: Promise<FirestoreMilestone[]> | null = null;
let milestonesCacheGeneration = 0;

const invalidateMilestonesCache = () => {
  milestonesCacheGeneration += 1;
  cachedMilestones = null;
  inFlightMilestonesPromise = null;
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mahdev_cached_milestones');
    }
  } catch {}
};

export const firestoreMilestonesService = {
  /**
   * Fetch milestones from Turso, returning a fresh cached result when available.
   */
  async getMilestones(forceRefresh = false): Promise<FirestoreMilestone[]> {
    const now = Date.now();
    // Return cached immediately if fresh
    if (!forceRefresh && cachedMilestones && now - cachedMilestones.timestamp < CACHE_TTL_MS) {
      return cachedMilestones.data;
    }

    if (inFlightMilestonesPromise && !forceRefresh) {
      return inFlightMilestonesPromise;
    }

    const requestGeneration = milestonesCacheGeneration;
    let requestPromise: Promise<FirestoreMilestone[]>;
    requestPromise = (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'milestones'),
          orderBy('order', 'asc'),
          limit(500)
        ));

        if (!snap.empty) {
          const data = snap.docs.map((d) => {
            const item = d.data();
            return {
              ...item,
              id: d.id,
              order: typeof item.order === 'number' ? item.order : 0,
              isPublished: item.isPublished !== undefined ? item.isPublished : item.status !== 'draft' && item.status !== 'archived',
            } as FirestoreMilestone;
          });

          data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (Number(a.year) || 0) - (Number(b.year) || 0));
          if (requestGeneration === milestonesCacheGeneration) {
            cachedMilestones = { data, timestamp: Date.now() };
            try {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('mahdev_cached_milestones', JSON.stringify(data));
              }
            } catch {}
          }
          return data;
        }

        if (requestGeneration === milestonesCacheGeneration) {
          cachedMilestones = { data: [], timestamp: Date.now() };
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('mahdev_cached_milestones', JSON.stringify([]));
            }
          } catch {}
        }
        return [];
      } catch (err) {
        console.error('[Turso Milestones] Could not load milestones:', err);
        throw err;
      } finally {
        if (inFlightMilestonesPromise === requestPromise) {
          inFlightMilestonesPromise = null;
        }
      }
    })();
    inFlightMilestonesPromise = requestPromise;

    // If we already have cached data, return it immediately while fetching in background
    if (cachedMilestones && cachedMilestones.data.length > 0 && !forceRefresh) {
      return cachedMilestones.data;
    }

    return requestPromise;
  },

  /**
   * Create a new milestone in Turso.
   */
  async createMilestone(data: Omit<FirestoreMilestone, 'id'> & { id?: string }): Promise<string> {
    const id = data.id || `ms-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const payload: FirestoreMilestone = sanitizeForFirestore({
      ...data,
      id,
      order: typeof data.order === 'number' ? data.order : 1,
      isPublished: data.isPublished ?? true,
      status: data.status || (data.isPublished === false ? 'draft' : 'published'),
      createdAt: data.createdAt || now,
      updatedAt: now,
    });

    const docRef = doc(db, 'milestones', id);
    await setDoc(docRef, payload);
    invalidateMilestonesCache();
    return id;
  },

  /**
   * Save or update an existing milestone in Turso.
   */
  async saveMilestone(id: string, data: Partial<FirestoreMilestone>): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      ...data,
      id,
      updatedAt: now,
    });

    await setDoc(docRef, payload, { merge: true });
    invalidateMilestonesCache();
  },

  /**
   * Delete a milestone permanently from Turso.
   */
  async deleteMilestone(id: string): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    await deleteDoc(docRef);
    invalidateMilestonesCache();
  },

  /**
   * Toggle published state for a milestone
   */
  async togglePublish(id: string, isPublished: boolean): Promise<void> {
    const docRef = doc(db, 'milestones', id);
    const now = new Date().toISOString();
    const payload = sanitizeForFirestore({
      isPublished,
      status: isPublished ? ('published' as const) : ('draft' as const),
      updatedAt: now,
    });

    await setDoc(docRef, payload, { merge: true });
    invalidateMilestonesCache();
  },

  /**
   * Batch update milestone order
   */
  async reorderMilestones(orderedIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    orderedIds.forEach((id, index) => {
      const docRef = doc(db, 'milestones', id);
      batch.update(docRef, { order: index + 1, updatedAt: now });
    });

    await batch.commit();
    invalidateMilestonesCache();
  },

  /**
   * Poll the Turso collection for changes.
   */
  subscribeMilestones(
    onData: (data: FirestoreMilestone[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      query(collection(db, 'milestones'), orderBy('order', 'asc'), limit(500)),
      (snap) => {
        const data = snap.docs.map((d) => {
          const item = d.data();
          return {
            ...item,
            id: d.id,
            order: typeof item.order === 'number' ? item.order : 0,
            isPublished: item.isPublished !== undefined ? item.isPublished : item.status !== 'draft' && item.status !== 'archived',
          } as FirestoreMilestone;
        });

        data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        cachedMilestones = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.error('[Turso Milestones] Subscription failed:', err);
        if (onError) {
          onError(err);
        }
      },
      MILESTONES_POLL_INTERVAL_MS
    );
  },
};
