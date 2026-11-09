import React from 'react';
import { CatalogProduct } from '../../types/catalog';
import { CatalogProductCard } from './CatalogProductCard';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';

interface CatalogProductGridProps {
  products: CatalogProduct[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: CatalogProduct) => void;
  onResetFilters: () => void;
}

export const CatalogProductGrid: React.FC<CatalogProductGridProps> = ({
  products,
  totalProducts,
  currentPage,
  totalPages,
  onPageChange,
  onSelectProduct,
  onResetFilters,
}) => {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <PackageSearch className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-serif text-neutral-900 mb-2">No Matching Products or Services Found</h3>
        <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
          We couldn't find any items matching your selected division, category, type, or search criteria.
        </p>
        <button
          onClick={onResetFilters}
          className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors shadow-xs"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <CatalogProductCard
            key={product.id}
            product={product}
            onSelect={onSelectProduct}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 font-mono">
            Page <strong className="text-neutral-900">{currentPage}</strong> of{' '}
            <strong className="text-neutral-900">{totalPages}</strong> ({totalProducts} total items)
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                currentPage === 1
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-neutral-50'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100 bg-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-neutral-900 text-white font-bold'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                currentPage === totalPages
                  ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-neutral-50'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100 bg-white'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
