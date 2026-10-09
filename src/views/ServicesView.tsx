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
import { ServicesSectionShimmer } from '../components/common/ServicesSectionShimmer';
import { DIVISIONS, DIVISION_LIST } from '../config/divisions';
import { DivisionId } from '../types';
import { normalizeDivisionId } from '../services/firestore/divisions';
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
  const serviceImage: string = useMemo(() => {
    if (Array.isArray(service.images) && service.images.length > 0) {
      return service.images[0];
    }
    return service.imageUrl || service.image || '';
  }, [service]);

  const divId = (service.divisionId || service.division || 'sws') as DivisionId;
  const divConfig = DIVISIONS[divId];
  const divRoute = (divConfig && divConfig.route) || `/${divId}`;
  const divisionBadgeText =
    service.divisionName ||
    (divConfig && divConfig.shortName) ||
    (divId ? String(divId).toUpperCase() : 'ENTERPRISE');

  return (
    <div className="w-full">
      <div className="group relative flex flex-col md:flex-row gap-6 justify-between rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all duration-200">
        {/* Service Photo - Clean, without overlay badges or clutter */}
        {serviceImage && (
          <div className="w-full md:w-64 lg:w-72 h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 shrink-0">
            <img
              src={serviceImage}
              alt={service.title || service.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              loading="lazy"
            />
          </div>
        )}

        {/* Service Information */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Division / Category Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                {service.category || divisionBadgeText}
              </span>
            </div>

            {/* Service Title */}
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {service.title || service.name}
            </h3>

            {/* Clean Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {service.description}
            </p>

            {/* Key Features List */}
            {service.features && service.features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 pt-3 border-t border-slate-100">
                {service.features.map((feature: string, fIdx: number) => (
                  <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Pricing / SLA</span>
              <span className="text-sm font-bold text-slate-900">
                {service.turnaroundTime ||
                  (service.startingPrice || service.price
                    ? `LKR ${(service.startingPrice || service.price).toLocaleString()}`
                    : 'Custom Scope')}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate(divRoute)}
                className="text-xs px-3 cursor-pointer"
              >
                Division Details
              </Button>
              <button
                type="button"
                onClick={() => {
                  openWhatsAppInquiry({
                    title: service.title || service.name,
                    category: service.category,
                    divisionName: divisionBadgeText,
                    imageUrl: serviceImage,
                    price: service.startingPrice || service.price,
                    description: service.description,
                    type: 'service',
                  });
                }}
                title="Send WhatsApp inquiry"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 fill-white/20 shrink-0" />
                <span>WhatsApp</span>
              </button>
              <Button
                size="sm"
                variant="electric"
                onClick={() => onNavigate(`/book/service/${service.id}`)}
                rightIcon={<Calendar className="w-3.5 h-3.5" />}
                className="text-xs px-3.5 cursor-pointer font-bold"
              >
                Book
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  onNavigate,
  initialDivision = 'all',
}) => {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all Western' | 'all'>(initialDivision);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
      <div className="pt-24 pb-20 min-h-[60vh] bg-white">
        <ServicesSectionShimmer divisionName="Enterprise" />
      </div>
    );
  }

  const activeServices = useMemo(() => {
    return services.filter((s) => (s as any).status !== 'archived');
  }, [services]);

  const orderedDivisions = React.useMemo(() => {
    if (divisions && divisions.length > 0) {
      const seen = new Set<string>();
      const list = [];
      for (const d of divisions) {
        if (d.status === 'inactive') continue;
        const shortId = normalizeDivisionId(d.id || d.slug || '').shortId;
        if (!shortId || seen.has(shortId)) continue;
        seen.add(shortId);

        const config = (DIVISIONS as any)[shortId] || DIVISION_LIST.find((item) => item.id === shortId) || {};
        list.push({
          ...config,
          id: shortId,
          name: d.name || config.name,
          shortName: config.shortName || d.name,
          tagline: d.hero?.subtitle || config.tagline || '',
          route: config.route || `/${d.slug || shortId}`,
          iconName: config.iconName || 'Building',
        });
      }

      if (list.length < 5) {
        for (const defaultItem of DIVISION_LIST) {
          if (!seen.has(defaultItem.id)) {
            seen.add(defaultItem.id);
            list.push(defaultItem);
          }
        }
      }
      return list;
    }
    return DIVISION_LIST;
  }, [divisions]);

  // Extract real available categories for current division filter
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    activeServices.forEach((s) => {
      const divMatch = selectedDivision === 'all' || (s.divisionId || s.division) === selectedDivision;
      if (divMatch) {
        const cat = s.category || (s as any).categoryId;
        if (cat && typeof cat === 'string' && cat.trim()) {
          set.add(cat.trim());
        }
      }
    });
    return Array.from(set);
  }, [activeServices, selectedDivision]);

  // When division changes, reset category selection to 'all'
  const handleSelectDivision = (divId: DivisionId | 'all') => {
    setSelectedDivision(divId);
    setSelectedCategory('all');
  };

  const filteredServices = useMemo(() => {
    return activeServices.filter((srv) => {
      const div = (srv.divisionId || srv.division || '') as DivisionId;
      const matchesDivision = selectedDivision === 'all' || div === selectedDivision;
      const matchesCategory =
        selectedCategory === 'all' ||
        srv.category === selectedCategory ||
        (srv as any).categoryId === selectedCategory;

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

      return matchesDivision && matchesCategory && matchesQuery;
    });
  }, [activeServices, selectedDivision, selectedCategory, searchQuery]);

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
            <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              Enterprise Services & Solutions
            </H1>
            <Body className="text-slate-600 text-base sm:text-lg">
              From landmark event productions and high-end cinematography to enterprise cloud architectures, bespoke luxury travel, and certified hardware procurement.
            </Body>
          </div>
        </ScrollReveal>
      </SectionContainer>

      {/* 2. Filter & Category Bar */}
      <SectionContainer background="white" paddingY="md" hasBorderBottom>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Division Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 flex-nowrap md:flex-wrap">
              {divisionTabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`services-filter-tab-${tab.id}`}
                  onClick={() => handleSelectDivision(tab.id as any)}
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

          {/* Sub-Category Filter Pills: Clean web view selection */}
          {availableCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 flex-nowrap sm:flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
                Categories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                All ({filteredServices.length})
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </SectionContainer>

      {/* 3. Services Clean Web View: Displayed One by One */}
      <SectionContainer background="white" paddingY="xl" hasBorderBottom>
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0052FF] flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">
              No services found
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {searchQuery
                ? `We couldn't find any services matching "${searchQuery}".`
                : 'No services are currently listed in this category.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedDivision('all');
                setSelectedCategory('all');
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
            </div>

            {/* Clean one-by-one sequential layout for Web and Mobile with smooth transition */}
            <div
              key={`${selectedDivision}-${selectedCategory}`}
              className="space-y-4 sm:space-y-6 transition-all duration-300"
            >
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
