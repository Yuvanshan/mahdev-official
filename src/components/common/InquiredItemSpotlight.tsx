import React, { useState } from 'react';
import {
  MessageCircle,
  Share2,
  Check,
  Expand,
  ArrowLeft,
  Sparkles,
  MapPin,
  Tag,
  Layers,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { DisplayGalleryItem } from '../../utils/itemLookup';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { shareMediaAsset } from '../../utils/mediaShare';
import { Badge } from '../ui/Badge';
import { H1, Body } from '../ui/Heading';

interface InquiredItemSpotlightProps {
  item: DisplayGalleryItem;
  onClearSingleItemMode?: () => void;
  onNavigate?: (route: string) => void;
  totalGalleryCount?: number;
}

export const InquiredItemSpotlight: React.FC<InquiredItemSpotlightProps> = ({
  item,
  onClearSingleItemMode,
  onNavigate,
  totalGalleryCount = 0,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleWhatsAppClick = () => {
    openWhatsAppInquiry({
      title: item.title,
      sku: item.sku,
      category: item.category,
      divisionName: item.divisionName || item.divisionId || 'Mahdev Group',
      imageUrl: item.url,
      location: item.location,
      description: item.description,
      type: 'gallery',
    });
  };

  const handleShare = async () => {
    const res = await shareMediaAsset({
      id: item.id,
      title: item.title,
      url: item.url,
      category: item.category,
      division: item.divisionId,
      sku: item.sku,
      description: item.description,
    });
    setCopied(true);
    setToastMessage(res.message);
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 2500);
  };

  const getDivisionLabel = () => {
    const div = (item.divisionId || item.divisionName || '').toLowerCase();
    if (div.includes('u1') || div.includes('studio') || div.includes('cinema')) {
      return 'U1 Cinema & Studio';
    }
    if (div.includes('sws') || div.includes('event')) {
      return 'SWS Event Management';
    }
    if (div.includes('it') || div.includes('software') || div.includes('tech')) {
      return 'Mahdev IT & Software';
    }
    if (div.includes('travel') || div.includes('safari') || div.includes('tour')) {
      return 'Mahdev Travels';
    }
    if (div.includes('mart')) {
      return 'Mahdev Online Mart';
    }
    return item.divisionName || item.divisionId || 'Mahdev Group';
  };

  return (
    <div id="inquired-item-spotlight" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {onClearSingleItemMode && (
            <button
              type="button"
              onClick={onClearSingleItemMode}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Browse All Gallery Items</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Selected Customer Inquired Item
          </span>
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
            SKU: {item.sku}
          </span>
        </div>
      </div>

      {/* Main Single-Item Focus Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Big Image Display */}
          <div className="lg:col-span-7 bg-slate-950 flex flex-col items-center justify-center relative min-h-[360px] sm:min-h-[460px] group">
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full max-h-[550px] object-contain cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            />

            {/* Quick Zoom Pill */}
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <Expand className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>

            {/* Division Watermark Badge */}
            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{getDivisionLabel()}</span>
            </div>
          </div>

          {/* Right Column: Specification & Direct WhatsApp CTA */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Category & Verified Status */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                  {item.category}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Archive
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 leading-tight mb-3">
                {item.title}
              </h2>

              {/* Price / Rate (if available) */}
              {item.price !== undefined && (
                <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium block">Price / Starting Rate:</span>
                  <span className="text-xl font-bold text-slate-900">
                    {typeof item.price === 'number'
                      ? `Rs. ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} (LKR)`
                      : item.price}
                  </span>
                </div>
              )}

              {/* Details & Location */}
              <div className="space-y-2.5 mb-6 text-sm text-slate-600">
                {item.location && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.dimensions && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Master Format: {item.dimensions}</span>
                  </div>
                )}
                {item.description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              {/* Main Primary WhatsApp CTA */}
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>Inquire on WhatsApp (075 092 8078)</span>
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Share Item Link</span>
                    </>
                  )}
                </button>

                {onClearSingleItemMode && (
                  <button
                    type="button"
                    onClick={onClearSingleItemMode}
                    className="py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View All Items {totalGalleryCount > 0 ? `(${totalGalleryCount})` : ''} →</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Overlay */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
