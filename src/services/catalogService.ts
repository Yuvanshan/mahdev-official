import {
  CatalogProduct,
  CatalogCategory,
  CatalogFilterOptions,
  CatalogSortOption,
  PaginatedResult,
  ProductType,
  StockStatus,
} from '../types/catalog';
import { FirestoreProduct, FirestoreCategory } from '../types/firestore';

export function mapFirestoreProductToCatalog(
  fp: FirestoreProduct,
  categories: (CatalogCategory | FirestoreCategory)[]
): CatalogProduct {
  const cat = categories.find((c) => c.id === fp.categoryId || (c as any).slug === fp.categoryId);
  const divId = (fp.division || 'mart') as any;
  const divName =
    divId === 'mart'
      ? 'Mahdev Online Mart'
      : divId === 'sws'
      ? 'SWS Event Management'
      : divId === 'u1'
      ? 'U1 Studio'
      : divId === 'it'
      ? 'Mahdev IT & Solutions'
      : divId === 'travels'
      ? 'Mahdev Travels'
      : 'Mahdev Group';

  const img = fp.images && fp.images.length > 0 ? fp.images[0] : '';
  const gallery = fp.images || [];
  const price = Number(fp.price) || 0;
  const origPrice = fp.compareAtPrice !== undefined ? Number(fp.compareAtPrice) : price;
  const discountPercent =
    origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

  return {
    id: fp.id,
    sku: fp.sku || `MD-${fp.id.toUpperCase().slice(0, 8)}`,
    name: fp.name,
    slug: fp.slug || fp.id,
    productType: (fp as any).productType || 'physical',
    divisionId: divId,
    divisionName: divName,
    categoryId: fp.categoryId || (cat ? cat.id : 'general'),
    categoryName: cat ? cat.name : 'General Merchandise',
    categorySlug: (cat as any)?.slug || 'general',
    shortDescription: fp.shortDescription || fp.description?.slice(0, 150) || '',
    description: fp.description || '',
    imageUrl: img,
    gallery: gallery,
    price: price,
    originalPrice: origPrice,
    currency: fp.currency || 'USD',
    discountPercent: discountPercent,
    stockQuantity: typeof fp.stock === 'number' ? fp.stock : 100,
    lowStockThreshold: 10,
    trackInventory: true,
    stockStatus: fp.stock === 0 ? 'out_of_stock' : fp.stock <= 10 ? 'low_stock' : 'in_stock',
    tags: (fp as any).tags || [],
    specifications: (() => {
      const raw = (fp as any).specifications;
      if (Array.isArray(raw)) {
        return raw.map((s: any) => ({
          label: s.label || s.name || s.key || 'Specification',
          value: String(s.value ?? s),
          group: s.group,
        }));
      }
      if (raw && typeof raw === 'object') {
        return Object.entries(raw).map(([k, v]) => ({
          label: k,
          value: String(v),
        }));
      }
      if (typeof raw === 'string' && raw.trim()) {
        return [{ label: 'Details', value: raw.trim() }];
      }
      return [];
    })(),
    rating: (fp as any).rating || 5.0,
    reviewsCount: (fp as any).reviewsCount || 0,
    isFeatured: (fp as any).isFeatured ?? true,
    brand: (fp as any).brand || 'Mahdev',
    status: fp.isPublished === false || fp.status === 'draft' ? 'draft' : 'active',
    createdAt: fp.createdAt || new Date().toISOString(),
    updatedAt: fp.updatedAt || new Date().toISOString(),
  };
}

export function mapFirestoreCategoryToCatalog(fc: FirestoreCategory): CatalogCategory {
  const divId = ((fc as any).divisionId || fc.division || 'mart') as any;
  return {
    id: fc.id,
    name: fc.name,
    slug: fc.slug || fc.id,
    divisionId: divId,
    description: fc.description || '',
    imageUrl: fc.imageUrl || '',
    iconName: (fc as any).iconName || 'Package',
    itemCount: (fc as any).itemCount || (fc as any).productCount || 0,
    status: (fc.status === 'inactive' ? 'inactive' : 'active'),
    sortOrder: fc.order || (fc as any).sortOrder || 0,
  };
}

/**
 * Unified Catalog Service for the Mahdev Ecosystem
 * Provides search, multi-faceted filtering, sorting, inventory calculation,
 * pagination, and Firestore database adapter compatibility.
 */
class CatalogService {
  private products: CatalogProduct[] = [];
  private categories: CatalogCategory[] = [];

  // ----------------------------------------------------
  // INVENTORY & STOCK HELPERS
  // ----------------------------------------------------
  public getComputedStockStatus(product: CatalogProduct): StockStatus {
    if (!product.trackInventory) {
      return 'unlimited';
    }
    if (product.stockQuantity <= 0) {
      return 'out_of_stock';
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return 'low_stock';
    }
    return 'in_stock';
  }

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  public getCategories(divisionId?: string): CatalogCategory[] {
    if (!divisionId || divisionId === 'all') {
      return this.categories.filter((c) => c.status === 'active');
    }
    return this.categories.filter(
      (c) => c.status === 'active' && c.divisionId === divisionId
    );
  }

  public getCategoryByIdOrSlug(identifier: string): CatalogCategory | undefined {
    return this.categories.find(
      (c) => c.id === identifier || c.slug === identifier
    );
  }

  // ----------------------------------------------------
  // PRODUCTS LOOKUP
  // ----------------------------------------------------
  public getProductById(id: string): CatalogProduct | undefined {
    const item = this.products.find((p) => p.id === id);
    if (!item) return undefined;
    return { ...item, stockStatus: this.getComputedStockStatus(item) };
  }

  public getProductBySlug(slug: string): CatalogProduct | undefined {
    const item = this.products.find((p) => p.slug === slug);
    if (!item) return undefined;
    return { ...item, stockStatus: this.getComputedStockStatus(item) };
  }

  public getProductBySku(sku: string): CatalogProduct | undefined {
    const item = this.products.find((p) => p.sku === sku);
    if (!item) return undefined;
    return { ...item, stockStatus: this.getComputedStockStatus(item) };
  }

  // ----------------------------------------------------
  // QUERY & FILTERING ENGINE
  // ----------------------------------------------------
  public queryProducts(
    filters: CatalogFilterOptions = {},
    sortBy: CatalogSortOption = 'featured'
  ): CatalogProduct[] {
    let result = this.products.map((item) => ({
      ...item,
      stockStatus: this.getComputedStockStatus(item),
    }));

    // Filter by Active Status
    result = result.filter((p) => p.status === 'active');

    // Filter by Division
    if (filters.divisionId && filters.divisionId !== 'all') {
      result = result.filter((p) => p.divisionId === filters.divisionId);
    }

    // Filter by Product Type (physical, digital, service, package, bookable_service)
    if (filters.productType && filters.productType !== 'all') {
      result = result.filter((p) => p.productType === filters.productType);
    }

    // Filter by Category
    if (filters.categoryId && filters.categoryId !== 'all') {
      result = result.filter(
        (p) => p.categoryId === filters.categoryId || p.categorySlug === filters.categoryId
      );
    }

    // Filter by Stock Status
    if (filters.stockStatus && filters.stockStatus !== 'all') {
      result = result.filter((p) => p.stockStatus === filters.stockStatus);
    }

    // Only In-Stock
    if (filters.onlyInStock) {
      result = result.filter(
        (p) => p.stockStatus === 'in_stock' || p.stockStatus === 'unlimited' || p.stockStatus === 'low_stock'
      );
    }

    // Only Featured
    if (filters.onlyFeatured) {
      result = result.filter((p) => p.isFeatured === true);
    }

    // Price Bounds
    if (typeof filters.minPrice === 'number') {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === 'number') {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // Multi-field Full-Text Search
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const inName = p.name.toLowerCase().includes(q);
        const inSku = p.sku.toLowerCase().includes(q);
        const inDesc = p.description.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q);
        const inBrand = (p.brand || '').toLowerCase().includes(q);
        const inCategory = (p.categoryName || '').toLowerCase().includes(q);
        const inDivision = (p.divisionName || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const inSpecs = (p.specifications || []).some(
          (s) => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q)
        );
        return inName || inSku || inDesc || inBrand || inCategory || inDivision || inTags || inSpecs;
      });
    }

    // Sorting Logic
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating_desc':
          return b.rating - a.rating;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'featured':
        default: {
          const aRank = (a.isFeatured ? 10 : 0) + (a.isBestSeller ? 5 : 0) + (a.isTrending ? 3 : 0);
          const bRank = (b.isFeatured ? 10 : 0) + (b.isBestSeller ? 5 : 0) + (b.isTrending ? 3 : 0);
          if (bRank !== aRank) return bRank - aRank;
          return b.rating - a.rating;
        }
      }
    });

    return result;
  }

  // ----------------------------------------------------
  // PAGINATION & LAZY LOADING
  // ----------------------------------------------------
  public getProductsPaginated(
    filters: CatalogFilterOptions = {},
    sortBy: CatalogSortOption = 'featured',
    page: number = 1,
    pageSize: number = 8
  ): PaginatedResult<CatalogProduct> {
    const allFiltered = this.queryProducts(filters, sortBy);
    const total = allFiltered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = allFiltered.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
      page: currentPage,
      pageSize,
      totalPages,
      hasMore: currentPage < totalPages,
    };
  }

  // ----------------------------------------------------
  // RELATED PRODUCTS
  // ----------------------------------------------------
  public getRelatedProducts(product: CatalogProduct, limit: number = 4): CatalogProduct[] {
    return this.products
      .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.divisionId === product.divisionId))
      .sort((a, b) => (b.categoryId === product.categoryId ? 1 : 0) - (a.categoryId === product.categoryId ? 1 : 0))
      .slice(0, limit)
      .map((item) => ({ ...item, stockStatus: this.getComputedStockStatus(item) }));
  }

  // ----------------------------------------------------
  // FIRESTORE / BACKEND ADAPTER SYNC
  // ----------------------------------------------------
  public syncWithFirestore(
    firestoreProducts?: FirestoreProduct[],
    firestoreCategories?: FirestoreCategory[]
  ): void {
    if (firestoreCategories && Array.isArray(firestoreCategories)) {
      this.categories = firestoreCategories.map(mapFirestoreCategoryToCatalog);
    }
    if (firestoreProducts && Array.isArray(firestoreProducts)) {
      this.products = firestoreProducts.map((fp) =>
        mapFirestoreProductToCatalog(fp, this.categories)
      );
    }
  }
}

export const catalogService = new CatalogService();
