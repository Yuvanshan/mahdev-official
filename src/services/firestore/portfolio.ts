/**
 * Firestore Portfolio Repository (Optimized - Phase 33)
 * Implements bounded queries, memory caching, query deduplication, and pagination.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FirestorePortfolio, DivisionId } from '../../types/firestore';
import { PORTFOLIO_PROJECTS_DATA } from '../../data/corporateData';

const CACHE_TTL_MS = 1000 * 60 * 30; // 30-minute memoized cache for static portfolio
let cachedPortfolio: { data: FirestorePortfolio[]; timestamp: number } | null = null;
let inFlightPortfolioPromise: Promise<FirestorePortfolio[]> | null = null;

export function getDefaultPortfolio(): FirestorePortfolio[] {
  return PORTFOLIO_PROJECTS_DATA.map((p) => ({
    id: p.id,
    division: (p.divisionId || 'sws') as DivisionId,
    title: p.title,
    client: p.client || 'Mahdev Enterprise Client',
    category: p.category || 'Production',
    description: p.fullDescription || p.summary || '',
    imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    featured: Boolean(p.highlights && p.highlights.length > 0),
    year: p.year ? String(p.year) : '2025',
    status: 'published',
  }));
}

export interface PortfolioQueryOptions {
  division?: DivisionId;
  featuredOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedPortfolioResult {
  items: FirestorePortfolio[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export const firestorePortfolioService = {
  /**
   * Fetch portfolio with memoization and in-flight request deduplication
   */
  async getPortfolio(division?: DivisionId, forceRefresh = false): Promise<FirestorePortfolio[]> {
    const now = Date.now();

    if (!forceRefresh && cachedPortfolio && now - cachedPortfolio.timestamp < CACHE_TTL_MS) {
      return division ? cachedPortfolio.data.filter((p) => p.division === division) : cachedPortfolio.data;
    }

    if (inFlightPortfolioPromise && !forceRefresh) {
      const all = await inFlightPortfolioPromise;
      return division ? all.filter((p) => p.division === division) : all;
    }

    inFlightPortfolioPromise = (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'portfolio'), firestoreLimit(100)));
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestorePortfolio[];
          cachedPortfolio = { data: loaded, timestamp: Date.now() };
          return loaded;
        } else {
          const defaults = getDefaultPortfolio();
          cachedPortfolio = { data: defaults, timestamp: Date.now() };
          // Background seed
          (async () => {
            for (const item of defaults) {
              await setDoc(doc(db, 'portfolio', item.id), item, { merge: true }).catch(() => {});
            }
          })();
          return defaults;
        }
      } catch (err) {
        console.warn('[Firestore Portfolio] Optimized fetch fallback:', err);
        const fallback = cachedPortfolio?.data || getDefaultPortfolio();
        cachedPortfolio = { data: fallback, timestamp: Date.now() };
        return fallback;
      } finally {
        inFlightPortfolioPromise = null;
      }
    })();

    const all = await inFlightPortfolioPromise;
    return division ? all.filter((p) => p.division === division) : all;
  },

  /**
   * Paginated Portfolio items for Gallery and Division showcases
   */
  async getPortfolioPaginated(options: PortfolioQueryOptions = {}): Promise<PaginatedPortfolioResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(50, options.pageSize || 9));

    let allItems = await this.getPortfolio(options.division);
    if (options.featuredOnly) {
      allItems = allItems.filter((item) => item.featured);
    }

    const totalCount = allItems.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = allItems.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Update portfolio record and update cache
   */
  async savePortfolio(id: string, data: Partial<FirestorePortfolio>): Promise<void> {
    const docRef = doc(db, 'portfolio', id);
    await setDoc(docRef, { ...data, id }, { merge: true });
    if (cachedPortfolio) {
      const idx = cachedPortfolio.data.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cachedPortfolio.data[idx] = { ...cachedPortfolio.data[idx], ...data } as FirestorePortfolio;
      }
    }
  },
};
