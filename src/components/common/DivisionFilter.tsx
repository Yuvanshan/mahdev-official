import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Layers, RotateCcw, Search, SlidersHorizontal, Tag, X } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { getStartingPrice } from './StartingPriceTag';
import { ListingSortSelect } from './ListingSortSelect';
import { ListingSort, sortListing } from '../../utils/listingSort';
import { formatLKR } from '../../utils/currency';
import {
  EMPTY_PRICE_RANGE,
  PriceRange,
  PriceRangeFilter,
  getPriceBounds,
  isPriceRangeActive,
  priceInRange,
} from './PriceRangeFilter';

/**
 * One shared search + category + price + sort filter per division page.
 *
 * The page wraps its sections in <DivisionFilterProvider> and renders a single
 * <DivisionFilterBar>. Each section passes its own items through
 * useDivisionFilteredItems(), which registers them (so the bar can build the
 * category list and price bounds from everything on the page) and returns the
 * items that match the current filter, in the chosen sort order. Outside a
 * provider the hook is a no-op.
 */

export interface FilterableItem {
  title: string;
  /** Extra searchable text (description, tags, location...). */
  text?: string;
  category?: string;
  price?: unknown;
}

interface FilterValues {
  query: string;
  /** Normalised category key, or 'all'. */
  category: string;
  price: PriceRange;
  /** Only items with a listed price. */
  pricedOnly: boolean;
  sort: ListingSort;
}

const EMPTY_FILTER: FilterValues = {
  query: '',
  category: 'all',
  price: EMPTY_PRICE_RANGE,
  pricedOnly: false,
  sort: 'recommended',
};

// "day-tours", "Day_Tours" and "Day Tours" are the same category
const categoryKey = (category?: string) =>
  String(category || '').trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');

/** Display name for a category: slugs like "day-tours" become "Day Tours"; real names are kept. */
const categoryLabel = (category: string) => {
  const trimmed = category.trim();
  if (trimmed !== trimmed.toLowerCase() && !/[-_]/.test(trimmed)) return trimmed;
  return trimmed.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

function itemMatches(item: FilterableItem, filter: FilterValues): boolean {
  if (filter.category !== 'all' && categoryKey(item.category) !== filter.category) return false;
  const query = filter.query.trim().toLowerCase();
  if (query && !`${item.title} ${item.category || ''} ${item.text || ''}`.toLowerCase().includes(query)) return false;
  const price = getStartingPrice(item.price);
  if (filter.pricedOnly && price === null) return false;
  return priceInRange(price, filter.price);
}

interface DivisionFilterContextValue {
  filter: FilterValues;
  setFilter: (patch: Partial<FilterValues>) => void;
  reset: () => void;
  isActive: boolean;
  sources: Record<string, FilterableItem[]>;
  register: (sourceKey: string, items: FilterableItem[] | null) => void;
}

const DivisionFilterContext = createContext<DivisionFilterContextValue | null>(null);

export const DivisionFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filter, setFilterState] = useState<FilterValues>(EMPTY_FILTER);
  const [sources, setSources] = useState<Record<string, FilterableItem[]>>({});

  const setFilter = useCallback((patch: Partial<FilterValues>) => setFilterState((prev) => ({ ...prev, ...patch })), []);
  const reset = useCallback(() => setFilterState(EMPTY_FILTER), []);
  const register = useCallback((sourceKey: string, items: FilterableItem[] | null) => {
    setSources((prev) => {
      const next = { ...prev };
      if (items) next[sourceKey] = items;
      else delete next[sourceKey];
      return next;
    });
  }, []);

  // Sorting alone is not "filtering", so it doesn't count towards isActive
  const isActive =
    filter.query.trim() !== '' || filter.category !== 'all' || isPriceRangeActive(filter.price) || filter.pricedOnly;
  const value = useMemo(
    () => ({ filter, setFilter, reset, isActive, sources, register }),
    [filter, setFilter, reset, isActive, sources, register]
  );

  return <DivisionFilterContext.Provider value={value}>{children}</DivisionFilterContext.Provider>;
};

/** Filter state for empty-state messages; null outside a provider. */
export const useDivisionFilter = () => useContext(DivisionFilterContext);

/**
 * Registers a section's items with the page filter and returns the matching
 * ones, sorted by the chosen sort (Recommended keeps the section's order).
 * `describe` maps an item to its searchable title, category and price; list
 * anything else it reads (e.g. a category-name lookup) in `describeDeps`.
 */
export function useDivisionFilteredItems<T>(
  sourceKey: string,
  items: T[],
  describe: (item: T) => FilterableItem,
  describeDeps: unknown[] = []
): T[] {
  const ctx = useContext(DivisionFilterContext);
  const register = ctx?.register;
  // `describe` is usually an inline arrow, so only re-describe when its inputs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const described = useMemo(() => items.map(describe), [items, ...describeDeps]);

  useEffect(() => {
    if (!register) return;
    register(sourceKey, described);
    return () => register(sourceKey, null);
  }, [register, sourceKey, described]);

  const filter = ctx?.filter;
  return useMemo(() => {
    if (!filter) return items;
    const matches = items
      .map((item, index) => ({ item, info: described[index] }))
      .filter((entry) => itemMatches(entry.info, filter));
    return sortListing(matches, filter.sort, (entry) => getStartingPrice(entry.info.price), (entry) => entry.info.title)
      .map((entry) => entry.item);
  }, [filter, items, described]);
}

/** Message shown inside a section whose items are all filtered out. */
export const DivisionFilterEmptyState: React.FC<{ label: string }> = ({ label }) => {
  const ctx = useDivisionFilter();
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center" role="status">
      <p className="text-sm font-semibold text-slate-700">No {label} match your filters.</p>
      {ctx?.isActive && (
        <button type="button" onClick={ctx.reset} className="mt-2 text-xs font-bold text-[#0052FF] hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );
};

interface DivisionFilterBarProps {
  /** e.g. "Search SWS services, gallery & rentals..." */
  placeholder: string;
  /** Section background, to blend with the page. */
  background?: 'white' | 'subtle';
}

/** The single search + category + price range panel for a division page. */
export const DivisionFilterBar: React.FC<DivisionFilterBarProps> = ({ placeholder, background = 'white' }) => {
  const ctx = useDivisionFilter();
  const allItems = useMemo(() => Object.values(ctx?.sources || {}).flat(), [ctx?.sources]);

  // Categories from every section on the page, labelled with the first spelling seen.
  const categories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    allItems.forEach((item) => {
      const key = categoryKey(item.category);
      if (!key) return;
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { label: categoryLabel(String(item.category)), count: 1 });
    });
    return Array.from(map, ([id, val]) => ({ id, ...val })).sort((a, b) => a.label.localeCompare(b.label));
  }, [allItems]);

  const priceBounds = useMemo(() => getPriceBounds(allItems.map((item) => getStartingPrice(item.price))), [allItems]);
  const matchCount = useMemo(
    () => (ctx ? allItems.filter((item) => itemMatches(item, ctx.filter)).length : 0),
    [allItems, ctx]
  );

  if (!ctx || allItems.length === 0) return null;
  const { filter, setFilter, reset, isActive } = ctx;
  const showPrice = priceBounds !== null && priceBounds.max > priceBounds.min;
  const hasPricedItems = priceBounds !== null;

  // Removable chips summarising what is currently applied
  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (filter.query.trim()) activeChips.push({ key: 'q', label: `“${filter.query.trim()}”`, clear: () => setFilter({ query: '' }) });
  if (filter.category !== 'all') {
    const label = categories.find((c) => c.id === filter.category)?.label || filter.category;
    activeChips.push({ key: 'cat', label, clear: () => setFilter({ category: 'all' }) });
  }
  if (isPriceRangeActive(filter.price)) {
    const { min, max } = filter.price;
    const label = min !== null && max !== null
      ? `${formatLKR(min)} – ${formatLKR(max)}`
      : min !== null ? `From ${formatLKR(min)}` : `Up to ${formatLKR(max!)}`;
    activeChips.push({ key: 'price', label, clear: () => setFilter({ price: EMPTY_PRICE_RANGE }) });
  }
  if (filter.pricedOnly) activeChips.push({ key: 'priced', label: 'Priced items only', clear: () => setFilter({ pricedOnly: false }) });

  const pillClass = (selected: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
      selected ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/25' : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
    }`;

  return (
    <SectionContainer id="browse" background={background} paddingY="sm">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:gap-6">
          <div className="min-w-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filter.query}
                onChange={(e) => setFilter({ query: e.target.value })}
                placeholder={placeholder}
                aria-label={placeholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
              {filter.query && (
                <button
                  type="button"
                  onClick={() => setFilter({ query: '' })}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category filter: one swipeable row on phones, wraps on larger screens so none are hidden */}
            {categories.length > 0 && (
              <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
                <button type="button" onClick={() => setFilter({ category: 'all' })} className={pillClass(filter.category === 'all')}>
                  <Layers className="h-3.5 w-3.5" />
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilter({ category: filter.category === cat.id ? 'all' : cat.id })}
                    className={pillClass(filter.category === cat.id)}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {cat.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-bold ${
                        filter.category === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {showPrice && (
            <PriceRangeFilter
              bounds={priceBounds!}
              value={filter.price}
              onChange={(price) => setFilter({ price })}
              hint="Items without a listed price are hidden while a price range is set."
              className="rounded-xl bg-slate-50 p-3"
            />
          )}
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {isActive ? `${matchCount} of ${allItems.length} items match` : `${allItems.length} items`}
            </span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.clear}
                aria-label={`Remove filter ${chip.label}`}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {isActive && (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700">
                <RotateCcw className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasPricedItems && (
              <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={filter.pricedOnly}
                  onChange={(e) => setFilter({ pricedOnly: e.target.checked })}
                  className="h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                />
                <BadgeDollarSign className="h-3.5 w-3.5 text-slate-400" />
                Priced items only
              </label>
            )}
            <ListingSortSelect value={filter.sort} onChange={(sort) => setFilter({ sort })} className="min-w-[200px]" />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
};
