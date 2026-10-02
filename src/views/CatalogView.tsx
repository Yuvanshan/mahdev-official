import React, { useState, useMemo, useEffect } from 'react';
import { CatalogHero } from '../components/catalog/CatalogHero';
import { CatalogFilterBar } from '../components/catalog/CatalogFilterBar';
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
    isLiveHydrated,
  } = useFirestoreDataContext();

  const [filters, setFilters] = useState<CatalogFilterOptions>({
    divisionId: initialDivision,
    categoryId: initialCategory,
    searchQuery: '',
    onlyInStock: false,
    onlyFeatured: false,
  });

  const [sortBy, setSortBy] = useState<CatalogSortOption>('featured');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inquiredProduct, setInquiredProduct] = useState<CatalogProduct | null>(null);
  const [showFullCatalog, setShowFullCatalog] = useState<boolean>(false);
  const pageSize = 8;

  const targetSkuOrId = useMemo(() => {
    if (initialProductId) return initialProductId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('sku') || params.get('id') || params.get('product') || params.get('title') || params.get('name');
      if (q && q.trim()) return q.trim();
    }
    return null;
  }, [initialProductId]);

  // Selected product for modal inspection
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(() => {
    if (initialProductId) {
      return (
        catalogService.getProductById(initialProductId) ||
        catalogService.getProductBySlug(initialProductId) ||
        null
      );
    }
    return null;
  });

  // Sync selected product when query params (e.g. ?sku=...) or initialProductId change
  useEffect(() => {
    if (!targetSkuOrId) return;

    const clean = targetSkuOrId.trim().toLowerCase();
    const cleanNorm = normalizeCode(clean);
    const all = catalogService.queryProducts();
    let found =
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
      catalogService.getProductById(targetSkuOrId) ||
      catalogService.getProductBySlug(targetSkuOrId);

    // If not found in memory cache, search directly in real-time firestoreProducts
    if (!found && firestoreProducts && firestoreProducts.length > 0) {
      const fp = firestoreProducts.find((p) => {
        const pSku = (p.sku || '').toLowerCase();
        const pId = p.id.toLowerCase();
        const pSlug = (p.slug || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return (
          pSku === clean ||
          pId === clean ||
          pSlug === clean ||
          normalizeCode(pSku) === cleanNorm ||
          normalizeCode(pId) === cleanNorm ||
          pName.includes(clean) ||
          clean.includes(pName)
        );
      });
      if (fp) {
        found = mapFirestoreProductToCatalog(fp, firestoreCategories);
      }
    }

    // Also check query param 'title' or 'name' from WhatsApp link
    if (!found && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const titleParam = (params.get('title') || params.get('name') || '').toLowerCase().trim();
      if (titleParam) {
        const titleNorm = normalizeCode(titleParam);
        const fp = (firestoreProducts || []).find((p) => {
          const pName = (p.name || '').toLowerCase();
          return pName.includes(titleParam) || titleParam.includes(pName) || normalizeCode(pName) === titleNorm;
        });
        if (fp) {
          found = mapFirestoreProductToCatalog(fp, firestoreCategories);
        }
      }
    }

    if (found) {
      setSelectedProduct(found);
      setInquiredProduct(found);
      setShowFullCatalog(false);
    }
  }, [targetSkuOrId, firestoreProducts, firestoreCategories]);

  // Query categories for active filters
  const categories = useMemo(() => {
    return catalogService.getCategories(filters.divisionId);
  }, [filters.divisionId, firestoreCategories]);

  // Master product count
  const allMasterProducts = useMemo(() => {
    return catalogService.queryProducts();
  }, [firestoreProducts]);

  // Paginated and filtered results
  const paginatedResult = useMemo(() => {
    return catalogService.getProductsPaginated(filters, sortBy, currentPage, pageSize);
  }, [filters, sortBy, currentPage, pageSize, firestoreProducts, firestoreCategories]);

  // Handle filter changes (resets page to 1)
  const handleFilterChange = (newFilters: CatalogFilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      divisionId: undefined,
      categoryId: undefined,
      productType: undefined,
      stockStatus: undefined,
      searchQuery: '',
      onlyInStock: false,
      onlyFeatured: false,
    });
    setSortBy('featured');
    setCurrentPage(1);
  };

  const isSingleItemMode = Boolean(inquiredProduct && !showFullCatalog);
  const displayedProducts = isSingleItemMode && inquiredProduct ? [inquiredProduct] : paginatedResult.items;
  const displayedTotal = isSingleItemMode ? 1 : paginatedResult.total;

  // If customer is navigating to a specific product query from a link:
  if (targetSkuOrId && !showFullCatalog) {
    // 1. Shimmer state while Firestore data is actively loading
    if ((isInitialLoading || !isLiveHydrated) && firestoreProducts.length === 0) {
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

      {/* Catalog Hero Section */}
      {!isSingleItemMode && (
        <CatalogHero
          totalProducts={allMasterProducts.length}
          totalCategories={categories.length}
          searchQuery={filters.searchQuery || ''}
          onSearchChange={(q) => handleFilterChange({ ...filters, searchQuery: q })}
        />
      )}

      {/* Sticky Interactive Filter Bar */}
      {!isSingleItemMode && (
        <CatalogFilterBar
          filters={filters}
          sortBy={sortBy}
          categories={categories}
          totalResults={paginatedResult.total}
          onFilterChange={handleFilterChange}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Main Grid Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 relative min-h-[400px]">
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
