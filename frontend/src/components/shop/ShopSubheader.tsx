import React, { useMemo, useState } from 'react';
import { Heart, Search, SlidersHorizontal } from 'lucide-react';
import { reportSearch } from '../../services/searchHistoryService';
import { clearSearches, getRecentSearches, recordSearch, recordView } from '../../utils/usageProfile';
import { useWishlist } from '../../context/WishlistContext';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { galleryPath } from '../../config/itemSeo';
import { OptimizedImage } from '../ui/OptimizedImage';

interface ShopSubheaderProps {
  onNavigate: (route: string) => void;
}

// Where the search goes. The explore page already has the type, category, price and sort filters.
const HISTORY_SHOWN = 3;
const SUGGESTIONS_PER_KIND = 3;

interface Suggestion {
  key: string;
  label: string;
  kind: 'Category' | 'Service' | 'Gallery' | 'Product';
  imageUrl?: string;
  href: string;
}

const SCOPES = [
  { value: 'all', label: 'All', path: '/services' },
  { value: 'services', label: 'Services', path: '/services/category/type-services' },
  { value: 'gallery', label: 'Gallery', path: '/services/category/type-gallery' },
  { value: 'products', label: 'Products', path: '/services/category/type-products' },
] as const;

// Search bar plus a category strip of the divisions, shown under the main navigation (Flipkart header).
export const ShopSubheader: React.FC<ShopSubheaderProps> = ({ onNavigate }) => {
  const { divisions, services, gallery, products, categories: catalogCategories } = useFirestoreDataContext();
  const [keyword, setKeyword] = useState('');
  const [scope, setScope] = useState<(typeof SCOPES)[number]['value']>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const { wishlistItems } = useWishlist();

  // Matches for what the visitor is typing: categories first, then services, gallery and products.
  const term = keyword.trim().toLowerCase();
  const suggestions = useMemo<Suggestion[]>(() => {
    if (term.length < 1) return [];
    const match = (...parts: Array<string | undefined>) => parts.some((part) => part?.toLowerCase().includes(term));
    const categoryHits = catalogCategories
      .filter((item) => item.isPublished !== false && item.slug && match(item.name))
      .slice(0, SUGGESTIONS_PER_KIND)
      .map<Suggestion>((item) => ({ key: `c-${item.id}`, label: item.name, kind: 'Category', imageUrl: item.imageUrl, href: `/services/category/${item.slug}` }));
    const serviceHits = services
      .filter((item) => item.isPublished !== false && item.status !== 'inactive' && item.status !== 'draft' && match(item.title, item.name, item.category))
      .slice(0, SUGGESTIONS_PER_KIND)
      .map<Suggestion>((item) => ({ key: `s-${item.id}`, label: item.title || item.name, kind: 'Service', imageUrl: item.imageUrl || item.images?.[0], href: `/services/${item.slug || item.id}` }));
    const galleryHits = gallery
      .filter((item) => item.type === 'image' && match(item.title, item.category, item.tag, ...(item.tags || [])))
      .slice(0, SUGGESTIONS_PER_KIND)
      .map<Suggestion>((item) => ({ key: `g-${item.id}`, label: item.title, kind: 'Gallery', imageUrl: item.thumbnailUrl || item.mediaUrl || item.url, href: galleryPath(item.title, item.id) }));
    const productHits = products
      .filter((item) => (item as { status?: string }).status !== 'archived' && (item as { status?: string }).status !== 'draft' && match(item.name))
      .slice(0, SUGGESTIONS_PER_KIND)
      .map<Suggestion>((item) => ({ key: `p-${item.id}`, label: item.name, kind: 'Product', imageUrl: item.imageUrl || item.images?.[0], href: `/mart?product=${encodeURIComponent(item.id)}` }));
    return [...categoryHits, ...serviceHits, ...galleryHits, ...productHits];
  }, [term, catalogCategories, services, gallery, products]);

  const openSuggestion = (suggestion: Suggestion) => {
    recordSearch(suggestion.label);
    recordView(suggestion.label);
    setShowHistory(false);
    setKeyword('');
    onNavigate(suggestion.href);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = keyword.trim();
    recordSearch(query);
    if (query.length >= 2) reportSearch(query, scope);
    setShowHistory(false);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    // Only positive numbers are sent; the explore page ignores anything else.
    if (Number(minPrice) > 0) params.set('min', String(Number(minPrice)));
    if (Number(maxPrice) > 0) params.set('max', String(Number(maxPrice)));
    const path = SCOPES.find((item) => item.value === scope)?.path || '/services';
    const search = params.toString();
    onNavigate(search ? `${path}?${search}` : path);
    setShowFilters(false);
  };

  const categories = divisions
    .filter((division) => division.isPublished !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2">
        <form onSubmit={submitSearch} role="search" className="relative flex min-w-0 flex-1 rounded-sm border border-slate-300 bg-slate-50 focus-within:border-blue-600 focus-within:bg-white">
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onFocus={() => {
              setHistory(getRecentSearches(HISTORY_SHOWN));
              setShowHistory(true);
            }}
            onBlur={() => setShowHistory(false)}
            placeholder="Search for services, packages, products and more"
            aria-label="Search the Mahdev catalogue"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500"
          />
          {showHistory && (term.length < 1 ? history.length > 0 : suggestions.length > 0) && (
            // onMouseDown keeps the input focused so a click lands before the blur closes the list.
            <ul onMouseDown={(event) => event.preventDefault()} aria-label={term.length < 1 ? 'Recent searches' : 'Suggestions'} className="absolute left-0 right-0 top-full z-30 mt-px max-h-80 overflow-y-auto border border-slate-200 bg-white shadow-lg">
              {term.length < 1 ? (
                <>
                  <li className="flex items-center justify-between px-4 py-1.5 text-xs font-semibold text-slate-500">
                    Recent searches
                    <button type="button" onClick={() => { clearSearches(); setHistory([]); }} className="text-blue-700 hover:underline">Clear</button>
                  </li>
                  {history.map((entry) => (
                    <li key={entry}>
                      <button type="button" onClick={() => { setKeyword(entry); setShowHistory(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50">
                        <Search aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" /> {entry}
                      </button>
                    </li>
                  ))}
                </>
              ) : (
                suggestions.map((suggestion) => (
                  <li key={suggestion.key}>
                    <button type="button" onClick={() => openSuggestion(suggestion)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
                        {suggestion.imageUrl && <img src={suggestion.imageUrl} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{suggestion.label}</span>
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{suggestion.kind}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            aria-label="Search filters"
            className="border-l border-slate-300 px-3 text-slate-600 hover:text-blue-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button type="submit" aria-label="Search" className="rounded-r-sm bg-blue-600 px-5 text-white hover:bg-blue-700">
            <Search className="h-4 w-4" />
          </button>
        </form>
        <button
          type="button"
          onClick={() => onNavigate('/wishlist')}
          aria-label={`Wishlist, ${wishlistItems.length} ${wishlistItems.length === 1 ? 'item' : 'items'}`}
          className="relative shrink-0 rounded-sm border border-slate-300 bg-white p-2.5 text-slate-700 hover:border-blue-600 hover:text-blue-700"
        >
          <Heart className="h-4 w-4" />
          {wishlistItems.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-blue-950">
              {wishlistItems.length}
            </span>
          )}
        </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 rounded-sm border border-slate-200 bg-slate-50 p-3 text-sm">
            <fieldset className="flex flex-wrap gap-2">
              <legend className="mb-1 text-xs font-semibold text-slate-600">Search in</legend>
              {SCOPES.map((item) => (
                <label key={item.value} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium ${scope === item.value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>
                  <input type="radio" name="search-scope" value={item.value} checked={scope === item.value} onChange={() => setScope(item.value)} className="sr-only" />
                  {item.label}
                </label>
              ))}
            </fieldset>
            <label className="text-xs font-semibold text-slate-600">
              Min price (LKR)
              <input type="number" min="0" inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="mt-1 block w-28 rounded-sm border border-slate-300 px-2 py-1.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Max price (LKR)
              <input type="number" min="0" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="mt-1 block w-28 rounded-sm border border-slate-300 px-2 py-1.5 text-sm font-normal" />
            </label>
            <p className="text-xs text-slate-500">Category and sort options show on the results page.</p>
          </div>
        )}
        {categories.length > 0 && (
          <nav aria-label="Divisions" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-6">
            {categories.map((division) => {
              const imageUrl = division.logoUrl || division.logo || division.imageUrl;
              return (
                <button
                  key={division.id}
                  type="button"
                  onClick={() => onNavigate(division.route || `/${division.slug || division.id}`)}
                  className="group flex w-20 shrink-0 flex-col items-center gap-1 rounded-sm p-1 sm:w-24"
                >
                  <span className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 transition-transform duration-200 group-hover:scale-110 group-hover:border-amber-400">
                    {imageUrl && (
                      <OptimizedImage
                        src={imageUrl}
                        alt=""
                        optimizedWidth={320}
                        sizes="48px"
                        loading="lazy"
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>
                  <span className="line-clamp-1 text-xs font-medium text-slate-800 group-hover:text-blue-700">
                    {division.shortName || division.name}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
};
