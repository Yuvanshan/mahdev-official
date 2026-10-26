import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeDollarSign, Camera, Image as ImageIcon, Layers, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { ServiceTile, inAppLinkClick } from '../components/services/ServiceTile';
import { gallerySeo, productSeo, servicePagePath } from '../config/itemSeo';
import { ServiceDetailsModal, toServiceDetails, wrapIndex } from '../components/services/ServiceDetailsModal';
import { CatalogProductModal } from '../components/catalog/CatalogProductModal';
import { GallerySectionShimmer } from '../components/common/GallerySectionShimmer';
import { ImageWithShimmer } from '../components/ui/ImageWithShimmer';
import { SectionContainer } from '../components/ui/SectionContainer';
import { mapFirestoreProductToCatalog } from '../services/catalogService';
import { CatalogProduct } from '../types/catalog';
import { FirestoreGallery, FirestoreProduct, FirestoreService } from '../types/firestore';
import { StartingPriceTag, getServiceStartingPrice, getStartingPrice, getStartingPriceDetails } from '../components/common/StartingPriceTag';
import {
  EMPTY_PRICE_RANGE,
  PriceRange,
  PriceRangeFilter,
  getPriceBounds,
  isPriceRangeActive,
  priceInRange,
} from '../components/common/PriceRangeFilter';
import { FilterDrawer, FilterDrawerPanel, FilterOptionRow, FilterTriggerButton, describePriceRange } from '../components/common/FilterDrawer';
import { ListingSortSelect } from '../components/common/ListingSortSelect';
import { LISTING_SORT_OPTIONS, ListingSort, sortListing } from '../utils/listingSort';
import { formatCurrency, formatLKR } from '../utils/currency';
import { getImageSourceCandidates } from '../utils/imageSources';
import { DIVISIONS } from '../config/divisions';
import type { DivisionId } from '../types';
import { getImageAlt, preferSavedAlt } from '../config/imageAlt';

type BrowseType = 'service' | 'gallery' | 'product';
type BrowseItem =
  | { type: 'service'; id: string; title: string; description: string; category: string; division: string; image: string; images: string[]; searchableText: string; data: FirestoreService }
  | { type: 'gallery'; id: string; title: string; description: string; category: string; division: string; image: string; images: string[]; searchableText: string; data: FirestoreGallery }
  | { type: 'product'; id: string; title: string; description: string; category: string; division: string; image: string; images: string[]; searchableText: string; data: CatalogProduct };

const KIND_LABELS: Record<BrowseType, string> = {
  service: 'Services',
  gallery: 'Gallery',
  product: 'Products',
};

const toCategorySlug = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const TYPE_SLUGS: Record<string, BrowseType> = {
  'type-services': 'service',
  'type-gallery': 'gallery',
  'type-products': 'product',
};

// Maps a /services/category/{slug} URL slug to a filter. Category filters compare
// slugs, so the selection works before any items have loaded.
const toFilterFromSlug = (slug?: string) => {
  const normalizedSlug = toCategorySlug(slug || '');
  if (!normalizedSlug) return 'all';
  const type = TYPE_SLUGS[normalizedSlug];
  return type ? `type:${type}` : `category:${normalizedSlug}`;
};

/** Price used for filtering and sorting: services' starting price, gallery and product prices. */
const getItemPrice = (item: BrowseItem): number | null =>
  item.type === 'service'
    ? getServiceStartingPrice(item.data as unknown as Record<string, any>)
    : getStartingPrice(item.data.price);

// Price, sort and search live in the query string (?min=&max=&priced=1&sort=&q=), so they
// survive the category route change (which remounts the page) and can be shared.
const readInitialParams = () => {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const amount = (key: string) => {
    const value = Number(params.get(key));
    return params.get(key) && Number.isFinite(value) && value > 0 ? value : null;
  };
  const sort = params.get('sort') as ListingSort | null;
  return {
    query: params.get('q')?.trim() || '',
    price: { min: amount('min'), max: amount('max') } as PriceRange,
    pricedOnly: params.get('priced') === '1',
    sort: sort && LISTING_SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'recommended' as ListingSort,
  };
};

const BrowseCard: React.FC<{
  item: BrowseItem;
  onSelect: (item: BrowseItem) => void;
  onNavigate: (route: string) => void;
  imageLoading: 'eager' | 'lazy';
}> = ({ item, onSelect, onNavigate, imageLoading }) => {
  const imageSources = getImageSourceCandidates(item.image, item.images);
  // Each card links to the item's own page (listed in the sitemap), so search engines can
  // follow it; a plain click opens the details pop-up instead.
  const record = item.data as unknown as Record<string, unknown>;
  const href = item.type === 'service'
    ? servicePagePath(record)
    : item.type === 'product'
      ? productSeo(record, item.data.id).path
      : gallerySeo(record, item.data.id).path;
  const openDetails = inAppLinkClick(() => onSelect(item));
  // Services: image, title and View only; full details open in the modal below.
  if (item.type === 'service') {
    return (
      <ServiceTile
        title={item.title}
        imageAlt={preferSavedAlt(item.data.imageAlt, getImageAlt(item.title, item.division, item.category))}
        images={imageSources}
        href={href}
        onView={() => onSelect(item)}
        imageLoading={imageLoading}
        price={getServiceStartingPrice(item.data as unknown as Record<string, any>)}
      />
    );
  }
  const price = item.type === 'product' ? item.data.price : null;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <a
        href={href}
        onClick={openDetails}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
        aria-label={`View ${item.title}`}
      >
        {imageSources.length ? (
          <ImageWithShimmer
            src={imageSources[0]}
            fallbackSources={imageSources.slice(1)}
            alt={preferSavedAlt(item.data.imageAlt, getImageAlt(item.title, item.division, item.category))}
            className="absolute inset-0"
            imageClassName="!object-contain"
            loading={imageLoading}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            {item.type === 'gallery' ? <Camera className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
          {KIND_LABELS[item.type]}
        </span>
        {item.images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-[10px] font-medium text-white">
            {item.images.length} photos
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-blue-700">{item.division}</span>
          <span className="max-w-[48%] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{item.category}</span>
        </div>
        <h2 className="line-clamp-2 min-h-11 text-sm font-semibold leading-5 text-slate-900">{item.title}</h2>
        <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{item.description || 'Explore this Mahdev offering.'}</p>
        {item.type === 'gallery' && <StartingPriceTag price={item.data.price} className="mb-3" />}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-900">
            {item.type === 'gallery'
              ? 'View project'
              : price && price > 0
                ? formatCurrency(price, 'LKR')
                : 'Contact for details'}
          </span>
          <a
            href={href}
            onClick={openDetails}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 transition hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View details <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <div aria-hidden="true" className="mt-2 h-4" />
      </div>
    </article>
  );
};

export const ExploreAllView: React.FC<{
  onNavigate: (route: string) => void;
  initialCategorySlug?: string;
}> = ({ onNavigate, initialCategorySlug }) => {
  const {
    services,
    products,
    categories: productCategories,
    gallery,
    isServicesLoading,
    isProductsLoading,
    isGalleryLoading,
  } = useFirestoreDataContext();
  // Pre-fill from ?q= (used by the 404 page search and WhatsApp service links), plus ?min/max/priced/sort.
  const [initialParams] = useState(readInitialParams);
  const [query, setQuery] = useState(initialParams.query);
  const [priceRange, setPriceRange] = useState<PriceRange>(initialParams.price);
  const [pricedOnly, setPricedOnly] = useState(initialParams.pricedOnly);
  const [sortBy, setSortBy] = useState<ListingSort>(initialParams.sort);
  // Select the category from the URL immediately, so a direct visit never flashes "All items".
  const [selectedFilter, setSelectedFilter] = useState(() => toFilterFromSlug(initialCategorySlug));
  const [selectedService, setSelectedService] = useState<FirestoreService | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<{ data: FirestoreGallery; images: string[] } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  // Which filter drawer tab is open ('categories' | 'price'), or null when closed.
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setOpenPanel(null), []);

  const availableProducts = products;
  const availableServices = services;
  const availableGallery = gallery;

  const productItems = useMemo(
    () => availableProducts
      .filter((product) => product.isPublished !== false && product.status !== 'draft' && product.status !== 'archived')
      .map((product) => mapFirestoreProductToCatalog(product, productCategories)),
    [availableProducts, productCategories]
  );

  const allItems = useMemo<BrowseItem[]>(() => {
    const serviceItems: BrowseItem[] = availableServices
      .filter((service) => service.isPublished !== false && service.status !== 'draft' && service.status !== 'inactive')
      .map((service) => {
        const legacyService = service as FirestoreService & {
          image?: unknown;
          galleryImages?: unknown;
          media?: unknown;
          thumbnailUrl?: unknown;
          url?: unknown;
        };
        const images = getImageSourceCandidates(
          service.images,
          service.imageUrl,
          legacyService.image,
          legacyService.galleryImages,
          legacyService.media,
          legacyService.thumbnailUrl,
          legacyService.url
        ).slice(0, 5);
        const title = service.title || service.name || 'Service';
        const category = service.category || service.categoryId || 'Services';
        const searchableText = [
          title, service.description, service.sku, category, service.divisionName,
          service.divisionId, ...(Array.isArray(service.features) ? service.features : []), ...(images),
        ].filter(Boolean).join(' ').toLowerCase();
        return {
          type: 'service',
          id: service.id,
          title,
          description: service.description || '',
          category,
          division: service.divisionName || String(service.divisionId || 'Mahdev'),
          image: images[0] || '',
          images,
          searchableText,
          data: service,
        };
      });
    const galleryItems: BrowseItem[] = availableGallery
      .filter((item) => item.status !== 'hidden')
      .map((item) => {
        const raw = item as FirestoreGallery & Record<string, unknown>;
        const images = getImageSourceCandidates(
          item.images,
          item.mediaUrl,
          item.url,
          item.thumbnailUrl,
          raw.image,
          raw.galleryImages,
          raw.media
        ).slice(0, 5);
        const image = images[0] || '';
        const category = item.category || item.tag || 'Gallery';
        const searchableText = [
          item.title, item.caption, item.sku, category,
          item.division, ...(item.tags || []), ...images,
        ].filter(Boolean).join(' ').toLowerCase();
        return {
          type: 'gallery',
          id: item.id,
          title: item.title || 'Gallery project',
          description: item.caption || '',
          category,
          division: String(item.division || 'Mahdev'),
          image,
          images: images.length ? images : image ? [image] : [],
          searchableText,
          data: item,
        };
      });
    const catalogItems: BrowseItem[] = productItems.map((product) => ({
      type: 'product',
      id: product.id,
      title: product.name,
      description: product.shortDescription || product.description,
      category: product.categoryName,
      division: product.divisionName,
      image: product.imageUrl,
      images: getImageSourceCandidates(product.gallery, product.imageUrl),
      searchableText: [
        product.name, product.sku, product.slug, product.shortDescription, product.description,
        product.categoryName, product.divisionName, product.brand, ...product.tags,
        ...product.specifications.flatMap((spec) => [spec.label, spec.value]),
      ].filter(Boolean).join(' ').toLowerCase(),
      data: product,
    }));
    return [...serviceItems, ...galleryItems, ...catalogItems];
  }, [availableServices, availableGallery, productItems]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    allItems.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [allItems]);

  // Keep the selection in sync when the URL's category changes (back/forward navigation).
  useEffect(() => {
    setSelectedFilter(toFilterFromSlug(initialCategorySlug));
  }, [initialCategorySlug]);

  // Items in the selected type/category; the price slider limits follow this selection.
  const itemsInSelection = useMemo(() => allItems.filter((item) => {
    const matchesType = !selectedFilter.startsWith('type:')
      || item.type === selectedFilter.slice(5);
    const matchesCategory = !selectedFilter.startsWith('category:')
      || toCategorySlug(item.category) === selectedFilter.slice(9);
    return matchesType && matchesCategory;
  }), [allItems, selectedFilter]);

  const priceBounds = useMemo(() => getPriceBounds(itemsInSelection.map(getItemPrice)), [itemsInSelection]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = itemsInSelection.filter((item) => {
      const price = getItemPrice(item);
      if (pricedOnly && price === null) return false;
      return priceInRange(price, priceRange) && (!normalizedQuery || item.searchableText.includes(normalizedQuery));
    });
    return sortListing(matches, sortBy, getItemPrice, (item) => item.title);
  }, [itemsInSelection, query, priceRange, pricedOnly, sortBy]);

  // Previous/Next in the gallery pop-up move through the gallery items in the current list.
  const listedGalleryItems = filteredItems.filter((item) => item.type === 'gallery');
  const openGalleryIndex = selectedGalleryItem
    ? listedGalleryItems.findIndex((item) => item.data.id === selectedGalleryItem.data.id)
    : -1;
  const galleryNavigation = openGalleryIndex >= 0 && listedGalleryItems.length > 1 ? {
    onPrevious: () => {
      const item = listedGalleryItems[wrapIndex(openGalleryIndex, -1, listedGalleryItems.length)];
      setSelectedGalleryItem({ data: item.data as FirestoreGallery, images: item.images });
    },
    onNext: () => {
      const item = listedGalleryItems[wrapIndex(openGalleryIndex, 1, listedGalleryItems.length)];
      setSelectedGalleryItem({ data: item.data as FirestoreGallery, images: item.images });
    },
    positionLabel: `${openGalleryIndex + 1} of ${listedGalleryItems.length}`,
  } : undefined;

  const handleSelect = (item: BrowseItem) => {
    if (item.type === 'service') setSelectedService(item.data);
    if (item.type === 'gallery') {
      setSelectedGalleryItem({ data: item.data, images: item.images });
    }
    if (item.type === 'product') setSelectedProduct(item.data);
  };

  const isLoading = isServicesLoading || isProductsLoading || isGalleryLoading;

  const selectedFilterLabel = selectedFilter.startsWith('category:')
    ? categories.find(([category]) => toCategorySlug(category) === selectedFilter.slice('category:'.length))?.[0]
      || selectedFilter.slice('category:'.length)
    : selectedFilter.startsWith('type:')
      ? KIND_LABELS[selectedFilter.slice('type:'.length) as BrowseType]
      : undefined;
  const priceLabel = describePriceRange(priceRange, formatLKR) || (pricedOnly ? 'Priced only' : undefined);
  const hasPricedItems = priceBounds !== null;
  const showPriceSlider = priceBounds !== null && priceBounds.max > priceBounds.min;
  const isFiltered = query.trim() !== '' || selectedFilter !== 'all' || isPriceRangeActive(priceRange) || pricedOnly;

  // Carries price/sort/search across the category route change (see readInitialParams).
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (priceRange.min !== null) params.set('min', String(priceRange.min));
    if (priceRange.max !== null) params.set('max', String(priceRange.max));
    if (pricedOnly) params.set('priced', '1');
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    const text = params.toString();
    return text ? `?${text}` : '';
  };
  const updateFilter = (filter: string, keepOtherFilters = true) => {
    setSelectedFilter(filter);
    setOpenPanel(null);
    const queryString = keepOtherFilters ? buildQueryString() : '';
    if (filter === 'all') {
      onNavigate(`/services${queryString}`);
      return;
    }

    const pathSlug = filter.startsWith('category:')
      ? toCategorySlug(filter.slice('category:'.length))
      : {
          service: 'type-services',
          gallery: 'type-gallery',
          product: 'type-products',
        }[filter.slice('type:'.length) as BrowseType];
    onNavigate(`/services/category/${pathSlug}${queryString}`);
  };
  const clearAllFilters = () => {
    setQuery('');
    setPriceRange(EMPTY_PRICE_RANGE);
    setPricedOnly(false);
    setSortBy('recommended');
    if (selectedFilter !== 'all') updateFilter('all', false);
  };

  // Removable chips summarising what is currently applied
  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (query.trim()) activeChips.push({ key: 'q', label: `“${query.trim()}”`, clear: () => setQuery('') });
  if (selectedFilterLabel) activeChips.push({ key: 'cat', label: selectedFilterLabel, clear: () => updateFilter('all') });
  if (isPriceRangeActive(priceRange)) {
    activeChips.push({ key: 'price', label: describePriceRange(priceRange, formatLKR)!, clear: () => setPriceRange(EMPTY_PRICE_RANGE) });
  }
  if (pricedOnly) activeChips.push({ key: 'priced', label: 'Priced items only', clear: () => setPricedOnly(false) });

  const drawerPanels: FilterDrawerPanel[] = [
    {
      id: 'categories',
      label: 'Categories',
      icon: <Layers className="h-3.5 w-3.5" />,
      summary: selectedFilterLabel,
      content: (
        <>
          <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Show</h3>
          <nav aria-label="Catalog categories" className="space-y-1">
            <FilterOptionRow label="All items" count={allItems.length} selected={selectedFilter === 'all'} onClick={() => updateFilter('all')} />
            {(['service', 'gallery', 'product'] as BrowseType[]).map((type) => (
              <FilterOptionRow
                key={type}
                label={KIND_LABELS[type]}
                count={allItems.filter((item) => item.type === type).length}
                selected={selectedFilter === `type:${type}`}
                onClick={() => updateFilter(`type:${type}`)}
              />
            ))}
          </nav>
          {categories.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Categories</h3>
              <nav aria-label="Item category filters" className="space-y-1">
                {categories.map(([category, count]) => {
                  const filter = `category:${toCategorySlug(category)}`;
                  return (
                    <FilterOptionRow
                      key={category}
                      label={category}
                      count={count}
                      selected={selectedFilter === filter}
                      onClick={() => updateFilter(filter)}
                    />
                  );
                })}
              </nav>
            </div>
          )}
        </>
      ),
    },
  ];
  if (hasPricedItems) {
    drawerPanels.push({
      id: 'price',
      label: 'Price',
      icon: <BadgeDollarSign className="h-3.5 w-3.5" />,
      summary: priceLabel,
      content: (
        <div className="space-y-5">
          {showPriceSlider && (
            <PriceRangeFilter
              bounds={priceBounds!}
              value={priceRange}
              onChange={setPriceRange}
              hint="Items without a listed price are hidden while a price range is set."
            />
          )}
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm font-medium text-slate-700 hover:border-blue-300">
            <span className="inline-flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4 text-slate-400" />
              Only show items with a listed price
            </span>
            <input
              type="checkbox"
              checked={pricedOnly}
              onChange={(event) => setPricedOnly(event.target.checked)}
              className="h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
            />
          </label>
        </div>
      ),
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <SEOHead
        title="Explore Services, Gallery & Products"
        description="Browse Mahdev services, event and studio gallery projects, and products in one place."
        canonicalUrl="https://mahdev.lk/services"
      />
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Mahdev Marketplace</p>
            <h1 className="font-editorial text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Explore everything</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Browse services, gallery projects, and products together. Search by name, description, category, feature, or SKU.</p>
          </div>
          <label className="relative block w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services, gallery, products..."
              aria-label="Search services, gallery, and products"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </SectionContainer>

      <SectionContainer background="subtle" paddingY="lg">
        <section aria-live="polite">
          {/* Filter toolbar: Categories and Price open the left drawer on the matching tab */}
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <FilterTriggerButton
                icon={<Layers className="h-4 w-4" />}
                label="Categories"
                activeLabel={selectedFilterLabel}
                onClick={() => setOpenPanel('categories')}
                expanded={openPanel === 'categories'}
              />
              {hasPricedItems && (
                <FilterTriggerButton
                  icon={<BadgeDollarSign className="h-4 w-4" />}
                  label="Price"
                  activeLabel={priceLabel}
                  onClick={() => setOpenPanel('price')}
                  expanded={openPanel === 'price'}
                />
              )}
              <ListingSortSelect value={sortBy} onChange={setSortBy} className="min-w-[200px] flex-1 sm:ml-auto sm:flex-none" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span><span className="font-semibold text-slate-900">{filteredItems.length}</span> {isFiltered ? `of ${allItems.length} items match` : 'items'}</span>
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  aria-label={`Remove filter ${chip.label}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100"
                >
                  <span className="truncate">{chip.label}</span>
                  <X className="h-3 w-3 shrink-0" />
                </button>
              ))}
              {isFiltered && (
                <button type="button" onClick={clearAllFilters} className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700">
                  <RotateCcw className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>
          </div>
          {filteredItems.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {filteredItems.map((item, index) => (
                <BrowseCard
                  key={`${item.type}:${item.id}`}
                  item={item}
                  onSelect={handleSelect}
                  onNavigate={onNavigate}
                  imageLoading={index < 4 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
              <GallerySectionShimmer divisionName="Mahdev catalog" />
              <p className="mt-4 text-sm text-slate-500">Loading available services and items…</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <Search className="mx-auto mb-3 h-7 w-7 text-slate-300" />
              <h2 className="font-semibold text-slate-900">No matching items</h2>
              <p className="mt-1 text-sm text-slate-500">Try a different keyword, price range or category.</p>
              <button type="button" onClick={clearAllFilters} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Show all items
              </button>
            </div>
          )}
        </section>
      </SectionContainer>

      <FilterDrawer
        openPanel={openPanel}
        onChangePanel={setOpenPanel}
        onClose={closeDrawer}
        panels={drawerPanels}
        resultCount={filteredItems.length}
        onReset={clearAllFilters}
        canReset={isFiltered}
      />

      {selectedProduct && (
        <CatalogProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectRelated={setSelectedProduct} />
      )}

      {/* Shared full-screen service details (images left, details right; full screen on mobile). */}
      <ServiceDetailsModal
        service={selectedService ? toServiceDetails(selectedService as unknown as Record<string, any>, selectedService.divisionName) : null}
        onClose={() => setSelectedService(null)}
        primaryAction={selectedService ? {
          label: 'Book',
          onClick: () => {
            const id = selectedService.id;
            setSelectedService(null);
            onNavigate(`/book/service/${id}`);
          },
        } : undefined}
        actions={selectedService ? [{
          label: 'Full service page',
          onClick: () => {
            const slug = selectedService.slug || selectedService.id;
            setSelectedService(null);
            onNavigate(`/services/${encodeURIComponent(slug)}`);
          },
        }] : []}
        whatsappInquiry={selectedService ? {
          category: selectedService.category,
          serviceId: selectedService.id,
        } : undefined}
      />

      {/* Gallery items open in the same pop-up as services (large image, swipeable). */}
      <ServiceDetailsModal
        service={selectedGalleryItem ? {
          title: selectedGalleryItem.data.title || 'Gallery project',
          images: selectedGalleryItem.images,
          subtitle: selectedGalleryItem.data.category || selectedGalleryItem.data.tag,
          description: selectedGalleryItem.data.caption,
          divisionName: DIVISIONS[selectedGalleryItem.data.division as DivisionId]?.name || String(selectedGalleryItem.data.division || 'Mahdev'),
          ...getStartingPriceDetails(selectedGalleryItem.data.price),
        } : null}
        onClose={() => setSelectedGalleryItem(null)}
        itemNavigation={galleryNavigation}
        whatsappInquiry={selectedGalleryItem ? {
          category: selectedGalleryItem.data.category || selectedGalleryItem.data.tag,
          itemId: selectedGalleryItem.data.id,
          type: 'gallery',
        } : undefined}
      />
    </main>
  );
};
