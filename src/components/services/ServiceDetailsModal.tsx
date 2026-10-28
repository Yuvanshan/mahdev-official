import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CalendarCheck, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, Truck, X } from 'lucide-react';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { ImageWatermark } from '../common/ImageWatermark';
import { getWhatsAppInquiryUrl, type WhatsAppInquiryOptions } from '../../utils/whatsapp';
import { getServiceStartingPrice, getStartingPriceDetails } from '../common/StartingPriceTag';
import { getImageAlt } from '../../config/imageAlt';
import { divisionIdFromName, startOnlineBooking, type OnlineBookingKind } from '../../utils/onlineBooking';
import { useOnlineBookingEnabled } from '../../hooks/useOnlineBookingEnabled';

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
  /** Small note shown as a tag beside the price (e.g. transport charges). */
  priceNote?: string;
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
  /** Gallery browsing: buttons (and PageUp/PageDown) to open the previous/next item. */
  itemNavigation?: {
    onPrevious: () => void;
    onNext: () => void;
    /** e.g. "3 of 126" */
    positionLabel?: string;
  };
  /** Shows a "Book online" button that opens the online booking page for this item. */
  bookOnline?: {
    kind: OnlineBookingKind;
    id: string;
    /** Numeric starting/unit price in LKR, when known. */
    price?: number | null;
    divisionId?: string;
    sku?: string;
  };
}

/** Index after moving `delta` steps through `length` items, wrapping at both ends. */
export function wrapIndex(current: number, delta: number, length: number): number {
  return length > 0 ? (current + delta + length) % length : 0;
}

// Minimum horizontal finger movement (px) that counts as a swipe between photos.
const SWIPE_THRESHOLD = 45;

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
  itemNavigation,
  bookOnline,
}) => {
  const [imageIndex, setImageIndex] = useState(0);
  const onlineBookingEnabled = useOnlineBookingEnabled();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const images = service ? service.images.filter(Boolean) : [];
  // Pages pass a new `service` object on every render, so reset the photo only when the
  // item itself changes (otherwise e.g. a Share toast would jump back to photo 1).
  const itemKey = service ? `${service.title}\n${images.join('\n')}` : '';
  const navigationRef = useRef(itemNavigation);
  navigationRef.current = itemNavigation;

  useEffect(() => {
    setImageIndex(initialImageIndex > 0 && initialImageIndex < images.length ? initialImageIndex : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  const isOpen = Boolean(service);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setImageIndex((i) => (images.length ? (i + 1) % images.length : 0));
      if (event.key === 'ArrowLeft') setImageIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0));
      if (event.key === 'PageDown') navigationRef.current?.onNext();
      if (event.key === 'PageUp') navigationRef.current?.onPrevious();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemKey, onClose]);

  if (!service || typeof document === 'undefined') return null;

  const showImage = (delta: number) => setImageIndex((current) => (current + delta + images.length) % images.length);
  // Swipe left/right on the photo to see the item's other photos (phones and tablets).
  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || images.length < 2) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return;
    showImage(deltaX < 0 ? 1 : -1);
  };
  // Same message format and links as every other WhatsApp enquiry on the site.
  const whatsappHref = getWhatsAppInquiryUrl({
    title: service.title,
    divisionName: service.divisionName,
    price: service.priceLabel && service.priceNote ? `${service.priceLabel} (${service.priceNote})` : service.priceLabel,
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
          <div
            className="relative h-[58svh] w-full touch-pan-y sm:h-[62svh] lg:h-auto lg:flex-1"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {images.length > 0 ? (
              <ImageWithShimmer
                src={images[imageIndex]}
                alt={getImageAlt(service.title, service.divisionName)}
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
          {itemNavigation && (
            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2 text-white">
              <button
                type="button"
                onClick={itemNavigation.onPrevious}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
              </button>
              {itemNavigation.positionLabel && (
                <span className="text-xs font-medium text-slate-300">{itemNavigation.positionLabel}</span>
              )}
              <button
                type="button"
                onClick={itemNavigation.onNext}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold hover:bg-white/10"
              >
                Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
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
                  {service.priceLabel && service.priceNote && (
                    <span className="inline-flex items-center gap-1 self-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      <Truck className="h-3.5 w-3.5 shrink-0" />
                      {service.priceNote}
                    </span>
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
            {bookOnline && onlineBookingEnabled && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  startOnlineBooking({
                    kind: bookOnline.kind,
                    id: bookOnline.id,
                    title: service.title,
                    // The photo on screen first, so the booking page opens on the same image.
                    images: [images[imageIndex], ...images.filter((_, index) => index !== imageIndex)],
                    description: service.description,
                    divisionId: bookOnline.divisionId || divisionIdFromName(service.divisionName),
                    divisionName: service.divisionName,
                    price: bookOnline.price,
                    priceLabel: service.priceLabel,
                    sku: bookOnline.sku,
                    features: service.features,
                  });
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0052FF] px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Book online
              </button>
            )}
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
  return {
    title: service.title || service.name || 'Service',
    images: images.filter((url) => typeof url === 'string' && url),
    description: service.description || service.shortDescription,
    divisionName: service.divisionName || divisionName,
    features: Array.isArray(service.features) ? service.features : undefined,
    deliverables: Array.isArray(service.deliverables) ? service.deliverables : undefined,
    ...getStartingPriceDetails(getServiceStartingPrice(service)),
    turnaround: service.turnaroundTime,
  };
}
