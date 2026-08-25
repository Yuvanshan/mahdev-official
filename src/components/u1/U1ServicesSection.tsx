import React, { useState, useMemo } from 'react';
import {
  Camera,
  Film,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Heart,
  Palette,
  Frame,
} from 'lucide-react';
import { U1_SERVICES, U1Service } from '../../data/u1Data';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { U1ServiceDetailModal } from './U1ServiceDetailModal';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

interface U1ServicesSectionProps {
  onBookService: (service: U1Service) => void;
}

type U1FilterCategory = 'all' | 'media' | 'portrait' | 'commercial' | 'print';

export const U1ServicesSection: React.FC<U1ServicesSectionProps> = ({
  onBookService,
}) => {
  const { services: rawServices } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<U1FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalService, setActiveModalService] = useState<U1Service | null>(null);

  const allServices = useMemo<U1Service[]>(() => {
    if (rawServices && rawServices.length > 0) {
      const u1Services = rawServices.filter(
        (s) => s.division === 'u1' || (s as any).divisionId === 'u1'
      );
      if (u1Services.length > 0) {
        return u1Services.map((s) => ({
          id: s.id,
          name: s.name,
          category: (((s as any).category && (s as any).category !== 'all' ? (s as any).category : 'media') as 'media' | 'portrait' | 'commercial' | 'print'),
          tagline: (s as any).tagline || s.description?.slice(0, 60) || '',
          description: s.description || '',
          detailedDescription: (s as any).detailedDescription || s.description || '',
          startingPrice: typeof s.price === 'number' ? `$${s.price.toLocaleString()}` : String(s.price || '$800'),
          turnaround: (s as any).turnaround || (s as any).leadTime || '7-10 Days',
          deliverables: (s as any).deliverables || s.features || ['High-Res Digital Master Gallery'],
          imageUrl: s.images && s.images.length > 0 ? s.images[0] : (s as any).imageUrl || '',
          gallery: s.images || [],
          badge: s.badge || 'Popular Studio Package',
          popular: (s as any).popular ?? true,
        }));
      }
    }
    return U1_SERVICES;
  }, [rawServices]);

  const categories: { id: U1FilterCategory; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: `All ${allServices.length} Services`, count: allServices.length, icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'media', label: 'Cinema & Coverage', count: allServices.filter((s) => s.category === 'media').length, icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'portrait', label: 'Portraits & Studio', count: allServices.filter((s) => s.category === 'portrait').length, icon: <Camera className="w-3.5 h-3.5" /> },
    { id: 'commercial', label: 'Commercial & Product', count: allServices.filter((s) => s.category === 'commercial').length, icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'print', label: 'Albums & Frames', count: allServices.filter((s) => s.category === 'print').length, icon: <Frame className="w-3.5 h-3.5" /> },
  ];

  const filteredServices = allServices.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SectionContainer id="services" background="white" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF] mb-2 block">
              11 Specialized Photography & Creative Studio Disciplines
            </Caption>
            <H2 className="text-slate-900">
              Visual Craftsmanship & Creative Production
            </H2>
            <Body className="text-slate-600 mt-2 max-w-2xl">
              From high-fashion editorial portraits and cinematic wedding films to commercial catalog macros and heirloom flush-mount albums.
            </Body>
          </ScrollReveal>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search studio services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
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

      {/* Services Grid (Image-First Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="group rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs"
          >
            <div>
              {/* Image Banner */}
              <div
                className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer"
                onClick={() => setActiveModalService(service)}
              >
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />

                {/* Badge */}
                {service.badge && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="electric" size="sm" className="text-[10px]">
                      {service.badge}
                    </Badge>
                  </div>
                )}

                {/* Quick Expand Icon */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                </div>

                {/* Price pill */}
                <div className="absolute bottom-3 left-3 text-[11px] font-semibold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md">
                  From {service.startingPrice}
                </div>
              </div>

              {/* Content Details */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                    {service.name}
                  </h3>
                  <p className="text-xs text-[#0052FF] font-medium mt-0.5">{service.tagline}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {service.description}
                </p>

                {/* Key Deliverables sample */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {service.deliverables.slice(0, 2).map((del, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-[11px] text-slate-600 truncate">
                      <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveModalService(service)}
                className="flex-1 text-xs py-2"
              >
                View Details
              </Button>
              <Button
                variant="electric"
                size="sm"
                onClick={() => onBookService(service)}
                rightIcon={<ArrowRight className="w-3 h-3" />}
                className="flex-1 text-xs font-bold py-2 shadow-xs"
              >
                Book Session
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Service Detail Modal */}
      <U1ServiceDetailModal
        service={activeModalService}
        isOpen={!!activeModalService}
        onClose={() => setActiveModalService(null)}
        onBookNow={(s) => {
          setActiveModalService(null);
          onBookService(s);
        }}
      />
    </SectionContainer>
  );
};
