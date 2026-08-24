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
import { Product, MART_PRODUCTS, MART_CATEGORIES, mapFirestoreProductToMart, mapFirestoreCategoryToMart } from '../../data/martData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { MartProductCard } from './MartProductCard';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../motion/MotionWrappers';

interface MartCatalogSectionProps {
  selectedCategoryId: string | null;
  searchQuery: string;
  onSelectCategory: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const MartCatalogSection: React.FC<MartCatalogSectionProps> = ({
  selectedCategoryId,
  searchQuery,
  onSelectCategory,
  onSearchChange,
  onViewProduct,
  onAddToCart,
}) => {
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  const { products: rawProducts, categories: rawCategories } = useFirestoreDataContext();

  // Dynamically resolve products from Firestore (or fallback)
  const allMartProducts = useMemo<Product[]>(() => {
    if (rawProducts && rawProducts.length > 0) {
      const martDivisionProducts = rawProducts.filter(
        (p) => !p.division || p.division === 'mart' || (p as any).divisionId === 'mart'
      );
      if (martDivisionProducts.length > 0) {
        return martDivisionProducts.map((p) => mapFirestoreProductToMart(p, rawCategories));
      }
    }
    return MART_PRODUCTS;
  }, [rawProducts, rawCategories]);

  const allMartCategories = useMemo(() => {
    if (rawCategories && rawCategories.length > 0) {
      const martCats = rawCategories.filter(
        (c) => !c.division || c.division === 'mart' || (c as any).divisionId === 'mart'
      );
      if (martCats.length > 0) {
        return martCats.map(mapFirestoreCategoryToMart);
      }
    }
    return MART_CATEGORIES;
  }, [rawCategories]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return allMartProducts.filter((product) => {
      // Category filter
      if (selectedCategoryId && product.category !== selectedCategoryId) {
        return false;
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
      // Max price filter
      if (product.price > maxPrice) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Default: featured first, then best-seller
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [allMartProducts, selectedCategoryId, searchQuery, inStockOnly, maxPrice, sortBy]);

  const activeCategoryName = allMartCategories.find((c) => c.id === selectedCategoryId)?.name || 'All Products';

  const handleResetFilters = () => {
    onSelectCategory(null);
    onSearchChange('');
    setInStockOnly(false);
    setMaxPrice(200);
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

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="featured">Featured & Best Sellers</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
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

              {MART_CATEGORIES.map((cat) => {
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

              {(selectedCategoryId || searchQuery || inStockOnly) && (
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
