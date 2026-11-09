import React, { useState, useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { HorizontalScrollArea } from '../ui/HorizontalScrollArea';
import { H2 } from '../ui/Heading';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISIONS } from '../../config/divisions';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { ServicesSectionShimmer } from '../common/ServicesSectionShimmer';
import { newestListedFirst } from '../../utils/listingOrder';
import { getRecordImageAlt } from '../../config/imageAlt';
import { getRelatedGalleryImages } from '../../utils/homeShowcaseImages';
import { HomeExpandableShowcase } from './HomeExpandableShowcase';

interface FeaturedServicesSectionProps {
  onNavigate: (route: string) => void;
  onInquireService?: (service: any) => void;
  publishedOnly?: boolean;
  showEmptyState?: boolean;
}

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = (props) => {
  const {
    services,
    homepageConfig,
    isServicesLoading,
    isInitialLoading,
    isFetching,
    error,
    refreshAll,
  } = useFirestoreDataContext();
  const { publishedOnly = false, showEmptyState = false } = props;

  if (homepageConfig.featuredServices && !homepageConfig.featuredServices.enabled) {
    return null;
  }

  // Admin sort order, with newly added services shown first.
  const activeServices = newestListedFirst(services
    .filter((service) =>
      !publishedOnly ||
      (
        service.isPublished !== false &&
        (service as any).status !== 'draft' &&
        (service as any).status !== 'inactive' &&
        (service as any).status !== 'archived'
      )
    )
    .filter((s) => (s as any).status !== 'archived')
    .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0)));

  if (activeServices.length === 0) {
    if (isServicesLoading || isInitialLoading || isFetching) {
      return <ServicesSectionShimmer divisionName="Featured" />;
    }
    if (error) {
      return (
        <SectionContainer background="subtle" paddingY="xl">
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>Services could not be loaded. Please retry.</span>
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
    if (showEmptyState) {
      return (
        <SectionContainer background="none" paddingY="md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="font-display text-xl font-bold text-slate-900">Featured Services</h2>
            <p className="mt-2 text-sm text-slate-600">
              No services are currently published. Please check back soon.
            </p>
            <Button className="mt-4" onClick={() => props.onNavigate('/services')}>
              Browse services
            </Button>
          </div>
        </SectionContainer>
      );
    }
    return null;
  }

  return <FeaturedServicesSectionContent {...props} activeServices={activeServices} />;
};

const FeaturedServicesSectionContent: React.FC<
  FeaturedServicesSectionProps & { activeServices: any[] }
> = ({ onNavigate, activeServices }) => {
  const { homepageConfig, divisions, gallery } = useFirestoreDataContext();

  const [activeTab, setActiveTab] = useState<string>('all');

  const filterTabs = useMemo(() => {
    const tabs = [{ id: 'all', label: 'All Services' }];
    const seen = new Set<string>(['all']);

    if (divisions && divisions.length > 0) {
      divisions.forEach((d) => {
        const rawId = (d.slug || d.id || '').toLowerCase();
        const tabId =
          rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema'
            ? 'u1'
            : rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
            ? 'sws'
            : rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it'
            ? 'it'
            : rawId === 'travels' || rawId === 'mahdev-travels'
            ? 'travels'
            : rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart'
            ? 'mart'
            : rawId;

        if (!tabId || seen.has(tabId)) return;
        seen.add(tabId);
        tabs.push({
          id: tabId,
          label: d.shortName || d.name,
        });
      });
    } else {
      tabs.push(
        { id: 'sws', label: 'Events & Decor' },
        { id: 'u1', label: 'Photography & Film' },
        { id: 'it', label: 'Software & Cloud' },
        { id: 'travels', label: 'Travel Packages' },
        { id: 'mart', label: 'Online Hardware' }
      );
    }
    return tabs;
  }, [divisions]);

  const filteredServices = useMemo(() => {
    if (activeTab === 'all') return activeServices;
    return activeServices.filter((srv) => {
      const dId = srv.divisionId || srv.division;
      if (dId === activeTab) return true;
      const matched = divisions?.find((d) => d.id === activeTab || d.slug === activeTab);
      if (matched && (dId === matched.id || dId === matched.slug)) return true;
      return false;
    });
  }, [activeServices, activeTab, divisions]);

  const sectionMeta = homepageConfig.featuredServices || {
    badge: 'Enterprise Solutions',
    title: 'Featured Services & Capabilities',
    subtitle: 'Explore flagship services delivered across our 5 specialized enterprise divisions.',
  };

  return (
    <div className="relative">
      <ParallelWatermark text="04 // SERVICES" />
      <SectionContainer
        id="featured-services"
        className="home-showcase-section"
        background="white"
        paddingY="xl"
        hasBorderBottom
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <H2 className="text-slate-900">{sectionMeta.title || 'Featured Services & Capabilities'}</H2>
            {sectionMeta.subtitle && (
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{sectionMeta.subtitle}</p>
            )}
          </div>

          {/* Division Filter Tabs */}
          <HorizontalScrollArea
            ariaLabel="Service divisions"
            hideControlsAt="sm"
            className="max-w-full -mx-4 px-4 sm:mx-0 sm:px-0"
            contentClassName="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 flex-nowrap overflow-x-auto no-visible-scrollbar sm:flex-wrap sm:overflow-visible"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                id={`service-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </HorizontalScrollArea>
        </div>

        {filteredServices.length === 0 ? (
          <div className="relative z-10 rounded-2xl border border-dashed border-purple-200 p-12 text-center bg-purple-50/20 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">Custom Division Solutions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct consultation and bespoke turnkey packages are available across all 5 Mahdev divisions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => onNavigate('/contact')}
                className="text-xs cursor-pointer"
              >
                Contact Executive Desk
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate('/services')}
                className="text-xs cursor-pointer"
              >
                Browse All Services
              </Button>
            </div>
          </div>
        ) : (
          <HomeExpandableShowcase
            items={filteredServices.slice(0, 5).map((service) => {
              const title = service.title || service.name;
              const divisionId = service.divisionId || service.division || '';
              const division = divisions?.find((item) =>
                item.id === divisionId || item.slug === divisionId
              );
              const fallback = (DIVISIONS as any)[divisionId];
              const normalizedDivisionId = division?.slug || division?.id || fallback?.id || divisionId || 'sws';
              const primaryImage = (
                Array.isArray(service.images) ? service.images.find(Boolean) : undefined
              ) || service.imageUrl || '';
              const category = service.category || 'Service';
              const images = [
                primaryImage,
                ...getRelatedGalleryImages(gallery, category, normalizedDivisionId),
              ].filter((image, index, candidates) => image && candidates.indexOf(image) === index);
              return {
                id: service.id,
                title,
                category,
                description: service.description || 'Explore this service from Mahdev.',
                images,
                imageAlt: getRecordImageAlt(service, title),
                meta: service.divisionName || division?.shortName || division?.name || fallback?.shortName,
                divisionId: normalizedDivisionId,
                divisionRoute: division?.route || fallback?.route,
              };
            })}
            onNavigate={onNavigate}
            viewAllRoute="/services"
            viewAllLabel="View all services"
            emptyMessage="No services are available in this division yet."
          />
        )}
      </SectionContainer>
    </div>
  );
};
