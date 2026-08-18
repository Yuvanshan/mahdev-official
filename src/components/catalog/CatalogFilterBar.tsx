import React from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Package,
  Cpu,
  Sparkles,
  Camera,
  Compass,
  ShoppingBag,
} from 'lucide-react';
import {
  CatalogCategory,
  CatalogFilterOptions,
  CatalogSortOption,
  ProductType,
  StockStatus,
} from '../../types/catalog';

interface CatalogFilterBarProps {
  filters: CatalogFilterOptions;
  sortBy: CatalogSortOption;
  categories: CatalogCategory[];
  totalResults: number;
  onFilterChange: (filters: CatalogFilterOptions) => void;
  onSortChange: (sort: CatalogSortOption) => void;
  onResetFilters: () => void;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  filters,
  sortBy,
  categories,
  totalResults,
  onFilterChange,
  onSortChange,
  onResetFilters,
}) => {
  const divisions = [
    { id: 'all', name: 'All Divisions', icon: null },
    { id: 'mart', name: 'Mahdev Mart', icon: ShoppingBag },
    { id: 'it', name: 'IT & Solutions', icon: Cpu },
    { id: 'sws', name: 'SWS Events', icon: Sparkles },
    { id: 'u1', name: 'U1 Studio', icon: Camera },
    { id: 'travels', name: 'Mahdev Travels', icon: Compass },
  ];

  const productTypes: { id: ProductType | 'all'; name: string }[] = [
    { id: 'all', name: 'All Types' },
    { id: 'physical', name: 'Physical Goods' },
    { id: 'digital', name: 'Digital Licenses & Assets' },
    { id: 'service', name: 'IT & Pro Services' },
    { id: 'package', name: 'Turnkey Packages' },
    { id: 'bookable_service', name: 'Bookable Sessions' },
  ];

  const stockStatuses: { id: StockStatus | 'all'; name: string }[] = [
    { id: 'all', name: 'All Stock Statuses' },
    { id: 'in_stock', name: 'In Stock' },
    { id: 'low_stock', name: 'Low Stock (< Threshold)' },
    { id: 'unlimited', name: 'Unlimited (Digital/Service)' },
    { id: 'out_of_stock', name: 'Out of Stock' },
  ];

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    Boolean(filters.divisionId && filters.divisionId !== 'all') ||
    Boolean(filters.productType && filters.productType !== 'all') ||
    Boolean(filters.categoryId && filters.categoryId !== 'all') ||
    Boolean(filters.stockStatus && filters.stockStatus !== 'all') ||
    Boolean(filters.onlyFeatured);

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-20 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Top Controls: Search + Sort + Clear */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by SKU, title, specs, tags, brand, or division..."
              value={filters.searchQuery || ''}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Tools: Sort Selector + Active Results Counter */}
          <div className="flex items-center gap-3 justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-neutral-500" />
              <span className="text-xs text-neutral-500 uppercase tracking-wider font-medium hidden sm:inline">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as CatalogSortOption)}
                className="bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-medium text-neutral-800 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
              >
                <option value="featured">Featured & Curated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
                <option value="newest">Newest Arrivals</option>
                <option value="name_asc">Alphabetical (A-Z)</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Division Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-neutral-400 font-medium whitespace-nowrap mr-1">Division:</span>
          {divisions.map((div) => {
            const isSelected = (filters.divisionId || 'all') === div.id;
            const Icon = div.icon;
            return (
              <button
                key={div.id}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    divisionId: div.id === 'all' ? undefined : div.id,
                    categoryId: undefined, // Reset category when division changes
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{div.name}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Row: Product Types + Category Dropdown + Inventory Status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs">
          {/* Product Type Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-neutral-400 font-medium whitespace-nowrap mr-1">Type:</span>
            {productTypes.map((pt) => {
              const isSelected = (filters.productType || 'all') === pt.id;
              return (
                <button
                  key={pt.id}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      productType: pt.id === 'all' ? undefined : (pt.id as ProductType),
                    })
                  }
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {pt.name}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-neutral-200 hidden md:block mx-1" />

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filters.categoryId || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  categoryId: e.target.value === 'all' ? undefined : e.target.value,
                })
              }
              className="bg-neutral-50 border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.itemCount})
                </option>
              ))}
            </select>
          </div>

          {/* Inventory Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={filters.stockStatus || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  stockStatus: e.target.value === 'all' ? undefined : (e.target.value as StockStatus),
                })
              }
              className="bg-neutral-50 border border-neutral-200 rounded-md text-xs font-medium text-neutral-700 py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {stockStatuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Featured Toggle */}
          <button
            onClick={() => onFilterChange({ ...filters, onlyFeatured: !filters.onlyFeatured })}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
              filters.onlyFeatured
                ? 'bg-amber-500 text-white font-medium shadow-xs'
                : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Featured Only</span>
          </button>

          {/* Result Count Indicator */}
          <span className="ml-auto text-neutral-500 font-mono text-xs">
            Showing <strong className="text-neutral-900">{totalResults}</strong> matching items
          </span>
        </div>
      </div>
    </div>
  );
};
