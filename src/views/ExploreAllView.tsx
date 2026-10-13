import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Camera, CheckCircle2, Filter, Image as ImageIcon, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { CatalogProductModal } from '../components/catalog/CatalogProductModal';
import { GallerySectionShimmer } from '../components/common/GallerySectionShimmer';
import { ImageWithShimmer } from '../components/ui/ImageWithShimmer';
import { SectionContainer } from '../components/ui/SectionContainer';
import { mapFirestoreProductToCatalog } from '../services/catalogService';
import { CatalogProduct } from '../types/catalog';
import { FirestoreGallery, FirestoreService } from '../types/firestore';
import { formatCurrency } from '../utils/currency';
import { openWhatsAppInquiry } from '../utils/whatsapp';

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

const BrowseCard: React.FC<{
  item: BrowseItem;
  onSelect: (item: BrowseItem) => void;
}> = ({ item, onSelect }) => {
  const price = item.type === 'service'
    ? Number(item.data.startingPrice || item.data.price || 0)
    : item.type === 'product'
      ? item.data.price
      : null;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left"
        aria-label={`View ${item.title}`}
      >
        {item.image ? (
          <ImageWithShimmer
            src={item.image}
            alt={item.title}
            className="absolute inset-0"
            imageClassName="transition duration-500 group-hover:scale-105"
            loading="lazy"
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
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-blue-700">{item.division}</span>
          <span className="max-w-[48%] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">{item.category}</span>
        </div>
        <h2 className="line-clamp-2 min-h-11 text-sm font-semibold leading-5 text-slate-900">{item.title}</h2>
        <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-slate-500">{item.description || 'Explore this Mahdev offering.'}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-900">
            {item.type === 'gallery'
              ? 'View project'
              : price && price > 0
                ? `${item.type === 'service' ? 'From ' : ''}${formatCurrency(price, 'LKR')}`
                : 'Contact for details'}
          </span>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 transition hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View details <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
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
    isInitialLoading,
    isFetching,
    isServicesLoading,
    isProductsLoading,
    isGalleryLoading,
  } = useFirestoreDataContext();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<FirestoreService | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<FirestoreGallery | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isCategoryDrawerOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsCategoryDrawerOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isCategoryDrawerOpen]);

  const productItems = useMemo(
    () => products
      .filter((product) => product.isPublished !== false && product.status !== 'draft' && product.status !== 'archived')
      .map((product) => mapFirestoreProductToCatalog(product, productCategories)),
    [products, productCategories]
  );

  const allItems = useMemo<BrowseItem[]>(() => {
    const serviceItems: BrowseItem[] = services
      .filter((service) => service.isPublished !== false && service.status !== 'draft' && service.status !== 'inactive')
      .map((service) => {
        const images = (service.images || []).filter(Boolean).slice(0, 5);
        const title = service.title || service.name || 'Service';
        const category = service.category || service.categoryId || 'Services';
        const searchableText = [
          title, service.description, service.sku, category, service.divisionName,
          service.divisionId, ...(service.features || []), ...(images),
        ].filter(Boolean).join(' ').toLowerCase();
        return {
          type: 'service',
          id: service.id,
          title,
          description: service.description || '',
          category,
          division: service.divisionName || String(service.divisionId || 'Mahdev'),
          image: images[0] || service.imageUrl || '',
          images: images.length ? images : service.imageUrl ? [service.imageUrl] : [],
          searchableText,
          data: service,
        };
      });
    const galleryItems: BrowseItem[] = gallery
      .filter((item) => item.status !== 'hidden')
      .map((item) => {
        const images = (item.images || []).filter(Boolean).slice(0, 3);
        const image = images[0] || item.mediaUrl || item.url || item.thumbnailUrl || '';
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
      images: product.gallery || [],
      searchableText: [
        product.name, product.sku, product.slug, product.shortDescription, product.description,
        product.categoryName, product.divisionName, product.brand, ...product.tags,
        ...product.specifications.flatMap((spec) => [spec.label, spec.value]),
      ].filter(Boolean).join(' ').toLowerCase(),
      data: product,
    }));
    return [...serviceItems, ...galleryItems, ...catalogItems];
  }, [services, gallery, productItems]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    allItems.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [allItems]);

  useEffect(() => {
    if (!initialCategorySlug || !allItems.length) return;

    const typeSlugs: Record<string, BrowseType> = {
      'type-services': 'service',
      'type-gallery': 'gallery',
      'type-products': 'product',
    };
    const type = typeSlugs[initialCategorySlug];
    if (type) {
      setSelectedFilter(`type:${type}`);
      return;
    }

    const matchedCategory = categories.find(
      ([category]) => toCategorySlug(category) === initialCategorySlug
    );
    setSelectedFilter(matchedCategory ? `category:${matchedCategory[0]}` : 'all');
  }, [initialCategorySlug, categories, allItems.length]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchesType = !selectedFilter.startsWith('type:')
        || item.type === selectedFilter.slice(5);
      const matchesCategory = !selectedFilter.startsWith('category:')
        || item.category.toLowerCase() === selectedFilter.slice(9).toLowerCase();
      return matchesType && matchesCategory && (!normalizedQuery || item.searchableText.includes(normalizedQuery));
    });
  }, [allItems, query, selectedFilter]);

  const handleSelect = (item: BrowseItem) => {
    if (item.type === 'service') setSelectedService(item.data);
    if (item.type === 'gallery') setSelectedGalleryItem(item.data);
    if (item.type === 'product') setSelectedProduct(item.data);
  };

  const isLoading = isInitialLoading || isFetching || isServicesLoading || isProductsLoading || isGalleryLoading;
  if (!allItems.length && isLoading) {
    return <div className="min-h-screen bg-slate-50 pt-20"><GallerySectionShimmer divisionName="Mahdev catalog" /></div>;
  }

  const filterButtonClass = (value: string) => `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
    selectedFilter === value ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;
  const selectedFilterLabel = selectedFilter.startsWith('category:')
    ? selectedFilter.slice('category:'.length)
    : selectedFilter.startsWith('type:')
      ? KIND_LABELS[selectedFilter.slice('type:'.length) as BrowseType]
      : 'All items';
  const updateFilter = (filter: string) => {
    setSelectedFilter(filter);
    setIsCategoryDrawerOpen(false);
    if (filter === 'all') {
      onNavigate('/services');
      return;
    }

    const pathSlug = filter.startsWith('category:')
      ? toCategorySlug(filter.slice('category:'.length))
      : {
          service: 'type-services',
          gallery: 'type-gallery',
          product: 'type-products',
        }[filter.slice('type:'.length) as BrowseType];
    onNavigate(`/services%${pathSlug}`);
  };
  const categoryOptions = (
    <>
      <nav aria-label="Catalog categories" className="space-y-1">
        <button type="button" className={filterButtonClass('all')} onClick={() => updateFilter('all')}>
          <span>All items</span><span className="text-xs text-slate-400">{allItems.length}</span>
        </button>
        {(['service', 'gallery', 'product'] as BrowseType[]).map((type) => {
          const count = allItems.filter((item) => item.type === type).length;
          return (
            <button key={type} type="button" className={filterButtonClass(`type:${type}`)} onClick={() => updateFilter(`type:${type}`)}>
              <span>{KIND_LABELS[type]}</span><span className="text-xs text-slate-400">{count}</span>
            </button>
          );
        })}
      </nav>
      {categories.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Categories</h3>
          <nav aria-label="Item category filters" className="max-h-[55vh] space-y-1 overflow-y-auto">
            {categories.map(([category, count]) => {
              const filter = `category:${category}`;
              return (
                <button key={category} type="button" className={filterButtonClass(filter)} onClick={() => updateFilter(filter)}>
                  <span className="truncate">{category}</span><span className="text-xs text-slate-400">{count}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="sticky top-24 hidden self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-slate-900">Browse categories</h2>
            </div>
            {categoryOptions}
          </aside>

          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex w-full items-center justify-between gap-3 lg:w-auto">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{filteredItems.length}</span> items
                  {query.trim() && <> matching <span className="font-medium text-slate-900">“{query.trim()}”</span></>}
                </p>
                <button
                  type="button"
                  onClick={() => setIsCategoryDrawerOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isCategoryDrawerOpen}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 lg:hidden"
                >
                  <Filter className="h-4 w-4" />
                  Categories
                  <span className="max-w-24 truncate text-xs font-medium text-slate-500">{selectedFilterLabel}</span>
                </button>
              </div>
              {(query || selectedFilter !== 'all') && (
                <button type="button" onClick={() => { setQuery(''); updateFilter('all'); }} className="text-xs font-semibold text-blue-700 hover:text-blue-900">
                  Clear filters
                </button>
              )}
            </div>
            {filteredItems.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => <BrowseCard key={`${item.type}:${item.id}`} item={item} onSelect={handleSelect} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                <Search className="mx-auto mb-3 h-7 w-7 text-slate-300" />
                <h2 className="font-semibold text-slate-900">No matching items</h2>
                <p className="mt-1 text-sm text-slate-500">Try a different keyword or clear the selected category.</p>
                <button type="button" onClick={() => { setQuery(''); updateFilter('all'); }} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Show all items
                </button>
              </div>
            )}
          </section>
        </div>
      </SectionContainer>

      {isCategoryDrawerOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden" role="presentation" onClick={() => setIsCategoryDrawerOpen(false)}>
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-categories-title"
            className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col overflow-y-auto bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-700" />
                <h2 id="mobile-categories-title" className="font-editorial text-xl font-semibold text-slate-950">Categories</h2>
              </div>
              <button type="button" onClick={() => setIsCategoryDrawerOpen(false)} aria-label="Close categories" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            {categoryOptions}
          </aside>
        </div>
      )}

      {selectedProduct && (
        <CatalogProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectRelated={setSelectedProduct} />
      )}

      {selectedService && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label={selectedService.title || selectedService.name} onClick={() => setSelectedService(null)}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="relative aspect-[16/9] bg-slate-100">
              {((selectedService.images || []).filter(Boolean)[0] || selectedService.imageUrl) && (
                <ImageWithShimmer src={(selectedService.images || []).filter(Boolean)[0] || selectedService.imageUrl} alt={selectedService.title || selectedService.name} className="absolute inset-0" />
              )}
              <button type="button" onClick={() => setSelectedService(null)} className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white" aria-label="Close service details"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{selectedService.category || selectedService.divisionName}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">{selectedService.title || selectedService.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedService.description}</p>
              {!!selectedService.features?.length && (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {selectedService.features.slice(0, 6).map((feature, index) => <li key={`${feature}-${index}`} className="flex items-start gap-2 text-xs text-slate-700"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />{feature}</li>)}
                </ul>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-900">{selectedService.startingPrice || selectedService.price ? `From ${formatCurrency(Number(selectedService.startingPrice || selectedService.price), 'LKR')}` : 'Contact for pricing'}</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openWhatsAppInquiry({ title: selectedService.title || selectedService.name, category: selectedService.category, divisionName: selectedService.divisionName, serviceId: selectedService.id, description: selectedService.description, type: 'service' })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-3.5 w-3.5" />Ask</button>
                  <button type="button" onClick={() => { setSelectedService(null); onNavigate(`/book/service/${selectedService.id}`); }} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Book <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedGalleryItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-4" role="dialog" aria-modal="true" aria-label={selectedGalleryItem.title} onClick={() => setSelectedGalleryItem(null)}>
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setSelectedGalleryItem(null)} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white" aria-label="Close gallery details"><X className="h-4 w-4" /></button>
            <div className="relative max-h-[65vh] min-h-48 w-full bg-slate-950">
              <ImageWithShimmer src={selectedGalleryItem.images?.[0] || selectedGalleryItem.mediaUrl || selectedGalleryItem.url} alt={selectedGalleryItem.title} className="absolute inset-0" imageClassName="!object-contain" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{selectedGalleryItem.category || selectedGalleryItem.tag}</p><h2 className="mt-1 font-semibold text-slate-900">{selectedGalleryItem.title}</h2><p className="mt-1 text-xs text-slate-500">{selectedGalleryItem.caption}</p></div>
              <button type="button" onClick={() => openWhatsAppInquiry({ title: selectedGalleryItem.title, category: selectedGalleryItem.category || selectedGalleryItem.tag, itemId: selectedGalleryItem.id, divisionName: String(selectedGalleryItem.division), description: selectedGalleryItem.caption, type: 'gallery' })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><MessageCircle className="h-3.5 w-3.5" />Ask on WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
