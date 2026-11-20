import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2 } from '../ui/Heading';
import { BlurredImageFrame } from '../common/BlurredImageFrame';
import { ServicesSectionShimmer } from '../common/ServicesSectionShimmer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { newestListedFirst } from '../../utils/listingOrder';
import { getRecordImageAlt } from '../../config/imageAlt';
import { gallerySeo, serviceSeo } from '../../config/itemSeo';

type Tab = 'services' | 'gallery';

interface SpotlightItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  path: string;
}

/** How many of the newest items each tab shows: one large card and four small ones. */
const ITEMS_PER_TAB = 5;

const TABS: Array<{ id: Tab; label: string; viewAll: string; viewAllLabel: string }> = [
  { id: 'services', label: 'Services', viewAll: '/services', viewAllLabel: 'View all services' },
  { id: 'gallery', label: 'Gallery', viewAll: '/gallery', viewAllLabel: 'View full gallery' },
];

const isLive = (record: { isPublished?: boolean; status?: string }) =>
  record.isPublished !== false && !['draft', 'inactive', 'archived', 'hidden'].includes(String(record.status));

interface SpotlightProps {
  items: SpotlightItem[];
  onNavigate: (route: string) => void;
}

/** Small clickable photo that makes its item the large one. */
const SmallCard: React.FC<{ item: SpotlightItem; onSelect: (id: string) => void }> = ({ item, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(item.id)}
    aria-label={`Show ${item.title} larger`}
    className="group relative min-h-[120px] overflow-hidden rounded-xl bg-slate-900 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#861F31] lg:min-h-[100px]"
  >
    <BlurredImageFrame
      src={item.image}
      alt={item.imageAlt}
      className="absolute inset-0 h-full w-full"
      imageClassName="transition-transform duration-500 group-hover:scale-105"
      loading="lazy"
    />
  </button>
);

/**
 * Desktop: big image top-left, two small photos beside it, two small photos under it and the title list
 * bottom-right. Phones stack them. Picking a title or small photo swaps the big image.
 */
const Spotlight: React.FC<SpotlightProps> = ({ items, onNavigate }) => {
  const [selectedId, setSelectedId] = useState(items[0].id);
  const selected = items.find((item) => item.id === selectedId) || items[0];
  const others = items.filter((item) => item.id !== selected.id);

  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(selected.path);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_auto]">
      <a
        href={selected.path}
        onClick={open}
        aria-label={`Explore ${selected.title}`}
        className="group relative block min-h-[320px] overflow-hidden rounded-2xl bg-slate-900 sm:min-h-[420px] lg:col-span-2 lg:min-h-[240px]"
      >
        <BlurredImageFrame
          key={selected.id}
          src={selected.image}
          alt={selected.imageAlt}
          className="absolute inset-0 h-full w-full"
          imageClassName="transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-5 text-center text-white sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/75">{selected.category}</span>
          <span className="w-full break-words font-display text-2xl font-bold sm:text-4xl">{selected.title}</span>
          <span className="line-clamp-2 max-w-2xl text-sm text-white/85 sm:text-base">{selected.description}</span>
          <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold">
            Explore <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </a>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-2">
        {others.slice(0, 2).map((item) => <SmallCard key={item.id} item={item} onSelect={setSelectedId} />)}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:col-span-2">
        {others.slice(2, 4).map((item) => <SmallCard key={item.id} item={item} onSelect={setSelectedId} />)}
      </div>

      <div role="group" aria-label="Choose an item to show larger" className="flex flex-col justify-center gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            aria-pressed={item.id === selected.id}
            className={`w-full min-w-0 whitespace-normal break-words rounded-lg px-3 py-2.5 text-center text-sm font-semibold leading-5 transition-colors lg:py-1.5 ${
              item.id === selected.id ? 'bg-[#861F31] text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ServicesSolutionsSectionProps {
  onNavigate: (route: string) => void;
}

/** Home "Services & Solutions": the five newest services or gallery items in a spotlight layout. */
export const ServicesSolutionsSection: React.FC<ServicesSolutionsSectionProps> = ({ onNavigate }) => {
  const { services, gallery, homepageConfig, isServicesLoading, isGalleryLoading, isInitialLoading, isFetching } =
    useFirestoreDataContext();
  const [tab, setTab] = useState<Tab>('services');

  const itemsByTab = useMemo<Record<Tab, SpotlightItem[]>>(() => {
    const serviceItems = newestListedFirst(
      [...services]
        .filter((service) => isLive(service as any))
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0)),
    )
      .map((service): SpotlightItem | null => {
        const record = service as unknown as Record<string, unknown>;
        const title = service.title || (service as any).name || 'Service';
        const image = (Array.isArray(service.images) ? service.images.find(Boolean) : undefined) || (service as any).imageUrl || '';
        if (!image) return null;
        return {
          id: service.id,
          title,
          category: service.category || 'Service',
          description: service.description || 'Explore this service from Mahdev.',
          image,
          imageAlt: getRecordImageAlt(service, title),
          path: serviceSeo(record, service.id).path,
        };
      });

    const galleryItems = newestListedFirst(gallery.filter((item) => isLive(item as any)))
      .map((item): SpotlightItem | null => {
        const record = item as unknown as Record<string, unknown>;
        const image = (item.images?.length ? item.images.find(Boolean) : undefined) || item.mediaUrl || item.url || item.thumbnailUrl || '';
        // Videos cannot be shown as a card photo.
        if (!image || /\.(mp4|webm|mov)(\?|$)/i.test(image)) return null;
        const title = item.title || 'Mahdev Gallery';
        return {
          id: item.id,
          title,
          category: item.category || item.tag || 'Mahdev Group',
          description: item.caption || item.seoDescription || `Discover ${title} from the Mahdev gallery.`,
          image,
          imageAlt: getRecordImageAlt(item),
          path: gallerySeo(record, item.id).path,
        };
      });

    const latest = (list: Array<SpotlightItem | null>) =>
      list.filter((item): item is SpotlightItem => item !== null).slice(0, ITEMS_PER_TAB);
    return { services: latest(serviceItems), gallery: latest(galleryItems) };
  }, [gallery, services]);

  if (homepageConfig.featuredServices && !homepageConfig.featuredServices.enabled) return null;

  const availableTabs = TABS.filter(({ id }) => itemsByTab[id].length > 0);
  if (!availableTabs.length) {
    return isServicesLoading || isGalleryLoading || isInitialLoading || isFetching
      ? <ServicesSectionShimmer divisionName="Featured" />
      : null;
  }
  const activeTab = availableTabs.find(({ id }) => id === tab) || availableTabs[0];

  return (
    <SectionContainer id="featured-services" className="home-showcase-section" background="white" paddingY="xl" hasBorderBottom>
      <div className="mb-8 flex flex-col items-center gap-5 lg:mb-5 lg:gap-3">
        <H2 className="text-center text-slate-900">Services &amp; Solutions</H2>
        <div role="tablist" aria-label="Show services or gallery" className="flex gap-1.5 rounded-xl border border-slate-200 bg-slate-100/90 p-1">
          {availableTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab.id === id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                activeTab.id === id ? 'border border-purple-200 bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Keyed by tab, so switching tabs starts with the newest item selected. */}
      <Spotlight key={activeTab.id} items={itemsByTab[activeTab.id]} onNavigate={onNavigate} />

      <div className="mt-6 flex justify-end lg:mt-4">
        <a
          href={activeTab.viewAll}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onNavigate(activeTab.viewAll);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#861F31] hover:underline"
        >
          {activeTab.viewAllLabel}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </SectionContainer>
  );
};
