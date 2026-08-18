import React, { useState, useMemo } from 'react';
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

interface CatalogViewProps {
  initialDivision?: string;
  initialCategory?: string;
  initialProductId?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialDivision,
  initialCategory,
  initialProductId,
}) => {
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
      return catalogService.getProductById(initialProductId) || null;
    }
    return null;
  });

  // Query categories for active filters
  const categories = useMemo(() => {
    return catalogService.getCategories(filters.divisionId);
  }, [filters.divisionId]);

  // Master product count
  const allMasterProducts = useMemo(() => {
    return catalogService.queryProducts();
  }, []);

  // Paginated and filtered results
  const paginatedResult = useMemo(() => {
    return catalogService.getProductsPaginated(filters, sortBy, currentPage, pageSize);
  }, [filters, sortBy, currentPage, pageSize]);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <CatalogProductGrid
          products={paginatedResult.items}
          totalProducts={paginatedResult.total}
          currentPage={paginatedResult.page}
          totalPages={paginatedResult.totalPages}
          onPageChange={setCurrentPage}
          onSelectProduct={setSelectedProduct}
          onResetFilters={handleResetFilters}
        />
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
