import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { ImageWatermark } from '../common/ImageWatermark';
import { getWhatsAppInquiryUrl, type WhatsAppInquiryOptions } from '../../utils/whatsapp';

export interface ServiceDetails {
  title: string;
  images: string[];
  subtitle?: string;
  description?: string;
  divisionName?: string;
  features?: string[];
  deliverables?: string[];
  /** Extra titled lists (e.g. specs, process, technologies). */
  sections?: Array<{ label: string; items: string[] }>;
  priceLabel?: string;
  turnaround?: string;
}

export interface ServiceAction {
  label: string;
  /** Receives the index of the image on screen (e.g. to share that photo). */
  onClick: (imageIndex: number) => void;
  /** Keep the pop-up open after the action (e.g. Share); by default it closes first. */
  keepOpen?: boolean;
}

interface ServiceDetailsModalProps {
  service: ServiceDetails | null;
  onClose: () => void;
  /** Main action next to WhatsApp, e.g. "Book Now" or "Explore SWS". */
  primaryAction?: ServiceAction;
  /** Further actions, e.g. "Request Quote". */
  actions?: ServiceAction[];
  /** Extra details for the standard WhatsApp enquiry message (category, ids...). */
  whatsappInquiry?: Partial<WhatsAppInquiryOptions>;
  /** Image to show first, e.g. the gallery photo the visitor tapped. */
  initialImageIndex?: number;
  /** Division watermark drawn over the photo (SWS and U1 galleries). */
  watermarkLabel?: React.ComponentProps<typeof ImageWatermark>['label'];
}

/**
 * Full details opened from a ServiceTile's View button, shared by every service
 * listing (landing, /services, SWS, U1, IT, Travels...) and by gallery items in
 * Explore All, so both pop-ups look and behave the same.
 * - Desktop: near full-screen with space on all four sides; images on the
 *   left (whole image, never cropped, with thumbnails), details on the right.
 * - Mobile: full screen; image on top, scrolling details and an action bar
 *   that stays clear of the phone's bottom edge.
 * Rendered into <body> so transformed/animated parents cannot clip it.
 */
export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  onClose,
  primaryAction,
  actions = [],
  whatsappInquiry,
  initialImageIndex = 0,
  watermarkLabel,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const images = service ? service.images.filter(Boolean) : [];

  useEffect(() => {
    setImageIndex(initialImageIndex > 0 && initialImageIndex < images.length ? initialImageIndex : 0);
    if (!service) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setImageIndex((i) => (images.length ? (i + 1) % images.length : 0));
      if (event.key === 'ArrowLeft') setImageIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, onClose]);

  if (!service || typeof document === 'undefined') return null;

  const showImage = (delta: number) => setImageIndex((current) => (current + delta + images.length) % images.length);
  // Same message format and links as every other WhatsApp enquiry on the site.
  const whatsappHref = getWhatsAppInquiryUrl({
    title: service.title,
    divisionName: service.divisionName,
    price: service.priceLabel,
    description: service.description,
    imageUrl: images[imageIndex],
    type: 'service',
    ...whatsappInquiry,
  });
  const listGroups = [
    { label: 'What’s included', items: service.features },
    { label: 'Deliverables', items: service.deliverables },
    ...(service.sections || []),
  ].filter((group) => group.items && group.items.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex justify-center bg-slate-950/80 backdrop-blur-sm lg:p-8 xl:p-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={service.title}
        className="relative flex h-full w-full max-w-7xl flex-col overflow-hidden bg-white shadow-2xl lg:flex-row lg:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 text-slate-900 shadow-md hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Images: whole picture (contain), thumbnails underneath. */}
        <div className="flex shrink-0 flex-col bg-slate-950 lg:w-[64%]">
          <div className="relative h-[58svh] w-full sm:h-[62svh] lg:h-auto lg:flex-1">
            {images.length > 0 ? (
              <ImageWithShimmer
                src={images[imageIndex]}
                alt={service.title}
                className="absolute inset-0"
                imageFit="contain"
                fallbackText={service.title}
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">No photos yet</div>
            )}
            {watermarkLabel && images.length > 0 && <ImageWatermark label={watermarkLabel} />}
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => showImage(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => showImage(1)} aria-label="Next image" className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white">
                  {imageIndex + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="hidden gap-2 overflow-x-auto p-3 sm:flex">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`Show image ${index + 1}`}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${index === imageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <ImageWithShimmer src={image} alt="" className="absolute inset-0" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details and actions. */}
        <div className="flex min-h-0 flex-1 flex-col lg:w-[36%]">
          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-7 lg:pt-10">
            <div>
              {service.divisionName && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{service.divisionName}</p>
              )}
              <h2 className="pr-10 font-display text-2xl font-bold leading-tight text-slate-900 lg:text-3xl">{service.title}</h2>
              {service.subtitle && <p className="mt-1 text-sm text-slate-500">{service.subtitle}</p>}
              {(service.priceLabel || service.turnaround) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.priceLabel && (
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-slate-900">{service.priceLabel}</span>
                  )}
                  {service.turnaround && (
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{service.turnaround}</span>
                  )}
                </div>
              )}
            </div>

            {service.description && (
              <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{service.description}</p>
            )}

            {listGroups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{group.label}</h3>
                <ul className="grid gap-2">
                  {group.items!.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enquire on WhatsApp
            </a>
            {(primaryAction || actions.length > 0) && (
              <div className="flex gap-2">
                {[primaryAction, ...actions].filter(Boolean).map((action) => (
                  <button
                    key={action!.label}
                    type="button"
                    // Close first so a booking/quote form opened by the action is not hidden behind this modal.
                    onClick={() => {
                      if (!action!.keepOpen) onClose();
                      action!.onClick(imageIndex);
                    }}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-blue-600 hover:text-blue-700"
                  >
                    {action!.label} {!action!.keepOpen && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/** Maps a stored service record (any division) to the details shown in the modal. */
export function toServiceDetails(service: Record<string, any>, divisionName?: string): ServiceDetails {
  const images: string[] = Array.isArray(service.images) && service.images.length > 0
    ? service.images
    : [service.imageUrl || service.image].filter(Boolean);
  const price = service.startingPrice || service.price;
  return {
    title: service.title || service.name || 'Service',
    images: images.filter((url) => typeof url === 'string' && url),
    description: service.description || service.shortDescription,
    divisionName: service.divisionName || divisionName,
    features: Array.isArray(service.features) ? service.features : undefined,
    deliverables: Array.isArray(service.deliverables) ? service.deliverables : undefined,
    priceLabel: typeof price === 'number' && price > 0 ? `From LKR ${price.toLocaleString()}` : typeof price === 'string' && price.trim() ? price : undefined,
    turnaround: service.turnaroundTime,
  };
}
