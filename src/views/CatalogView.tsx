import React, { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { CatalogProductGrid } from '../components/catalog/CatalogProductGrid';
import { CatalogProductModal } from '../components/catalog/CatalogProductModal';
import {
  CatalogFilterOptions,
  CatalogSortOption,
  CatalogProduct,
} from '../types/catalog';
import { catalogService } from '../services/catalogService';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { InquiredItemShimmer } from '../components/common/InquiredItemShimmer';
import { InquiryItemNotFound } from '../components/common/InquiryItemNotFound';
import { normalizeCode } from '../utils/itemLookup';
import { deriveLookupSku } from '../utils/whatsapp';
import { CANONICAL_SITE_ORIGIN } from '../config/site';

const CATALOG_DIVISION = 'mart';

interface CatalogViewProps {
  initialDivision?: string;
  initialCategory?: string;
  initialProductId?: string;
  onNavigate?: (path: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialDivision,
  initialCategory,
  initialProductId,
  onNavigate,
}) => {
  const {
    products: firestoreProducts,
    categories: firestoreCategories,
    isInitialLoading,
    isFetching,
    isProductsLoading,
  } = useFirestoreDataContext();

  // The catalogue lists Mart products only (rental equipment from other divisions is never shown).
  void initialDivision;
  const [filters, setFilters] = useState<CatalogFilterOptions>({
    divisionId: CATALOG_DIVISION,
    categoryId: initialCategory,
    searchQuery: '',
  });

  const sortBy: CatalogSortOption = 'featured';

  // Keep the catalogue service in sync with BOTH products and categories (the data
  // layer only syncs products, which left the category list empty).
  const catalogVersion = useMemo(() => {
    if ((firestoreProducts && firestoreProducts.length) || (firestoreCategories && firestoreCategories.length)) {
      catalogService.syncWithFirestore(firestoreProducts, firestoreCategories);
    }
    return `${firestoreProducts?.length || 0}:${firestoreCategories?.length || 0}:${Date.now()}`;
  }, [firestoreProducts, firestoreCategories]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showFullCatalog, setShowFullCatalog] = useState<boolean>(false);
  const pageSize = 8;

  const search = typeof window !== 'undefined' ? window.location.search : '';
  const targetSkuOrId = useMemo(() => {
    if (initialProductId) return initialProductId;
    const params = new URLSearchParams(search);
    const q = params.get('id') || params.get('product') || params.get('sku');
    if (q && q.trim()) return q.trim();
    return null;
  }, [initialProductId, search]);

  // Selected product for modal inspection
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(() => {
    if (initialProductId) {
      const found = catalogService.getProductById(initialProductId) || catalogService.getProductBySlug(initialProductId);
      return found && found.divisionId === CATALOG_DIVISION ? found : null;
    }
    return null;
  });

  const inquiredProduct = useMemo(() => {
    if (!targetSkuOrId) return null;
    const clean = targetSkuOrId.trim().toLowerCase();
    const cleanNorm = normalizeCode(clean);
    const all = catalogService.queryProducts({ divisionId: CATALOG_DIVISION });
    const isMart = (p: CatalogProduct | undefined | null) => (p && p.divisionId === CATALOG_DIVISION ? p : null);
    return (
      all.find(
        (p) =>
          p.id.toLowerCase() === clean ||
          p.slug.toLowerCase() === clean ||
          (p as any).sku?.toLowerCase() === clean ||
          normalizeCode(p.id) === cleanNorm ||
          normalizeCode(p.slug) === cleanNorm ||
          normalizeCode((p as any).sku) === cleanNorm ||
          normalizeCode(deriveLookupSku(p.name, p.divisionId)) === cleanNorm ||
          p.name.toLowerCase().includes(clean)
      ) ||
      isMart(catalogService.getProductById(targetSkuOrId)) ||
      isMart(catalogService.getProductBySlug(targetSkuOrId)) ||
      null
    );
  }, [targetSkuOrId, catalogVersion]);

  useEffect(() => {
    if (!inquiredProduct) return;
    setSelectedProduct(inquiredProduct);
    setShowFullCatalog(false);
  }, [inquiredProduct]);


  // Query categories for active filters
  const categories = useMemo(() => {
    return catalogService.getCategories(CATALOG_DIVISION);
  }, [catalogVersion]);

  // All Mart products (for counts and the "browse all" link).
  const allMasterProducts = useMemo(() => {
    return catalogService.queryProducts({ divisionId: CATALOG_DIVISION });
  }, [catalogVersion]);

  // Product-list structured data (ItemList) for search engines, from the Mart products shown.
  useEffect(() => {
    if (allMasterProducts.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : CANONICAL_SITE_ORIGIN;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.catalogItemList = 'true';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Mahdev Mart product catalogue',
      numberOfItems: allMasterProducts.length,
      itemListElement: allMasterProducts.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${origin}/catalog?id=${encodeURIComponent(product.id)}`,
        name: product.name,
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [allMasterProducts]);

  // Live product count per category (only categories that have products are listed).
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of categories) {
      counts[category.id] = allMasterProducts.filter(
        (p) => p.categoryId === category.id || p.categorySlug === category.slug || p.categoryId === category.slug
      ).length;
    }
    return counts;
  }, [categories, allMasterProducts]);

  // Paginated and filtered results
  const paginatedResult = useMemo(() => {
    return catalogService.getProductsPaginated(filters, sortBy, currentPage, pageSize);
  }, [filters, sortBy, currentPage, pageSize, catalogVersion]);

  // Handle filter changes (resets page to 1)
  const handleFilterChange = (newFilters: CatalogFilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({ divisionId: CATALOG_DIVISION, categoryId: undefined, searchQuery: '' });
    setCurrentPage(1);
  };

  const isSingleItemMode = Boolean(inquiredProduct && !showFullCatalog);
  const displayedProducts = isSingleItemMode && inquiredProduct ? [inquiredProduct] : paginatedResult.items;
  const displayedTotal = isSingleItemMode ? 1 : paginatedResult.total;

  // If customer is navigating to a specific product query from a link:
  if (targetSkuOrId && !showFullCatalog) {
    // 1. Shimmer state while Firestore data is actively loading
    if (isProductsLoading || isInitialLoading || isFetching) {
      return (
        <div className="min-h-screen bg-neutral-50 flex flex-col pt-16">
          <InquiredItemShimmer />
        </div>
      );
    }

    // 2. Product not located in Firestore after query completed
    if (!inquiredProduct) {
      return (
        <div className="min-h-screen bg-neutral-50 flex flex-col pt-16">
          <InquiryItemNotFound
            query={targetSkuOrId}
            onBrowseAll={() => setShowFullCatalog(true)}
            onNavigate={onNavigate}
          />
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <SEOHead
        title="Mahdev Mart Product Catalogue | Event Decor, Gifts & More"
        description="Browse the Mahdev Mart product catalogue: event and home decor, foil balloons, gifts and more, with island-wide delivery in Sri Lanka. Order easily on WhatsApp."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/catalog`}
      />
      {/* Customer Inquired Item Context Banner */}
      {isSingleItemMode && inquiredProduct && (
        <div className="bg-emerald-50 border-b border-emerald-200 py-3.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-emerald-900">
                Viewing Selected Customer Inquired Item: <span className="underline">{inquiredProduct.name}</span>
              </span>
              <span className="font-mono text-xs bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                SKU: {(inquiredProduct as any).sku || inquiredProduct.id}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullCatalog(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <span>Browse Full Catalog ({allMasterProducts.length} items)</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Header: title + search (same layout as /services). */}
      {!isSingleItemMode && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Mahdev Mart</p>
              <h1 className="font-editorial text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Product catalogue</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Browse Mahdev Mart products. Search by name, description or SKU.</p>
            </div>
            <label className="relative block w-full md:max-w-md">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={filters.searchQuery || ''}
                onChange={(e) => handleFilterChange({ ...filters, searchQuery: e.target.value })}
                placeholder="Search products..."
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
        </section>
      )}

      {/* Main Grid Content Area: category filter (sidebar on desktop, chips on mobile) + products. */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 relative min-h-[400px] lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        {!isSingleItemMode && (
          <nav aria-label="Product categories" className="mb-6 lg:mb-0">
            <p className="mb-2 hidden text-xs font-semibold uppercase tracking-wider text-slate-500 lg:block">Categories</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
              {[{ id: '', name: 'All products', count: allMasterProducts.length }, ...categories
                .filter((c) => (categoryCounts[c.id] || 0) > 0)
                .map((c) => ({ id: c.id, name: c.name, count: categoryCounts[c.id] || 0 }))].map((cat) => {
                const active = (filters.categoryId || '') === cat.id;
                return (
                  <button
                    key={cat.id || 'all'}
                    type="button"
                    onClick={() => handleFilterChange({ ...filters, categoryId: cat.id || undefined })}
                    aria-pressed={active}
                    className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition lg:rounded-lg lg:border-0 lg:px-3 ${
                      active ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:bg-transparent'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-slate-400">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
        <div className="min-w-0">
        {isInitialLoading && paginatedResult.total === 0 ? (
          <DataLoadingOverlay
            message="Loading Products"
            subMessage="Curating our collection..."
          />
        ) : (
          <CatalogProductGrid
            products={displayedProducts}
            totalProducts={displayedTotal}
            currentPage={isSingleItemMode ? 1 : paginatedResult.page}
            totalPages={isSingleItemMode ? 1 : paginatedResult.totalPages}
            onPageChange={setCurrentPage}
            onSelectProduct={setSelectedProduct}
            onResetFilters={() => {
              setShowFullCatalog(true);
              handleResetFilters();
            }}
          />
        )}
        </div>
      </main>

      {/* Product Detail & Specification Modal */}
      <CatalogProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectRelated={(product) => setSelectedProduct(product)}
      />
    </div>
  );
};
