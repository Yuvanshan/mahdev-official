/**
 * Firestore Products Repository (Optimized - Phase 33)
 * Implements bounded queries, memory caching, query deduplication, and pagination.
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
  limit as firestoreLimit,
  startAfter,
  orderBy,
  DocumentSnapshot,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../../lib/firebase';
import { FirestoreProduct, DivisionId } from '../../types/firestore';
import { isSameDivision } from './divisions';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15-minute memoized cache
let cachedProducts: { data: FirestoreProduct[]; timestamp: number } | null = null;
let inFlightProductsPromise: Promise<FirestoreProduct[]> | null = null;

export function getDefaultProducts(): FirestoreProduct[] {
  // Phase 60: Real Data Architecture - Zero fake products by default.
  // Real catalog items are populated through Admin Portal or Firestore collection.
  return [];
}

export interface ProductQueryOptions {
  division?: DivisionId;
  categoryId?: string;
  search?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
  includeDrafts?: boolean;
  includeArchived?: boolean;
}

export interface PaginatedProductsResult {
  items: FirestoreProduct[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export const firestoreProductsService = {
  /**
   * Fetch products with deduplicated in-flight requests and memory caching
   */
  async getProducts(options?: ProductQueryOptions, forceRefresh = false): Promise<FirestoreProduct[]> {
    const now = Date.now();

    if (forceRefresh) {
      cachedProducts = null;
    }

    if (!forceRefresh && cachedProducts && now - cachedProducts.timestamp < CACHE_TTL_MS) {
      return this.applyClientFilters(cachedProducts.data, options);
    }

    if (inFlightProductsPromise && !forceRefresh) {
      const data = await inFlightProductsPromise;
      return this.applyClientFilters(data, options);
    }

    inFlightProductsPromise = (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), firestoreLimit(250)));
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreProduct[];
          cachedProducts = { data: loaded, timestamp: Date.now() };
          return loaded;
        } else {
          cachedProducts = { data: [], timestamp: Date.now() };
          return [];
        }
      } catch (err) {
        console.warn('[Firestore Products] Optimized fetch fallback:', err);
        const fallback = cachedProducts?.data || [];
        cachedProducts = { data: fallback, timestamp: Date.now() };
        return fallback;
      } finally {
        inFlightProductsPromise = null;
      }
    })();

    const data = await inFlightProductsPromise;
    return this.applyClientFilters(data, options);
  },

  /**
   * Filter and slice product items
   */
  applyClientFilters(allProducts: FirestoreProduct[], options?: ProductQueryOptions): FirestoreProduct[] {
    let filtered = [...allProducts];

    // Filter out drafts, unpublished, or archived items from public storefronts unless requested
    if (!options?.includeDrafts) {
      filtered = filtered.filter(
        (p) =>
          p.status !== 'draft' &&
          p.status !== 'archived' &&
          (p as any).isDeleted !== true &&
          p.isPublished !== false
      );
    } else if (!options?.includeArchived) {
      filtered = filtered.filter((p) => p.status !== 'archived' && (p as any).isDeleted !== true);
    }

    if (options?.division) {
      filtered = filtered.filter(
        (p) => isSameDivision(p.division, options.division) || isSameDivision((p as any).divisionId, options.division)
      );
    }
    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }
    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  },

  /**
   * Paginated Products Fetcher (Reduces UI memory and DOM burden)
   */
  async getProductsPaginated(options: ProductQueryOptions = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(50, options.pageSize || 12));

    const allFiltered = await this.getProducts({
      division: options.division,
      categoryId: options.categoryId,
      search: options.search,
      includeDrafts: options.includeDrafts,
      includeArchived: options.includeArchived,
    });

    const totalCount = allFiltered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const items = allFiltered.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Get single product by ID or slug with cache-first lookup
   */
  async getProductById(idOrSlug: string): Promise<FirestoreProduct | null> {
    const all = await this.getProducts({ includeDrafts: true, includeArchived: true });
    return all.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  },

  /**
   * Create or update product and synchronize cache
   */
  async saveProduct(id: string, data: Partial<FirestoreProduct>): Promise<void> {
    const docRef = doc(db, 'products', id);
    const primaryImg = (data as any).imageUrl || (data.images && data.images[0]) || '';
    const otherImgs = ((data.images || (data as any).galleryImages || []) as string[]).filter(
      (u: string) => u && u !== primaryImg
    );
    const allImages = primaryImg ? [primaryImg, ...otherImgs] : otherImgs;

    const payload = sanitizeForFirestore({
      ...data,
      id,
      imageUrl: primaryImg,
      images: allImages,
      galleryImages: allImages,
      division: data.division || (data as any).divisionId || 'mart',
      divisionId: (data as any).divisionId || data.division || 'mart',
      stock: typeof data.stock === 'number' ? data.stock : ((data as any).stockQuantity ?? 0),
      stockQuantity: typeof data.stock === 'number' ? data.stock : ((data as any).stockQuantity ?? 0),
      isPublished: data.isPublished !== undefined ? data.isPublished : (data.status !== 'draft' && data.status !== 'archived'),
      status: data.status || (data.isPublished === false ? 'draft' : 'active'),
      updatedAt: new Date().toISOString(),
    });

    if (cachedProducts) {
      const idx = cachedProducts.data.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cachedProducts.data[idx] = { ...cachedProducts.data[idx], ...payload } as FirestoreProduct;
      } else {
        cachedProducts.data.unshift(payload as FirestoreProduct);
      }
    }

    try {
      await Promise.race([
        setDoc(docRef, payload, { merge: true }),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    } catch (err) {
      console.warn('[Firestore Products] save warning:', err);
    }
  },

  /**
   * Permanently delete product from Firestore and update memory cache
   */
  async deleteProduct(id: string): Promise<void> {
    const docRef = doc(db, 'products', id);
    if (cachedProducts) {
      cachedProducts.data = cachedProducts.data.filter((p) => p.id !== id);
    }
    try {
      await Promise.race([
        deleteDoc(docRef),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    } catch (err) {
      console.warn('[Firestore Products] delete warning:', err);
    }
  },

  /**
   * Invalidate memory cache
   */
  clearCache(): void {
    cachedProducts = null;
  },

  /**
   * Realtime listener for products
   */
  subscribeProducts(
    onDataOrDivision: ((data: FirestoreProduct[]) => void) | DivisionId | undefined,
    onDataCallback?: (data: FirestoreProduct[]) => void
  ): Unsubscribe {
    const division = typeof onDataOrDivision === 'string' ? onDataOrDivision : undefined;
    const onData = typeof onDataOrDivision === 'function' ? onDataOrDivision : onDataCallback || (() => {});

    const colRef = collection(db, 'products');
    const q = division ? query(colRef, where('division', '==', division)) : colRef;

    return onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestoreProduct[];
        cachedProducts = { data, timestamp: Date.now() };
        onData(data);
      },
      (err) => {
        console.warn('[Firestore Products] Listener fallback error:', err);
        onData(cachedProducts?.data || []);
      }
    );
  },
};
