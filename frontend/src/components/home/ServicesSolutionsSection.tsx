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

/** Service and gallery cards use the same 4:5 image proportion as the full gallery. */
const Spotlight: React.FC<SpotlightProps> = ({ items, onNavigate }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:auto-rows-[230px] lg:grid-cols-4">
      {items.map((item, index) => (
        <a
          key={item.id}
          href={item.path}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            onNavigate(item.path);
          }}
          aria-label={`Explore ${item.title}`}
          className={`group relative block overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#861F31] ${
            index === 0
              ? 'col-span-2 aspect-[4/3] lg:row-span-2 lg:aspect-auto'
              : 'aspect-[4/5] lg:aspect-auto'
          }`}
        >
          <BlurredImageFrame
            src={item.image}
            alt={item.imageAlt}
            className="absolute inset-0 h-full w-full"
            imageClassName="transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" aria-hidden="true" />
          <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 p-3 text-center sm:p-4">
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-white/75 sm:block">{item.category}</span>
            <span className="line-clamp-2 w-full break-words text-sm font-bold leading-5 sm:text-base">{item.title}</span>
            <span className="line-clamp-2 hidden text-xs leading-4 text-white/85 lg:block">{item.description}</span>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold">
              <span className="hidden sm:inline">Explore</span>
              <ArrowUpRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
            </span>
          </span>
        </a>
      ))}
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
