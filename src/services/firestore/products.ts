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
import { db } from '../../lib/firebase';
import { FirestoreProduct, DivisionId } from '../../types/firestore';
import { MASTER_CATALOG_PRODUCTS } from '../../data/catalog/products';

const CACHE_TTL_MS = 1000 * 60 * 15; // 15-minute memoized cache
let cachedProducts: { data: FirestoreProduct[]; timestamp: number } | null = null;
let inFlightProductsPromise: Promise<FirestoreProduct[]> | null = null;

export function getDefaultProducts(): FirestoreProduct[] {
  return MASTER_CATALOG_PRODUCTS.map((p) => ({
    id: p.id,
    division: (p.divisionId || 'mart') as DivisionId,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categoryId,
    description: p.description,
    price: p.price,
    compareAtPrice: p.originalPrice,
    images: p.gallery && p.gallery.length > 0 ? p.gallery : [p.imageUrl],
    stock: p.stockQuantity,
    status: p.status === 'active' ? 'active' : 'draft',
    hasVariants: Boolean(p.variants && p.variants.options && p.variants.options.length > 0),
    variants: p.variants?.options?.map((opt) => ({
      id: opt.id,
      productId: p.id,
      name: opt.name,
      sku: opt.sku,
      price: p.price + (opt.priceModifier || 0),
      stock: opt.stockQuantity || 10,
    })),
    createdAt: p.createdAt || '2026-01-01T00:00:00Z',
    updatedAt: p.updatedAt || new Date().toISOString(),
  }));
}

export interface ProductQueryOptions {
  division?: DivisionId;
  categoryId?: string;
  search?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  featuredOnly?: boolean;
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

    if (!forceRefresh && cachedProducts && now - cachedProducts.timestamp < CACHE_TTL_MS) {
      return this.applyClientFilters(cachedProducts.data, options);
    }

    if (inFlightProductsPromise && !forceRefresh) {
      const data = await inFlightProductsPromise;
      return this.applyClientFilters(data, options);
    }

    inFlightProductsPromise = (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'products'), firestoreLimit(100)));
        if (!snap.empty) {
          const loaded = snap.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          })) as FirestoreProduct[];
          cachedProducts = { data: loaded, timestamp: Date.now() };
          return loaded;
        } else {
          // Auto-seed defaults in background
          const defaults = getDefaultProducts();
          cachedProducts = { data: defaults, timestamp: Date.now() };
          // Background asynchronous seed
          (async () => {
            for (const item of defaults) {
              await setDoc(doc(db, 'products', item.id), item, { merge: true }).catch(() => {});
            }
          })();
          return defaults;
        }
      } catch (err) {
        console.warn('[Firestore Products] Optimized fetch fallback:', err);
        const fallback = cachedProducts?.data || getDefaultProducts();
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

    if (options?.division) {
      filtered = filtered.filter((p) => p.division === options.division);
    }
    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
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
    const all = await this.getProducts();
    return all.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  },

  /**
   * Create or update product and synchronize cache
   */
  async saveProduct(id: string, data: Partial<FirestoreProduct>): Promise<void> {
    const docRef = doc(db, 'products', id);
    const payload = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    if (cachedProducts) {
      const idx = cachedProducts.data.findIndex((p) => p.id === id);
      if (idx >= 0) {
        cachedProducts.data[idx] = { ...cachedProducts.data[idx], ...payload } as FirestoreProduct;
      } else {
        cachedProducts.data.push(payload as FirestoreProduct);
      }
    }
  },

  /**
   * Invalidate memory cache
   */
  clearCache(): void {
    cachedProducts = null;
  },
};
