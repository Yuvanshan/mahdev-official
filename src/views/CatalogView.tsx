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
  const pageSize = 8;

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
    const params = new URLSearchParams(window.location.search);
    const targetSkuOrId = initialProductId || params.get('sku') || params.get('id') || params.get('product');
    if (!targetSkuOrId) return;

    const clean = targetSkuOrId.trim().toLowerCase();
    const all = catalogService.queryProducts();
    const found =
      all.find(
        (p) =>
          p.id.toLowerCase() === clean ||
          p.slug.toLowerCase() === clean ||
          (p as any).sku?.toLowerCase() === clean
      ) ||
      catalogService.getProductById(targetSkuOrId) ||
      catalogService.getProductBySlug(targetSkuOrId);

    if (found) {
      setSelectedProduct(found);
    }
  }, [initialProductId, firestoreProducts]);

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

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Catalog Hero Section */}
      <CatalogHero
        totalProducts={allMasterProducts.length}
        totalCategories={categories.length}
        searchQuery={filters.searchQuery || ''}
        onSearchChange={(q) => handleFilterChange({ ...filters, searchQuery: q })}
      />

      {/* Sticky Interactive Filter Bar */}
      <CatalogFilterBar
        filters={filters}
        sortBy={sortBy}
        categories={categories}
        totalResults={paginatedResult.total}
        onFilterChange={handleFilterChange}
        onSortChange={setSortBy}
        onResetFilters={handleResetFilters}
      />

      {/* Main Grid Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 relative min-h-[400px]">
        {isInitialLoading && paginatedResult.total === 0 ? (
          <DataLoadingOverlay
            message="Loading Products"
            subMessage="Curating our collection..."
          />
        ) : (
          <CatalogProductGrid
            products={paginatedResult.items}
            totalProducts={paginatedResult.total}
            currentPage={paginatedResult.page}
            totalPages={paginatedResult.totalPages}
            onPageChange={setCurrentPage}
            onSelectProduct={setSelectedProduct}
            onResetFilters={handleResetFilters}
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
