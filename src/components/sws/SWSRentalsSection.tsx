import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Layers,
  Armchair,
  Grid,
  Box,
  Volume2,
  Tv,
  Tent,
  ShieldCheck,
  Utensils,
  CheckCircle2,
  Calendar,
  PhoneCall,
  Clock,
  Plus,
  Minus,
  ArrowRight,
  Info,
  X,
  FileText,
} from 'lucide-react';
import {
  SWSRentalItem,
  RentalCategory,
  SWSService,
} from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal, FadeIn, ScaleIn } from '../motion/MotionWrappers';

interface SWSRentalsSectionProps {
  onBookRental: (rentalItem?: SWSRentalItem) => void;
  onRequestQuote: (rentalItem?: SWSRentalItem) => void;
}

export const SWSRentalsSection: React.FC<SWSRentalsSectionProps> = ({
  onBookRental,
  onRequestQuote,
}) => {
  const { products: rawProducts, services: rawServices } = useFirestoreDataContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailItem, setActiveDetailItem] = useState<SWSRentalItem | null>(null);
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [rentalQty, setRentalQty] = useState<number>(1);

  const inventory = useMemo<SWSRentalItem[]>(() => {
    const items: SWSRentalItem[] = [];
    if (rawProducts && rawProducts.length > 0) {
      const swsProds = rawProducts.filter(
        (p) => p.division === 'sws' || (p as any).divisionId === 'sws' || (p as any).category === 'rentals'
      );
      swsProds.forEach((p) => {
        items.push({
          id: p.id,
          name: p.name,
          category: ((p as any).rentalCategory || 'seating') as RentalCategory,
          categoryLabel: (p as any).categoryLabel || 'Equipment & Rentals',
          tagline: p.shortDescription || p.description?.slice(0, 60) || '',
          description: p.description || '',
          dailyRate: typeof p.price === 'number' ? `$${p.price}/day` : String(p.price || '$50/day'),
          unit: 'Day',
          availableStock: typeof p.stock === 'number' ? p.stock : 10,
          minOrderQuantity: 1,
          imageUrl: p.images && p.images.length > 0 ? p.images[0] : (p as any).imageUrl || '',
          features: (p as any).specifications?.map((s: any) => typeof s === 'string' ? s : `${s.label}: ${s.value}`) || [],
          specs: [],
          badge: (p as any).badge,
          popular: !!(p as any).isFeatured,
        });
      });
    }
    return items;
  }, [rawProducts, rawServices]);

  const rentalCategories = useMemo(() => {
    const unique = Array.from(new Set(inventory.map((i) => i.category)));
    return [
      { id: 'all', label: 'All Inventory', icon: 'grid' },
      ...unique.map((cat) => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' '),
        icon: 'box',
      })),
    ];
  }, [inventory]);

  if (inventory.length === 0) {
    return null;
  }

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  const handleOpenDetail = (item: SWSRentalItem) => {
    setActiveDetailItem(item);
    setRentalQty(item.minOrderQuantity || 1);
    setRentalDays(1);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Armchair':
        return <Armchair className="w-4 h-4" />;
      case 'Grid':
        return <Grid className="w-4 h-4" />;
      case 'Box':
        return <Box className="w-4 h-4" />;
      case 'Volume2':
        return <Volume2 className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Tv':
        return <Tv className="w-4 h-4" />;
      case 'Tent':
        return <Tent className="w-4 h-4" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <SectionContainer id="rentals" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <ScrollReveal direction="up">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0052FF]">
                <Layers className="w-3.5 h-3.5" />
                Comprehensive Rental Inventory
              </span>
              <span className="text-xs font-semibold text-slate-500">5,000+ Units in Active Stock</span>
            </div>
            <H2 className="text-slate-900">
              Event Furniture, Staging & AV Equipment Rentals
            </H2>
            <Body className="text-slate-600 mt-2 max-w-2xl">
              From crystal Chiavari chairs and luxury VIP velvet lounges to concert line-arrays, 4K LED video walls, silent power generators, and waterproof marquee canopies. Available for dry-hire or full turnkey managed staging across Sri Lanka.
            </Body>
          </ScrollReveal>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chairs, truss, sound, screens, tents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {rentalCategories.map((cat) => {
          const count =
            cat.id === 'all'
              ? inventory.length
              : inventory.filter((i) => i.category === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#0052FF] text-white shadow-md shadow-blue-500/25'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              {getCategoryIcon(cat.icon)}
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rental Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <FadeIn key={item.id} delay={Math.min(idx * 0.05, 0.3)}>
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group">
                {/* Image Container */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-sm">
                      {item.categoryLabel}
                    </span>
                    {item.badge && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom Stock & Rate Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <div className="text-[11px] text-slate-300 font-medium">Daily Rental Rate</div>
                      <div className="text-lg font-bold text-white tracking-tight">
                        {item.dailyRate}{' '}
                        <span className="text-[11px] font-normal text-slate-300">
                          {item.unit.includes('/') ? item.unit : `/ ${item.unit}`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {item.availableStock} in Stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 mb-3 line-clamp-1">
                      {item.tagline}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Key Specs Pills */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100 mb-4">
                      {item.specs.slice(0, 2).map((spec, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg"
                        >
                          <span className="font-medium text-slate-500">{spec.label}:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[60%]">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      View Details & Specs
                    </button>
                    <Button
                      variant="electric"
                      size="sm"
                      onClick={() => onBookRental(item)}
                      className="py-2 px-3.5 text-xs font-bold shrink-0"
                    >
                      Book Rental
                    </Button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Rental Equipment Found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search query or filter to view other categories in our event rental inventory.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-50 text-[#0052FF] text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Bottom Guarantee Banner */}
      <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-slate-900">
              White-Glove Rental Guarantee & On-Site Setup
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              All rental gear is 100% tested, sanitized, delivered in protective flight cases, and installed by licensed technicians across all 9 provinces of Sri Lanka.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Button
            variant="outline"
            size="md"
            onClick={() => onRequestQuote()}
            className="text-xs font-semibold flex-1 md:flex-none"
          >
            Download Full Catalog PDF
          </Button>
          <Button
            variant="electric"
            size="md"
            onClick={() => onBookRental()}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs font-bold flex-1 md:flex-none"
          >
            Request Rental Quote
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      {activeDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative h-60 w-full bg-slate-900 shrink-0">
              <img
                src={activeDetailItem.imageUrl}
                alt={activeDetailItem.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-black/30 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveDetailItem(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white inline-block mb-1.5">
                  {activeDetailItem.categoryLabel}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                  {activeDetailItem.name}
                </h3>
                <p className="text-xs text-slate-300 font-medium">{activeDetailItem.tagline}</p>
              </div>
            </div>

            {/* Modal Content Scroll */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Pricing & Availability Bar */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-blue-700 font-semibold block">Rental Tariff</span>
                  <div className="text-xl font-bold text-slate-900">
                    {activeDetailItem.dailyRate}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {activeDetailItem.unit.includes('/') ? activeDetailItem.unit : `/ ${activeDetailItem.unit}`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Current Inventory</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full inline-block mt-0.5">
                    {activeDetailItem.availableStock} Units Active & Available
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Equipment Overview
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeDetailItem.description}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeDetailItem.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-500 font-medium">{spec.label}</span>
                      <span className="font-bold text-slate-800">{spec.value}</span>
                    </div>
                  ))}
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Min Order Qty</span>
                    <span className="font-bold text-slate-800">
                      {activeDetailItem.minOrderQuantity} Units
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Delivery & Setup</span>
                    <span className="font-bold text-blue-700">Island-wide Available</span>
                  </div>
                </div>
              </div>

              {/* Features Included */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Key Features & Guarantees
                </h4>
                <ul className="space-y-2">
                  {activeDetailItem.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rental Estimator Calculator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Rental Cost Estimator
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">
                      Quantity Needed
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setRentalQty((prev) =>
                            Math.max(activeDetailItem.minOrderQuantity || 1, prev - 5)
                          )
                        }
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={activeDetailItem.minOrderQuantity || 1}
                        value={rentalQty}
                        onChange={(e) => setRentalQty(Number(e.target.value) || 1)}
                        className="w-full text-center text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRentalQty((prev) => prev + 5)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">
                      Number of Days
                    </label>
                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setRentalDays((prev) => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={rentalDays}
                        onChange={(e) => setRentalDays(Number(e.target.value) || 1)}
                        className="w-full text-center text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setRentalDays((prev) => prev + 1)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveDetailItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const item = activeDetailItem;
                    setActiveDetailItem(null);
                    onRequestQuote(item);
                  }}
                  className="text-xs font-semibold"
                >
                  Request Quote
                </Button>
                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => {
                    const item = activeDetailItem;
                    setActiveDetailItem(null);
                    onBookRental(item);
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Book {rentalQty} Units ({rentalDays} Days)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
