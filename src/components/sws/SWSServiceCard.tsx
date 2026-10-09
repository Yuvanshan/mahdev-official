import React from 'react';
import {
  Eye,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { SWSService } from '../../data/swsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import { openWhatsAppInquiry } from '../../utils/whatsapp';

interface SWSServiceCardProps {
  service: SWSService;
  onViewDetails: (service: SWSService) => void;
  onBookNow: (service: SWSService) => void;
  onRequestQuote: (service: SWSService) => void;
}

export const SWSServiceCard: React.FC<SWSServiceCardProps> = ({
  service,
  onViewDetails,
  onBookNow,
  onRequestQuote,
}) => {
  return (
    <div className="group rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Image & Badges */}
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={
              service.imageUrl && service.imageUrl.trim() !== ''
                ? service.imageUrl.trim()
                : 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'
            }
            alt={service.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {service.badge && <Badge variant="electric" size="sm" className="text-[10px]">{service.badge}</Badge>}
            {service.gallery && service.gallery.length > 1 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {service.gallery.length} photos
              </span>
            )}
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug">
                {service.name}
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
                {service.tagline}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
              <IconRenderer name={service.iconName || 'Sparkles'} className="w-4 h-4" />
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          <div className="flex items-end justify-between gap-3 rounded-xl bg-blue-50/70 px-3.5 py-3">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Starting from</span>
              <span className="font-display text-base font-bold text-slate-900">{service.startingPrice}</span>
            </div>
            {service.leadTime && (
              <span className="text-right text-[10px] font-medium text-slate-500">
                {service.leadTime}
              </span>
            )}
          </div>

          {/* Key Features List */}
          <div className="space-y-1.5 pt-1">
            {service.features.slice(0, 3).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Actions Footer with direct WhatsApp inquiry */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {/* 1. View Details CTA */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(service)}
            leftIcon={<Eye className="w-3.5 h-3.5 text-slate-500" />}
            className="text-xs py-2 bg-white hover:bg-slate-100 border-slate-200"
          >
            View Details
          </Button>

          {/* 2. Direct WhatsApp CTA with Image */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openWhatsAppInquiry({
                title: service.name,
                category: service.category,
                divisionName: 'SWS Event Management',
                imageUrl: service.imageUrl,
                price: service.startingPrice,
                description: service.description,
                type: 'service',
              });
            }}
            title="Send WhatsApp inquiry with image"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] shadow-xs hover:shadow-md hover:shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white/20 shrink-0" />
            <span className="truncate">WhatsApp</span>
          </button>
        </div>

        {/* 3. Book Now CTA */}
        <Button
          variant="electric"
          size="sm"
          onClick={() => onBookNow(service)}
          leftIcon={<Calendar className="w-3.5 h-3.5" />}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          className="w-full text-xs font-semibold py-2 shadow-sm"
        >
          Book Service
        </Button>
      </div>
    </div>
  );
};
