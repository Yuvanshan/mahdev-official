import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Truck,
  Layers,
  ShieldCheck,
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
  SWS_RENTAL_INVENTORY,
} from '../../data/swsData';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { isSameDivision } from '../../services/firestore/divisions';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { formatCurrency } from '../../utils/currency';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal, FadeIn, ScaleIn } from '../motion/MotionWrappers';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { DivisionFilterEmptyState, useDivisionFilteredItems } from '../common/DivisionFilter';
import { TRANSPORT_NOTE } from '../common/StartingPriceTag';
import { getImageSourceCandidates } from '../../utils/imageSources';

interface SWSRentalsSectionProps {
  onBookRental: (rentalItem?: SWSRentalItem) => void;
  onRequestQuote: (rentalItem?: SWSRentalItem) => void;
}

export const SWSRentalsSection: React.FC<SWSRentalsSectionProps> = ({
  onBookRental,
  onRequestQuote,
}) => {
  const { products: rawProducts, services: rawServices, companySettings, siteSettings, divisions } = useFirestoreDataContext();
  const [activeDetailItem, setActiveDetailItem] = useState<SWSRentalItem | null>(null);
  const [rentalDays, setRentalDays] = useState<number>(1);
  const [rentalQty, setRentalQty] = useState<number>(1);

  const swsDiv = divisions?.find(
    (d) =>
      d.id === 'sws' ||
      d.id === 'sws-event-management' ||
      d.slug === 'sws' ||
      d.slug === 'sws-event-management'
  );

  const rentalCount = getRentalAssetCount(
    rawProducts,
    (swsDiv as any)?.rentalAssetCount || (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  const inventory = useMemo<SWSRentalItem[]>(() => {
    const items: SWSRentalItem[] = [];
    if (rawProducts && rawProducts.length > 0) {
      const swsProds = rawProducts.filter(
        (p) =>
          isSameDivision(p.division, 'sws') ||
          isSameDivision((p as any).divisionId, 'sws') ||
          // Unassigned rental products count as SWS; another division's products never do
          ((p as any).category === 'rentals' && !p.division && !(p as any).divisionId)
      );
      swsProds.forEach((p) => {
        items.push({
          id: p.id,
          name: p.name,
          category: ((p as any).rentalCategory || 'seating') as RentalCategory,
          categoryLabel: (p as any).categoryLabel || 'Equipment & Rentals',
          tagline: p.shortDescription || p.description?.slice(0, 60) || '',
          description: p.description || '',
          dailyRate: typeof p.price === 'number'
            ? `${formatCurrency(p.price, 'LKR')}/day`
            : String(p.price || 'Rs. 50/day').replace(/\bUSD\b|\$/gi, 'Rs.'),
          unit: 'Day',
          price: typeof p.price === 'number' ? p.price : null,
          availableStock: typeof p.stock === 'number' ? p.stock : 10,
          minOrderQuantity: 1,
          imageUrl: getImageSourceCandidates(
            p.imageUrl,
            p.images,
            p.galleryImages,
            (p as unknown as Record<string, unknown>).image,
            (p as unknown as Record<string, unknown>).media
          )[0] || '',
          gallery: getImageSourceCandidates(
            p.imageUrl,
            p.images,
            p.galleryImages,
            (p as unknown as Record<string, unknown>).image,
            (p as unknown as Record<string, unknown>).media
          ),
          features: (() => {
            const rawSpecs = (p as any).specifications;
            if (Array.isArray(rawSpecs)) {
              return rawSpecs.map((s: any) => typeof s === 'string' ? s : `${s.label || s.name || s.key || ''}: ${s.value || ''}`);
            }
            if (rawSpecs && typeof rawSpecs === 'object') {
              return Object.entries(rawSpecs).map(([k, v]) => `${k}: ${v}`);
            }
            if (typeof rawSpecs === 'string' && rawSpecs.trim()) {
              return [rawSpecs.trim()];
            }
            return [];
          })(),
          specs: [],
          badge: (p as any).badge,
          popular: !!(p as any).isFeatured,
        });
      });
    }
    return items;
  }, [rawProducts, rawServices]);

  // Search, category and price come from the page-wide filter bar.
  const filteredItems = useDivisionFilteredItems('sws-rentals', inventory, (item) => ({
    title: item.name,
    category: item.category
      ? String(item.category).charAt(0).toUpperCase() + String(item.category).slice(1).replace(/-/g, ' ')
      : undefined,
    price: item.price,
    text: [item.tagline, item.description, item.categoryLabel, ...item.features].join(' '),
  }));

  if (inventory.length === 0) {
    return null;
  }

  const handleOpenDetail = (item: SWSRentalItem) => {
    setActiveDetailItem(item);
    setRentalQty(item.minOrderQuantity || 1);
    setRentalDays(1);
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
              <span className="text-xs font-semibold text-slate-500">{rentalCount} Units in Active Stock</span>
            </div>
            <H2 className="text-slate-900">
              Event Furniture, Staging & AV Equipment Rentals
            </H2>
          </ScrollReveal>
        </div>
      </div>

      {/* Rental Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <FadeIn key={item.id} delay={Math.min(idx * 0.05, 0.3)}>
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group">
                {/* Image Container */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  <ImageWithShimmer
                    src={
                      item.imageUrl && item.imageUrl.trim() !== ''
                        ? item.imageUrl.trim()
                        : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={item.name}
                    fallbackSources={item.gallery}
                    className="absolute inset-0"
                    imageClassName="transition-transform duration-500 group-hover:scale-105"
                    watermarkLabel="SWS EVENT MANAGEMENT"
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
                      <div className="text-[11px] text-slate-300 font-medium">Starting From</div>
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
                    <span className="mb-4 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      <Truck className="h-3 w-3 shrink-0" />
                      {TRANSPORT_NOTE}
                    </span>

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
        <DivisionFilterEmptyState label="rental items" />
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
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92svh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative h-[40svh] w-full bg-slate-900 shrink-0 sm:h-[48svh]">
              <ImageWithShimmer
                src={
                  activeDetailItem.imageUrl && activeDetailItem.imageUrl.trim() !== ''
                    ? activeDetailItem.imageUrl.trim()
                    : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
                }
                alt={activeDetailItem.name}
                className="absolute inset-0"
                // Whole item, never cropped, like the services pop-up.
                imageFit="contain"
                watermarkLabel="SWS EVENT MANAGEMENT"
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
