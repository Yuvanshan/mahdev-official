import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { SWSService } from '../../data/swsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

interface SWSServiceDetailModalProps {
  service: SWSService | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: SWSService) => void;
  onRequestQuote: (service: SWSService) => void;
}

export const SWSServiceDetailModal: React.FC<SWSServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
  onRequestQuote,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !service) return null;

  const images = service.gallery && service.gallery.length > 0 ? service.gallery : [service.imageUrl];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <IconRenderer name={service.iconName || 'Sparkles'} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">{service.name}</h3>
                {service.badge && (
                  <Badge variant="electric" size="sm">
                    {service.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">{service.tagline}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Main Gallery Display with Controls */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video max-h-[380px] group">
            <img
              src={images[activeImageIndex]}
              alt={`${service.name} preview ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

            {/* Price Badge Overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-white">
              <div className="text-[10px] uppercase font-bold text-blue-300">Starting Price</div>
              <div className="font-display text-lg font-bold text-white">{service.startingPrice}</div>
              {service.priceNote && (
                <div className="text-[10px] text-slate-300">{service.priceNote}</div>
              )}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-white">
              {activeImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative rounded-lg overflow-hidden shrink-0 w-20 h-14 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#0052FF] ring-2 ring-blue-500/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Detailed Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Service Overview
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">{service.detailedDescription}</p>
          </div>

          {/* Features Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              What Is Included In This Service
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications Matrix */}
          {service.specs && service.specs.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Operational & Technical Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-blue-50/40 border border-blue-100/80 text-xs"
                  >
                    <span className="font-medium text-slate-600">{spec.label}</span>
                    <span className="font-semibold text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SWS Ecosystem Guarantee */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Mahdev Production SLA Assurance</div>
                <div className="text-slate-400">
                  Backed by dedicated event supervisors, standby backup gear, and zero cancellation risk.
                </div>
              </div>
            </div>
            {service.leadTime && (
              <div className="text-xs font-medium text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20 shrink-0">
                Lead Time: {service.leadTime}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/90 shrink-0">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>Ready to plan? </span>
            <span className="font-semibold text-slate-800">
              Starting from {service.startingPrice}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                const activeImg = images[activeImageIndex] || service.imageUrl;
                openWhatsAppInquiry({
                  title: service.name,
                  category: service.category,
                  divisionName: 'SWS Event Management',
                  imageUrl: activeImg,
                  price: service.startingPrice,
                  description: service.description,
                  type: 'service',
                });
              }}
              title="Inquire about this service on WhatsApp 0750928078"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
              <span>WhatsApp (0750928078)</span>
            </button>

            <Button
              variant="outline"
              size="md"
              onClick={() => onRequestQuote(service)}
              className="flex-1 sm:flex-none text-xs"
            >
              Request Quote
            </Button>
            <Button
              variant="electric"
              size="md"
              onClick={() => onBookNow(service)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="flex-1 sm:flex-none text-xs shadow-md shadow-blue-500/20"
            >
              Book Service
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
