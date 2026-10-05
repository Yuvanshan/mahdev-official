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
import { compressDataUrl } from '../../utils/imageOptimizer';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15-minute memoized cache
let cachedProducts: { data: FirestoreProduct[]; timestamp: number } | null = null;
let inFlightProductsPromise: Promise<FirestoreProduct[]> | null = null;

export function getDefaultProducts(): FirestoreProduct[] {
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
      inFlightProductsPromise = null;
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
    let safePrimaryImg = primaryImg;
    if (typeof safePrimaryImg === 'string' && safePrimaryImg.startsWith('data:image/') && safePrimaryImg.length > 30000) {
      safePrimaryImg = await compressDataUrl(safePrimaryImg, 1000, 0.75);
    }
    const allImages = [safePrimaryImg, ...otherImgs].filter(Boolean);
    const safeImages = await Promise.all(
      allImages.map(async (img: string) => {
        if (typeof img === 'string' && img.startsWith('data:image/') && img.length > 30000) {
          return await compressDataUrl(img, 1000, 0.75);
        }
        return img;
      })
    );

    const payload = sanitizeForFirestore({
      ...data,
      id,
      imageUrl: safePrimaryImg,
      images: safeImages,
      galleryImages: safeImages,
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
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error('[Firestore Products] save error:', err);
      throw err;
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
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[Firestore Products] delete error:', err);
      throw err;
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

    return onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as FirestoreProduct[];
        cachedProducts = { data, timestamp: Date.now() };
        if (division) {
          const filtered = data.filter(
            (p) => isSameDivision(p.division, division) || isSameDivision((p as any).divisionId, division)
          );
          onData(filtered);
        } else {
          onData(data);
        }
      },
      (err) => {
        console.warn('[Firestore Products] Listener fallback error:', err);
        const fallback = cachedProducts?.data || [];
        if (division) {
          onData(
            fallback.filter(
              (p) => isSameDivision(p.division, division) || isSameDivision((p as any).divisionId, division)
            )
          );
        } else {
          onData(fallback);
        }
      }
    );
  },
};
