import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { HorizontalScrollArea } from '../ui/HorizontalScrollArea';
import { Caption, H2 } from '../ui/Heading';
import { GallerySectionShimmer } from '../common/GallerySectionShimmer';
import { getRecordImageAlt } from '../../config/imageAlt';
import { DIVISIONS } from '../../config/divisions';
import { divisionIdFromName } from '../../utils/onlineBooking';
import { getRelatedGalleryImages } from '../../utils/homeShowcaseImages';
import { HomeExpandableShowcase } from './HomeExpandableShowcase';

interface HomeGallerySectionProps {
  onNavigate: (route: string) => void;
}

/** A premium gallery that mirrors the polished presentation used in the division pages. */
export const HomeGallerySection: React.FC<HomeGallerySectionProps> = ({ onNavigate }) => {
  const {
    gallery,
    divisions,
    isGalleryLoading,
    isInitialLoading,
    isFetching,
    error,
    refreshAll,
  } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const items = useMemo(() => gallery
    .filter((item) => item.status !== 'hidden')
    .map((item) => {
      const ownImages = (item.images?.length ? item.images : [item.mediaUrl || item.url || item.thumbnailUrl || ''])
        .filter(Boolean)
        .slice(0, 4);
      const divisionId = String((item as any).divisionId || item.division || '');
      const category = item.category || item.tag || 'Mahdev Group';
      const images = [
        ...ownImages,
        ...getRelatedGalleryImages(gallery, category, divisionId, item.id),
      ].filter((image, index, candidates) => image && candidates.indexOf(image) === index);
      const divisionKey = divisionIdFromName(divisionId) || divisionId.toLowerCase();
      const division = divisions.find((candidate) =>
        candidate.id === divisionId ||
        candidate.slug === divisionId ||
        divisionIdFromName(candidate.id) === divisionKey ||
        divisionIdFromName(candidate.slug) === divisionKey
      );
      return {
        id: item.id,
        divisionId,
        divisionRoute: division?.route || DIVISIONS[divisionKey as keyof typeof DIVISIONS]?.route,
        images,
        title: item.title || 'Mahdev Gallery',
        category,
        description: item.caption || item.seoDescription || `Discover ${item.title || 'this project'} from the Mahdev gallery.`,
        imageAlt: getRecordImageAlt(item),
        location: (item as any).location || 'Sri Lanka',
        divisionName: division?.name,
      };
    }), [divisions, gallery]);

  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    items.forEach((item) => set.add(item.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.category === selectedCategory);
  const searchedItems = filteredItems.filter((item) =>
    `${item.title} ${item.category} ${item.location} ${item.divisionName || ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const displayedItems = searchedItems.slice(0, 6);

  if (!items.length) {
    if (isGalleryLoading || isInitialLoading || isFetching) {
      return <GallerySectionShimmer divisionName="Corporate" />;
    }
    if (error) {
      return (
        <SectionContainer background="white" paddingY="xl">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>Gallery content could not be loaded. Please retry.</span>
            <button
              type="button"
              onClick={() => void refreshAll(true)}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold hover:bg-amber-100"
            >
              Retry loading
            </button>
          </div>
        </SectionContainer>
      );
    }
    return null;
  }

  return (
    <SectionContainer
      id="gallery"
      className="home-showcase-section"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Caption className="mb-2 block text-[#0052FF]">Visual Showcase</Caption>
          <H2 className="font-editorial text-slate-900">Selected Work Across Every Division</H2>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <label className="relative block w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search gallery..."
              aria-label="Search gallery"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <HorizontalScrollArea
            ariaLabel="Gallery categories"
            contentClassName="flex max-w-full gap-2 overflow-x-auto pb-1 no-visible-scrollbar"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'border-[#0052FF] bg-[#0052FF] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </HorizontalScrollArea>
        </div>
      </div>

      <HomeExpandableShowcase
        items={displayedItems.map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.description,
          images: item.images,
          imageAlt: item.imageAlt,
          meta: [item.divisionName, item.location].filter(Boolean).join(' · '),
          divisionId: item.divisionId,
          divisionRoute: item.divisionRoute,
        }))}
        onNavigate={onNavigate}
        viewAllRoute="/gallery"
        viewAllLabel="View full gallery"
        emptyMessage={`No gallery items match “${searchQuery}”.`}
      />
    </SectionContainer>
  );
};
