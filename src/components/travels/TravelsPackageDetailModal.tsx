import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  Users,
  Compass,
  DollarSign,
} from 'lucide-react';
import { TravelPackage } from '../../data/travelsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface TravelsPackageDetailModalProps {
  pkg: TravelPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onBookPackage: (pkg: TravelPackage) => void;
}

export const TravelsPackageDetailModal: React.FC<TravelsPackageDetailModalProps> = ({
  pkg,
  isOpen,
  onClose,
  onBookPackage,
}) => {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isOpen || !pkg) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white">
                  {pkg.title}
                </h3>
                {pkg.badge && (
                  <Badge variant="electric" size="sm" className="bg-[#0052FF]/30 text-blue-300 text-[10px]">
                    {pkg.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {pkg.duration} • {pkg.destination} • {pkg.tourType}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 text-slate-800">
          {/* 1. HERO & GALLERY PREVIEW */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950">
              <img
                src={pkg.gallery[activeGalleryIndex] || pkg.heroImage}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-mono font-bold">
                From {pkg.price} <span className="text-[10px] font-normal text-slate-400">/ Person</span>
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {pkg.gallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pkg.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeGalleryIndex === idx ? 'border-[#0052FF] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. OVERVIEW & HIGHLIGHTS */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0052FF]">
              Expedition Overview
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {pkg.overview}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
                Key Experience Highlights
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pkg.highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. DAY-BY-DAY DETAILED ITINERARY ACCORDION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Detailed Day-By-Day Itinerary ({pkg.itinerary.length} Days)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Click days to expand
              </span>
            </div>

            <div className="space-y-2.5">
              {pkg.itinerary.map((day) => {
                const isOpenDay = openDay === day.day;
                return (
                  <div
                    key={day.day}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDay(isOpenDay ? null : day.day)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          D{day.day}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{day.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>{day.location}</span>
                          </div>
                        </div>
                      </div>

                      {isOpenDay ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isOpenDay && (
                      <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-2.5 text-xs">
                        <p className="text-slate-700 leading-relaxed">{day.description}</p>
                        <div className="flex flex-wrap gap-4 pt-1 text-[11px] text-slate-500 font-mono">
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            🍴 {day.meals}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            🏨 {day.stay}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. INCLUDED & EXCLUDED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Included */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What’s Included</span>
              </h5>
              <div className="space-y-1.5 text-xs text-slate-700">
                {pkg.included.map((inc, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Excluded */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
              <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>What’s Excluded</span>
              </h5>
              <div className="space-y-1.5 text-xs text-slate-700">
                {pkg.excluded.map((exc, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{exc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. PRICING TIERS */}
          {pkg.pricingTiers && pkg.pricingTiers.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Accommodation & Vehicle Tiers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pkg.pricingTiers.map((tier, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-xs font-bold text-slate-900">{tier.tier}</div>
                    <div className="font-mono text-base font-bold text-[#0052FF]">{tier.price}</div>
                    <div className="text-[11px] text-slate-500 leading-tight">{tier.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. FAQS */}
          {pkg.faqs && pkg.faqs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Frequently Asked Questions
              </h4>
              <div className="space-y-2">
                {pkg.faqs.map((faq, idx) => {
                  const isFaqOpen = openFaqIndex === idx;
                  return (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isFaqOpen ? null : idx)}
                        className="w-full p-3.5 flex items-center justify-between text-left font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {isFaqOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {isFaqOpen && (
                        <div className="p-3.5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Itinerary
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="font-mono text-base font-bold text-slate-900">{pkg.price}</div>
              <div className="text-[10px] text-slate-500">{pkg.priceNote}</div>
            </div>

            <Button
              variant="electric"
              size="md"
              onClick={() => {
                onClose();
                onBookPackage(pkg);
              }}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Book This Package / Customize
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
