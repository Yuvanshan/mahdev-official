import React from 'react';
import {
  Eye,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';
import { SWSService } from '../../data/swsData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';

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
            src={service.imageUrl}
            alt={service.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

          {/* Top Badge & Gallery Count */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            {service.badge ? (
              <Badge variant="electric" size="sm" className="shadow-md text-[10px] py-0.5 px-2">
                {service.badge}
              </Badge>
            ) : (
              <span />
            )}
            {service.gallery && service.gallery.length > 1 && (
              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/20">
                {service.gallery.length} Photos
              </span>
            )}
          </div>

          {/* Starting Price Banner on Image Bottom */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">
                Starting from
              </span>
              <span className="font-display text-lg font-bold text-white drop-shadow-sm">
                {service.startingPrice}
              </span>
            </div>
            {service.leadTime && (
              <span className="text-[10px] text-slate-300 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded border border-white/15">
                {service.leadTime.split(' ')[0]} {service.leadTime.split(' ')[1]}
              </span>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-6 space-y-4">
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

      {/* Card Actions Footer with 3 distinct CTAs */}
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

          {/* 2. Request Quote CTA */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestQuote(service)}
            leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs py-2 bg-blue-50/60 hover:bg-blue-100/80 border-blue-200 text-blue-800"
          >
            Request Quote
          </Button>
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
          Book Now
        </Button>
      </div>
    </div>
  );
};
