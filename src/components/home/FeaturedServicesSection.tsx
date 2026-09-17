import React, { useState, useRef, useMemo } from 'react';
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

interface FeaturedServicesSectionProps {
  onNavigate: (route: string) => void;
  onInquireService?: (service: any) => void;
}

export const FeaturedServicesSection: React.FC<FeaturedServicesSectionProps> = (props) => {
  const { services, homepageConfig, isInitialLoading, isFetching } = useFirestoreDataContext();

  if (homepageConfig.featuredServices && !homepageConfig.featuredServices.enabled) {
    return null;
  }

  const activeServices = services
    .filter((s) => (s as any).status !== 'archived')
    .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0));

  if (activeServices.length === 0) {
    if (isInitialLoading || isFetching) {
      return (
        <SectionContainer background="white" paddingY="lg">
          <DataLoadingOverlay
            message="Loading services..."
            subMessage="Curating featured enterprise solutions..."
          />
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
  const [activeImgIdx, setActiveImgIdx] = useState(0);

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

  return (
    <motion.div
      key={service.id}
      style={!reducedMotion && !isTouch ? { y: colTransform } : undefined}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col justify-between rounded-2xl bg-white border border-purple-100/90 p-5 sm:p-6 shadow-xs hover:border-purple-400 hover:shadow-md transition-all duration-200 h-full"
    >
      <div>
        {serviceImages.length > 0 && (
          <div className="mb-4 aspect-16/9 rounded-xl overflow-hidden bg-purple-50/50 border border-purple-100 relative">
            <img
              src={serviceImages[activeImgIdx] || serviceImages[0]}
              alt={service.title || service.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {serviceImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-full z-10">
                {serviceImages.map((_, dIdx) => (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImgIdx(dIdx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeImgIdx === dIdx ? 'w-3.5 bg-purple-400' : 'w-1.5 bg-white/60 hover:bg-white'
                    }`}
                    title={`Photo ${dIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <IconRenderer name={service.iconName || 'Sparkles'} className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
              {divisionBadgeText}
            </span>
          </div>
        </div>

        <h3 className="font-display text-base font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">
          {service.title || service.name}
        </h3>

        {service.features && service.features.length > 0 && (
          <div className="space-y-1.5 mb-5 pt-3 border-t border-purple-50">
            {service.features.slice(0, 3).map((feature: string, fIdx: number) => (
              <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-purple-50 flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-slate-500">
          {service.turnaroundTime || (service.startingPrice || service.price ? `From LKR ${(service.startingPrice || service.price).toLocaleString()}` : 'Direct SLA')}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate(divRoute)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          className="text-xs hover:border-purple-600 hover:text-purple-600 cursor-pointer"
        >
          View
        </Button>
      </div>
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
            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-600 mb-2 block font-semibold">
              {sectionMeta.badge || 'Enterprise Solutions'}
            </span>
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
