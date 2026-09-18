import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Filter,
  Sparkles,
  Search,
  ChevronRight,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  MessageCircle,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, Body, Caption } from '../components/ui/Heading';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IconRenderer } from '../components/ui/IconRenderer';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../components/motion/MotionWrappers';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DataLoadingOverlay } from '../components/common/DataLoadingOverlay';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { DivisionId } from '../types';
import { openWhatsAppInquiry } from '../utils/whatsapp';
import { getRentalAssetCount } from '../utils/assetMetrics';

interface ServicesViewProps {
  onNavigate: (route: string) => void;
  initialDivision?: DivisionId | 'all';
}

const ServiceCardItem: React.FC<{
  service: any;
  idx: number;
  onNavigate: (route: string) => void;
}> = ({ service, idx, onNavigate }) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const serviceImages: string[] = useMemo(() => {
    if (Array.isArray(service.images) && service.images.length > 0) {
      return service.images.filter(Boolean).slice(0, 5);
    }
    const single = service.imageUrl || service.image;
    return single ? [single] : [];
  }, [service]);

  const divId = (service.divisionId || service.division || 'sws') as DivisionId;
  const divConfig = DIVISIONS[divId];
  const divRoute = (divConfig && divConfig.route) || `/${divId}`;
  const divisionBadgeText =
    service.divisionName ||
    (divConfig && divConfig.shortName) ||
    (divId ? String(divId).toUpperCase() : 'ENTERPRISE');

  return (
    <div className="min-w-[85vw] sm:min-w-0 snap-center shrink-0 sm:shrink">
      <ScrollReveal direction="up" delay={idx * 0.04}>
        <TiltCard maxTilt={5} className="h-full">
          <div className="group relative flex flex-col justify-between rounded-2xl bg-white border border-purple-100/90 p-5 sm:p-6 shadow-xs hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 h-full">
            {service.popular && (
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Popular
                </span>
              </div>
            )}

            <div>
              {/* Multi-Image Display (Max 5 images) */}
              {serviceImages.length > 0 && (
                <div className="relative mb-4 rounded-xl overflow-hidden aspect-[16/10] bg-purple-50/50 border border-purple-100">
                  <img
                    src={serviceImages[activeImgIdx] || serviceImages[0]}
                    alt={service.title || service.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {serviceImages.length > 1 && (
                    <>
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
                              activeImgIdx === dIdx ? 'w-4 bg-purple-400' : 'w-1.5 bg-white/60 hover:bg-white'
                            }`}
                            title={`Photo ${dIdx + 1}`}
                          />
                        ))}
                      </div>
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {activeImgIdx + 1} / {serviceImages.length}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Division & Category Badges */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <IconRenderer name={service.iconName || 'Sparkles'} className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block">
                    {divisionBadgeText}
                  </span>
                  <span className="text-xs text-slate-500">
                    {service.badge || 'Enterprise Grade'}
                  </span>
                </div>
              </div>

              {/* Service Title */}
              <h3 className="font-display text-lg font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                {service.title || service.name}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {service.description}
              </p>

              {/* Key Features */}
              {service.features && service.features.length > 0 && (
                <div className="space-y-1.5 mb-5 pt-3 border-t border-purple-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    What's Included:
                  </span>
                  {service.features.slice(0, 4).map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feature}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-purple-50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Pricing / SLA:</span>
                <span className="font-bold text-slate-900">
                  {service.turnaroundTime ||
                    (service.startingPrice || service.price
                      ? `LKR ${(service.startingPrice || service.price).toLocaleString()}`
                      : 'Custom Scope')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate(divRoute)}
                  className="text-[11px] px-2 cursor-pointer justify-center"
                >
                  Division
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    openWhatsAppInquiry({
                      title: service.title || service.name,
                      category: service.category,
                      divisionName: divisionBadgeText,
                      imageUrl: serviceImages[activeImgIdx] || serviceImages[0],
                      price: service.startingPrice || service.price,
                      description: service.description,
                      type: 'service',
                    });
                  }}
                  title="Send WhatsApp inquiry with image to 0750928078"
                  className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-2 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white/20 shrink-0" />
                  <span>WhatsApp</span>
                </button>
                <Button
                  size="sm"
                  variant="electric"
                  onClick={() => onNavigate(`/book/service/${service.id}`)}
                  rightIcon={<Calendar className="w-3 h-3" />}
                  className="text-[11px] px-2 cursor-pointer justify-center"
                >
                  Book
                </Button>
              </div>
            </div>
          </div>
        </TiltCard>
      </ScrollReveal>
    </div>
  );
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  onNavigate,
  initialDivision = 'all',
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>(initialDivision);
  const [searchQuery, setSearchQuery] = useState('');
  const { services, companySettings, siteSettings, divisions, products, isInitialLoading, isFetching } = useFirestoreDataContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const skuParam = params.get('sku') || params.get('packageSku') || params.get('q');
    if (skuParam) {
      setSearchQuery(skuParam);
    }
  }, []);

  const rentalCount = getRentalAssetCount(
    products,
    (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (services.length === 0 && (isInitialLoading || isFetching)) {
    return (
      <div className="pt-28 pb-24 min-h-[60vh] flex items-center justify-center bg-white">
        <DataLoadingOverlay
          message="Loading services..."
          subMessage="Curating enterprise solutions..."
        />
      </div>
    );
  }

  const orderedDivisions = React.useMemo(() => {
    if (divisions && divisions.length > 0) {
      return divisions
        .filter((d) => d.status !== 'inactive')
        .map((d) => {
          const config = (DIVISIONS as any)[d.id] || DIVISION_LIST.find((item) => item.id === d.id) || {};
          return {
            ...config,
            id: d.id,
            name: d.name || config.name,
            shortName: config.shortName || d.name,
            tagline: d.hero?.subtitle || config.tagline || '',
            route: config.route || `/${d.slug || d.id}`,
            iconName: config.iconName || 'Building',
          };
        });
    }
    return DIVISION_LIST;
  }, [divisions]);

  const activeServices = useMemo(() => {
    return services.filter((s) => (s as any).status !== 'archived');
  }, [services]);

  const filteredServices = useMemo(() => {
    return activeServices.filter((srv) => {
      const div = (srv.divisionId || srv.division || '') as DivisionId;
      const matchesDivision = selectedDivision === 'all' || div === selectedDivision;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        (srv as any).sku?.toLowerCase().includes(query) ||
        srv.name?.toLowerCase().includes(query) ||
        srv.title?.toLowerCase().includes(query) ||
        srv.description?.toLowerCase().includes(query) ||
        ((srv as any).packages as any[])?.some(
          (p: any) =>
            p?.name?.toLowerCase().includes(query) ||
            p?.sku?.toLowerCase().includes(query) ||
            p?.title?.toLowerCase().includes(query)
        ) ||
        srv.features?.some((f) => f.toLowerCase().includes(query));

      return matchesDivision && matchesQuery;
    });
  }, [activeServices, selectedDivision, searchQuery]);

  const divisionTabs: { id: DivisionId | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All Services', count: activeServices.length },
    {
      id: 'sws',
      label: 'SWS Events',
      count: activeServices.filter((s) => (s.divisionId || s.division) === 'sws').length,
    },
    {
      id: 'u1',
      label: 'U1 Cinema',
      count: activeServices.filter((s) => (s.divisionId || s.division) === 'u1').length,
    },
    {
      id: 'it',
      label: 'IT & Cloud',
      count: activeServices.filter((s) => (s.divisionId || s.division) === 'it').length,
    },
    {
      id: 'travels',
      label: 'Travels',
      count: activeServices.filter((s) => (s.divisionId || s.division) === 'travels').length,
    },
    {
      id: 'mart',
      label: 'Mart & Hardware',
      count: activeServices.filter((s) => (s.divisionId || s.division) === 'mart').length,
    },
  ];

  return (
    <div className="w-full flex flex-col pt-20 sm:pt-24 pb-12 bg-white">
      <SEOHead
        title="Enterprise Services & Solutions"
        description="Explore comprehensive services and turn-key packages across all five Mahdev business divisions: SWS Events, U1 Studio, IT Solutions, Travels, and Online Mart."
        canonicalUrl="https://mahdev.lk/services"
      />

      {/* 1. Header Banner */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <ScrollReveal direction="up">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="electric" size="sm">
                Integrated Solutions Catalog
              </Badge>
              <span className="text-xs font-semibold text-slate-500">
                5 Autonomous Divisions • Unified SLAs
              </span>
            </div>
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Enterprise Services & Solutions
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              From landmark event productions and high-end cinematography to enterprise cloud architectures, bespoke luxury travel, and certified hardware procurement.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* 2. Filter & Search Bar with Mobile Horizontal Scroll */}
      <SectionContainer background="white" paddingY="md" hasBorderBottom>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Division Filter Pills - Horizontal Scroll on Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 flex-nowrap md:flex-wrap">
            {divisionTabs.map((tab) => (
              <button
                key={tab.id}
                id={`services-filter-tab-${tab.id}`}
                onClick={() => setSelectedDivision(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedDivision === tab.id
                    ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedDivision === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[240px] max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services or features..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0052FF] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </SectionContainer>

      {/* 3. Services Grid / Mobile Horizontal Swipe Track */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">
              No matching services found
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We couldn't find any services matching "{searchQuery}". Try clearing your search query or selecting a different division tab.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedDivision('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold text-slate-500">
                Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
              </p>
              <span className="text-[11px] text-slate-400 sm:hidden">
                Swipe left / right on mobile →
              </span>
            </div>

            {/* Responsive Grid on Desktop / Smooth Horizontal Carousel on Mobile */}
            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible">
              {filteredServices.map((service, idx) => (
                <ServiceCardItem
                  key={service.id}
                  service={service}
                  idx={idx}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}
      </SectionContainer>

      {/* 4. Event Management Rental Inventory Spotlight */}
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="electric" size="sm" className="bg-blue-600/80 text-white border-blue-400/30">
                  SWS Events Rental Hub
                </Badge>
                <span className="text-xs font-semibold text-blue-300">{rentalCount} Units in Active Stock</span>
              </div>
              <H2 className="text-white text-2xl sm:text-3xl font-display font-bold tracking-tight mb-3">
                Event Equipment & Luxury Furniture Rentals
              </H2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Need individual items or bulk dry-hire? Our event division provides complete rental inventory: Chiavari & banquet chairs, VIP lounge sofas, heavy-duty aluminium stage trussing, line-array concert audio, 4K outdoor LED video walls, silent power generators, and waterproof marquee canopies across Sri Lanka.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">🪑 Chairs & Sofas</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">🎪 Marquees & Tents</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">🔊 Line Array Sound</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">📺 4K LED Walls</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">⚡ Stage Truss & Generators</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
              <Button
                variant="electric"
                size="md"
                onClick={() => onNavigate('/sws')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-lg shadow-blue-500/25 justify-center"
              >
                Browse SWS Rental Inventory
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('/contact')}
                className="w-full sm:w-auto border-slate-700 text-slate-200 hover:bg-white/10 hover:text-white justify-center"
              >
                Request Rental Quotation
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* 5. Division Spotlight Matrix */}
      <SectionContainer background="white" paddingY="lg" hasBorderBottom>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Caption className="text-[#0052FF] mb-2 block">Direct Portals</Caption>
          <H2 className="text-slate-900 mb-3">Explore Dedicated Division Portals</H2>
          <Body className="text-slate-600 text-sm">
            Visit the dedicated microsites for in-depth technical specs, sample reels, hardware inventories, and division contacts.
          </Body>
        </div>

        {/* Mobile Horizontal Scrollable Division Cards */}
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:gap-4 sm:overflow-visible">
          {orderedDivisions.map((division) => (
            <div
              key={division.id}
              onClick={() => onNavigate(division.route)}
              className="min-w-[220px] sm:min-w-0 snap-center p-4 rounded-xl bg-white border border-slate-200 hover:border-[#0052FF] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group shrink-0"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center mb-3 group-hover:bg-[#0052FF] group-hover:text-white transition-colors">
                  <IconRenderer name={division.iconName} className="w-5 h-5" />
                </div>
                <h4 className="font-display font-bold text-sm text-slate-900 mb-1 group-hover:text-[#0052FF] transition-colors">
                  {division.shortName}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {division.tagline}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#0052FF]">
                <span>Visit Division</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>

      {/* 5. Call to Action Banner */}
      <CallToActionSection
        onPrimaryClick={() => onNavigate('/contact')}
        onSecondaryClick={() => onNavigate('/catalog')}
      />
    </div>
  );
};
