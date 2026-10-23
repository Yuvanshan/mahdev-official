import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Product, MART_PRODUCTS, MART_CATEGORIES, mapFirestoreProductToMart, mapFirestoreCategoryToMart, productInMartCategory } from '../../data/martData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { MartProductCard } from './MartProductCard';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';
import {
  EMPTY_PRICE_RANGE,
  PriceRange,
  PriceRangeFilter,
  getPriceBounds,
  isPriceRangeActive,
  priceInRange,
} from '../common/PriceRangeFilter';

interface MartCatalogSectionProps {
  selectedCategoryId: string | null;
  searchQuery: string;
  onSelectCategory: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  /** Opens the full product catalogue (/catalog). */
  onViewAllProducts?: () => void;
}

export const MartCatalogSection: React.FC<MartCatalogSectionProps> = ({
  selectedCategoryId,
  searchQuery,
  onSelectCategory,
  onSearchChange,
  onViewProduct,
  onAddToCart,
  onViewAllProducts,
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating' | 'name-asc' | 'name-desc'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  // Unset ends mean "no limit", so every product shows until the shopper narrows it.
  const [priceRange, setPriceRange] = useState<PriceRange>(EMPTY_PRICE_RANGE);

  const { products: rawProducts, categories: rawCategories } = useFirestoreDataContext();

  // Dynamically resolve products from Firestore (or fallback)
  const allMartProducts = useMemo<Product[]>(() => {
    if (rawProducts && rawProducts.length > 0) {
      // Published Mart products only (same rule as the category counts).
      const martDivisionProducts = rawProducts
        .filter((p) => !p.division || p.division === 'mart' || (p as any).divisionId === 'mart')
        .filter((p) => p.isPublished !== false && (p as any).status !== 'draft' && (p as any).status !== 'archived');
      if (martDivisionProducts.length > 0) {
        return martDivisionProducts.map((p) => mapFirestoreProductToMart(p, rawCategories));
      }
    }
    return [];
  }, [rawProducts, rawCategories]);

  // Mart's own categories only; a category with no division shows only if a Mart product uses it.
  const allMartCategories = useMemo(() => {
    if (rawCategories && rawCategories.length > 0) {
      const usedCategories = new Set(allMartProducts.map((p) => p.category));
      const martCats = rawCategories.filter((c) =>
        isSameDivision(c.division, 'mart') ||
        isSameDivision((c as any).divisionId, 'mart') ||
        (!c.division && !(c as any).divisionId && (usedCategories.has(c.id) || (!!c.slug && usedCategories.has(c.slug))))
      );
      if (martCats.length > 0) {
        return martCats.map(mapFirestoreCategoryToMart);
      }
    }
    return [];
  }, [rawCategories, allMartProducts]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return allMartProducts.filter((product) => {
      // Category filter
      if (selectedCategoryId) {
        const selected = allMartCategories.find((c) => c.id === selectedCategoryId) || { id: selectedCategoryId };
        if (!productInMartCategory(product.category, selected)) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchBrand = product.brand.toLowerCase().includes(q);
        const matchTags = product.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchBrand && !matchTags) return false;
      }
      // In-stock filter
      if (inStockOnly && !product.inStock) {
        return false;
      }
      // Price range filter
      if (!priceInRange(product.price, priceRange)) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      // Default: newly added products first (newest first), then the existing featured order
      const aListed = a.listedAt ? Date.parse(a.listedAt) || 0 : 0;
      const bListed = b.listedAt ? Date.parse(b.listedAt) || 0 : 0;
      if (aListed || bListed) return bListed - aListed;
      // Default: featured first, then best-seller
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [allMartProducts, allMartCategories, selectedCategoryId, searchQuery, inStockOnly, priceRange, sortBy]);

  const priceBounds = useMemo(() => getPriceBounds(allMartProducts.map((p) => p.price)), [allMartProducts]);

  // Early return only after every hook has run (keeps hook order stable; React error #310).
  if (allMartProducts.length === 0) {
    return null;
  }

  const activeCategoryName = allMartCategories.find((c) => c.id === selectedCategoryId)?.name || 'All Products';

  const handleResetFilters = () => {
    onSelectCategory(null);
    onSearchChange('');
    setInStockOnly(false);
    setPriceRange(EMPTY_PRICE_RANGE);
    setSortBy('featured');
  };

  return (
    <SectionContainer id="products" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header & Controls Bar */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <ScrollReveal direction="up">
              <Caption className="text-[#0052FF] mb-1 block font-mono">
                Storefront Collection
              </Caption>
              <H2 className="text-slate-900">
                {activeCategoryName} ({filteredProducts.length})
              </H2>
              {searchQuery && (
                <p className="text-xs text-slate-500 mt-1">
                  Showing search results for: <strong className="text-slate-800">"{searchQuery}"</strong>
                </p>
              )}
            </ScrollReveal>
          </div>

          {onViewAllProducts && (
            <button
              type="button"
              onClick={onViewAllProducts}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              View all products
              <span aria-hidden="true">→</span>
            </button>
          )}

          {/* Product search (moved here from the hero, which is now kept clean). */}
          <form
            role="search"
            onSubmit={(event) => event.preventDefault()}
            className="relative w-full md:max-w-sm"
          >
            <label htmlFor="mart-product-search" className="sr-only">Search products</label>
            <input
              id="mart-product-search"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search decor, lighting, tech gear..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </form>

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="featured">Newest & Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {/* Filter Pills Ribbon */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedCategoryId === null
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>

              {/* Live admin categories; the static list is only a fallback (it is empty until data loads). */}
              {(allMartCategories.length > 0 ? allMartCategories : MART_CATEGORIES).map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0052FF] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name.split('&')[0]}
                  </button>
                );
              })}
            </div>

            {/* Quick In-Stock Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>In-Stock Only</span>
              </label>

              {(selectedCategoryId || searchQuery || inStockOnly || isPriceRangeActive(priceRange)) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {priceBounds && priceBounds.max > priceBounds.min && (
            <PriceRangeFilter
              bounds={priceBounds}
              value={priceRange}
              onChange={setPriceRange}
              className="border-t border-slate-100 pt-3 sm:max-w-md"
            />
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <MartProductCard
              key={prod.id}
              product={prod}
              onViewProduct={onViewProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        /* Zero Results Fallback */
        <div className="py-16 text-center rounded-2xl bg-white border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold text-slate-900">
              No matching products found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any products matching your current filters. Try searching for a different keyword or resetting your filters.
            </p>
          </div>
          <Button variant="electric" size="sm" onClick={handleResetFilters} className="text-xs">
            Reset Filters
          </Button>
        </div>
      )}
    </SectionContainer>
  );
};
