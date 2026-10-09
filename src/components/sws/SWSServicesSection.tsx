import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Layers,
  Tag,
} from 'lucide-react';
import { SWSService, SWS_SERVICES } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { formatCurrency } from '../../utils/currency';
import { SWSServiceCard } from './SWSServiceCard';
import { SWSServiceDetailModal } from './SWSServiceDetailModal';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';

interface SWSServicesSectionProps {
  onBookNow: (service?: SWSService) => void;
  onRequestQuote: (service?: SWSService) => void;
}

export const SWSServicesSection: React.FC<SWSServicesSectionProps> = ({
  onBookNow,
  onRequestQuote,
}) => {
  const { services: rawServices, categories: rawCategories, isDivisionServicesLoaded } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<SWSService | null>(null);

  // Dynamically resolve services from Firestore if available
  const allServices = useMemo<SWSService[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const swsServices = rawServices
        .filter((s) => isSameDivision(s.division, 'sws') || isSameDivision((s as any).divisionId, 'sws'))
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0));
      if (swsServices.length > 0) {
        return swsServices.map((s) => ({
          id: s.id,
          name: s.name,
          category: (s.category || (s as any).categoryId || 'General') as any,
          tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
          description: s.description || '',
          detailedDescription: (s as any).detailedDescription || s.description || '',
          startingPrice: typeof s.price === 'number' || typeof (s as any).startingPrice === 'number'
            ? formatCurrency(s.price || (s as any).startingPrice || 0, s.currency || 'LKR')
            : String(s.price || 'Rs. 75,000'),
          priceNote: (s as any).priceNote || 'Customized to event scale',
          imageUrl: s.images && s.images.length > 0 ? s.images[0] : (s as any).imageUrl || '',
          gallery: s.images || [],
          features: s.features || ['Professional Consultation', 'Dedicated Stage Crew'],
          specs: (s as any).specs || [],
          badge: s.badge || 'Featured Service',
        }));
      }
    }
    return [];
  }, [rawServices]);

  // Dynamically build category tabs ONLY from Admin Portal / Firestore categories
  const categories = useMemo(() => {
    // Build lookup from admin-created categories in Firestore
    const adminCatMap = new Map<string, string>();
    (rawCategories || []).forEach((c) => {
      if (c.name) {
        adminCatMap.set(c.id, c.name);
        adminCatMap.set(c.slug, c.name);
        adminCatMap.set(c.name.toLowerCase(), c.name);
      }
    });

    // Group actual services by category
    const catMap = new Map<string, { label: string; count: number }>();
    allServices.forEach((s) => {
      const rawCat = (s.category || 'General').trim();
      const resolvedLabel = adminCatMap.get(rawCat) || adminCatMap.get(rawCat.toLowerCase()) || rawCat;
      const key = rawCat.toLowerCase();
      const existing = catMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        catMap.set(key, { label: resolvedLabel, count: 1 });
      }
    });

    const list: { id: string; label: string; count: number; icon: React.ReactNode }[] = [
      { id: 'all', label: `All (${allServices.length})`, count: allServices.length, icon: <Layers className="w-3.5 h-3.5" /> },
    ];

    catMap.forEach((val, key) => {
      list.push({
        id: key,
        label: val.label,
        count: val.count,
        icon: <Tag className="w-3.5 h-3.5" />,
      });
    });

    return list;
  }, [allServices, rawCategories]);

  if (allServices.length === 0) {
    if (!isDivisionServicesLoaded('sws')) {
      return (
        <SectionContainer background="subtle" paddingY="xl">
          <div className="animate-pulse space-y-8">
            <div className="space-y-3">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-8 w-64 max-w-full rounded-lg bg-slate-200" />
              <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-100" />
                    <div className="h-3 w-4/5 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionContainer>
      );
    }
    return null;
  }

  const filteredServices = allServices.filter((service) => {
    const sCat = (service.category || 'general').toLowerCase();
    const matchesCategory = selectedCategory === 'all' || sCat === selectedCategory.toLowerCase();
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <H2 className="text-slate-900">
              Our Services
            </H2>
          </ScrollReveal>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Dynamic Category Filter Pills from Admin Portal (shown if more than 1 category) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Services Grid (All 13 Services Rendered) */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredServices.map((service) => (
            <SWSServiceCard
              key={service.id}
              service={service}
              onViewDetails={(s) => setActiveModalService(s)}
              onBookNow={(s) => onBookNow(s)}
              onRequestQuote={(s) => onRequestQuote(s)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No services found matching "{searchQuery}"</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-[#0052FF] font-bold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Service Detail Modal with Gallery & Specs */}
      <SWSServiceDetailModal
        service={activeModalService}
        isOpen={!!activeModalService}
        onClose={() => setActiveModalService(null)}
        onBookNow={(s) => {
          setActiveModalService(null);
          onBookNow(s);
        }}
        onRequestQuote={(s) => {
          setActiveModalService(null);
          onRequestQuote(s);
        }}
      />
    </SectionContainer>
  );
};
