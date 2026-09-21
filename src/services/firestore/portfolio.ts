/**
 * Firestore Portfolio Repository (Optimized - Phase 33)
 * Implements bounded queries, memory caching, query deduplication, and pagination.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestorePortfolio, DivisionId } from '../../types/firestore';
import { isSameDivision } from './divisions';

const CACHE_TTL_MS = 1000 * 60 * 30; // 30-minute memoized cache for static portfolio
let cachedPortfolio: { data: FirestorePortfolio[]; timestamp: number } | null = null;
let inFlightPortfolioPromise: Promise<FirestorePortfolio[]> | null = null;

export function getDefaultPortfolio(): FirestorePortfolio[] {
  // Phase 60: Real Data Architecture - Zero fake portfolio items by default.
  // Portfolio projects are populated via Admin Portal or Firestore collection.
  return [];
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
      return division
        ? cachedPortfolio.data.filter(
            (p) => isSameDivision(p.division, division) || isSameDivision((p as any).divisionId, division)
          )
        : cachedPortfolio.data;
    }

    if (inFlightPortfolioPromise && !forceRefresh) {
      const all = await inFlightPortfolioPromise;
      return division
        ? all.filter(
            (p) => isSameDivision(p.division, division) || isSameDivision((p as any).divisionId, division)
          )
        : all;
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
          cachedPortfolio = { data: [], timestamp: Date.now() };
          return [];
        }
      } catch (err) {
        console.warn('[Firestore Portfolio] Optimized fetch error:', err);
        const fallback = cachedPortfolio?.data || [];
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
    const payload = sanitizeForFirestore({ ...data, id });
    await setDoc(docRef, payload, { merge: true });
    if (cachedPortfolio) {
      const idx = cachedPortfolio.data.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cachedPortfolio.data[idx] = { ...cachedPortfolio.data[idx], ...payload } as FirestorePortfolio;
      }
    }
  },

  async deletePortfolio(id: string): Promise<void> {
    const docRef = doc(db, 'portfolio', id);
    await deleteDoc(docRef);
    if (cachedPortfolio) {
      cachedPortfolio.data = cachedPortfolio.data.filter((p) => p.id !== id);
    }
  },

  /**
   * Realtime listener for portfolio items
   */
  subscribePortfolio(
    onDataOrDivision: ((data: FirestorePortfolio[]) => void) | DivisionId | undefined,
    onDataCallback?: (data: FirestorePortfolio[]) => void
  ): Unsubscribe {
    const division = typeof onDataOrDivision === 'string' ? onDataOrDivision : undefined;
    const onData = typeof onDataOrDivision === 'function' ? onDataOrDivision : onDataCallback || (() => {});

    const colRef = collection(db, 'portfolio');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;

    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestorePortfolio[];
        cachedPortfolio = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Portfolio] Listener fallback error:', err);
        onData(cachedPortfolio?.data || []);
      }
    );
  },
};
