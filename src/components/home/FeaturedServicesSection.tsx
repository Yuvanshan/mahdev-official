import React, { useState, useRef, useMemo } from 'react';
import { servicePagePath } from '../../config/itemSeo';
import { ArrowRight, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Button } from '../ui/Button';
import { IconRenderer } from '../ui/IconRenderer';
import { DivisionId } from '../../types';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { DIVISIONS } from '../../config/divisions';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';
import { DataLoadingOverlay } from '../common/DataLoadingOverlay';
import { ServicesSectionShimmer } from '../common/ServicesSectionShimmer';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { newestListedFirst } from '../../utils/listingOrder';
import { getServiceStartingPrice } from '../common/StartingPriceTag';
import { ServiceTile } from '../services/ServiceTile';
import { ServiceDetailsModal, toServiceDetails } from '../services/ServiceDetailsModal';

interface FeaturedServicesSectionProps {
  onNavigate: (route: string) => void;
  onInquireService?: (service: any) => void;
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

  if (homepageConfig.featuredServices && !homepageConfig.featuredServices.enabled) {
    return null;
  }

  // Admin sort order, with newly added services shown first.
  const activeServices = newestListedFirst(services
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
    return null;
  }

  return <FeaturedServicesSectionContent {...props} activeServices={activeServices} />;
};

const FeaturedServiceCard: React.FC<{
  service: any;
  idx: number;
  colTransform: any;
  reducedMotion: boolean;
  isTouch: boolean;
  onNavigate: (route: string) => void;
  divisions?: any[];
}> = ({ service, idx, colTransform, reducedMotion, isTouch, onNavigate, divisions }) => {
  const serviceImages: string[] = useMemo(() => {
    if (Array.isArray(service.images) && service.images.length > 0) {
      return service.images.filter(Boolean).slice(0, 5);
    }
    const single = (service as any).imageUrl || (service as any).image;
    return single ? [single] : [];
  }, [service]);

  const divId = (service.divisionId || service.division || 'sws') as string;
  const liveDiv = divisions?.find((d) => d.id === divId || d.slug === divId);
  const fallbackDiv = (DIVISIONS as any)[divId];
  const divRoute = (liveDiv && liveDiv.route) || (liveDiv && `/${liveDiv.slug || liveDiv.id}`) || (fallbackDiv && fallbackDiv.route) || `/${divId}`;
  const divisionBadgeText =
    service.divisionName ||
    (liveDiv && (liveDiv.shortName || liveDiv.name)) ||
    (fallbackDiv && fallbackDiv.shortName) ||
    divId.toUpperCase();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <motion.div
      key={service.id}
      style={!reducedMotion && !isTouch ? { y: colTransform } : undefined}
      className="h-full"
    >
      {/* Card shows only image, title and View; full details open in a modal. */}
      <ServiceTile
        title={service.title || service.name}
        images={serviceImages}
        onView={() => setIsDetailsOpen(true)}
        href={servicePagePath(service)}
        imageLoading={idx < 3 ? 'eager' : 'lazy'}
        price={getServiceStartingPrice(service)}
      />
      <ServiceDetailsModal
        service={isDetailsOpen ? toServiceDetails(service, divisionBadgeText) : null}
        onClose={() => setIsDetailsOpen(false)}
        primaryAction={{ label: `Explore ${divisionBadgeText}`, onClick: () => onNavigate(divRoute) }}
      />
    </motion.div>
  );
};

const FeaturedServicesSectionContent: React.FC<
  FeaturedServicesSectionProps & { activeServices: any[] }
> = ({ onNavigate, onInquireService, activeServices }) => {
  const { homepageConfig, divisions } = useFirestoreDataContext();
  const { reducedMotion, isTouch } = useDeviceMotion();

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

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yCol1 = useTransform(smoothProgress, [0, 1], ['-15px', '15px']);
  const yCol2 = useTransform(smoothProgress, [0, 1], ['15px', '-15px']);
  const yCol3 = useTransform(smoothProgress, [0, 1], ['-10px', '10px']);

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
    <div ref={containerRef} className="relative overflow-hidden">
      <ParallelWatermark text="04 // SERVICES" />
      <SectionContainer
        id="featured-services"
        background="white"
        paddingY="xl"
        hasBorderBottom
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="max-w-2xl">
            <H2 className="text-slate-900">{sectionMeta.title || 'Featured Services & Capabilities'}</H2>
          </div>

          {/* Division Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar max-w-full -mx-4 px-4 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
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
          </div>
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
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service, idx) => {
                const colIdx = idx % 3;
                const colTransform = colIdx === 0 ? yCol1 : colIdx === 1 ? yCol2 : yCol3;
                return (
                  <FeaturedServiceCard
                    key={service.id}
                    service={service}
                    idx={idx}
                    colTransform={colTransform}
                    reducedMotion={reducedMotion}
                    isTouch={isTouch}
                    onNavigate={onNavigate}
                    divisions={divisions}
                  />
                );
              })}
            </div>

            {/* Bottom Explore All CTA Button */}
            <div className="mt-12 text-center">
              <Button
                variant="electric"
                size="md"
                onClick={() => onNavigate('/services')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-bold cursor-pointer"
              >
                View All Services & Solution Packages
              </Button>
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
