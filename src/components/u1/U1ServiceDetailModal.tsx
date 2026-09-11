import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  Camera,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageCircle,
} from 'lucide-react';
import { U1Service } from '../../data/u1Data';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

interface U1ServiceDetailModalProps {
  service: U1Service | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: U1Service) => void;
}

export const U1ServiceDetailModal: React.FC<U1ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !service) return null;

  const currentImage = service.gallery[activeImageIndex] || service.imageUrl;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % service.gallery.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex(
      (prev) => (prev - 1 + service.gallery.length) % service.gallery.length
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {service.name}
                </h3>
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
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Main Gallery Carousel */}
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9] max-h-[380px] bg-slate-950 group">
            <img
              src={currentImage}
              alt={service.name}
              className="w-full h-full object-cover transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

            {/* Controls */}
            {service.gallery.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Thumbnail dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {service.gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'w-6 bg-blue-500' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quick Details Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting Investment</span>
              <div className="font-display text-xl font-bold text-slate-950">{service.startingPrice}</div>
              {service.priceNote && (
                <div className="text-[10px] text-slate-500">{service.priceNote}</div>
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Typical Duration</span>
              <div className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{service.duration || 'Flexible custom session'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Production Standard</span>
              <div className="text-xs font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>{service.gearUsed || 'Master-grade optics & calibrated color'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-display text-base font-bold text-slate-900">
              Creative Philosophy & Approach
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {service.detailedDescription}
            </p>
          </div>

          {/* Deliverables Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              What Is Included In Every Booking
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {service.deliverables.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/40 border border-blue-100 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Need custom dates or multi-day coverage? Our studio director will coordinate.
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                openWhatsAppInquiry({
                  title: service.name,
                  category: service.category,
                  divisionName: 'U1 Cinema & Studio',
                  imageUrl: currentImage,
                  price: service.startingPrice,
                  description: service.description,
                  type: 'service',
                });
              }}
              title="Inquire about this cinema service on WhatsApp"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
              <span>Inquire on WhatsApp</span>
            </button>

            <Button variant="outline" size="md" onClick={onClose} className="text-xs">
              Close
            </Button>
            <Button
              variant="electric"
              size="md"
              onClick={() => onBookNow(service)}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-bold shadow-md shadow-blue-500/20"
            >
              Book {service.name}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
