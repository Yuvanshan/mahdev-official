import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Layers,
  Heart,
  Building2,
  Camera,
  Utensils,
  Package,
} from 'lucide-react';
import { SWS_SERVICES, SWSService } from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
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

type FilterCategory = 'all' | 'decor' | 'production' | 'media' | 'hospitality' | 'rentals' | 'packages';

export const SWSServicesSection: React.FC<SWSServicesSectionProps> = ({
  onBookNow,
  onRequestQuote,
}) => {
  const { services: rawServices } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<SWSService | null>(null);

  // Dynamically resolve services from Firestore if available
  const allServices = useMemo<SWSService[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const swsServices = rawServices
        .filter((s) => s.division === 'sws' || (s as any).divisionId === 'sws')
        .sort((a, b) => (a.order ?? (a as any).sortOrder ?? 0) - (b.order ?? (b as any).sortOrder ?? 0));
      if (swsServices.length > 0) {
        return swsServices.map((s) => ({
          id: s.id,
          name: s.name,
          category: (((s as any).category && (s as any).category !== 'all' ? (s as any).category : 'decor') as 'decor' | 'production' | 'media' | 'hospitality' | 'rentals' | 'packages'),
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

  if (allServices.length === 0) {
    return null;
  }

  const categories: { id: FilterCategory; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: `All ${allServices.length} Services`, count: allServices.length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'decor', label: 'Decorations & Theming', count: allServices.filter((s) => s.category === 'decor').length, icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'production', label: 'Stage & Production', count: allServices.filter((s) => s.category === 'production').length, icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'rentals', label: 'Equipment & Furniture Rentals', count: allServices.filter((s) => s.category === 'rentals').length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'media', label: 'Photo & Video', count: allServices.filter((s) => s.category === 'media').length, icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'hospitality', label: 'Buffet & Makeup', count: allServices.filter((s) => s.category === 'hospitality').length, icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'packages', label: 'Turnkey Packages', count: allServices.filter((s) => s.category === 'packages').length, icon: <Package className="w-3.5 h-3.5" /> },
  ];

  const filteredServices = allServices.filter((service) => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
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
            <Caption className="text-[#0052FF] mb-2 block">
              {allServices.length} Comprehensive Event Management & Rental Capabilities
            </Caption>
            <H2 className="text-slate-900">
              End-to-End Production & Creative Services
            </H2>
          </ScrollReveal>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
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
