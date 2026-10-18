import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';

export interface ServiceDetails {
  title: string;
  images: string[];
  description?: string;
  divisionName?: string;
  features?: string[];
  deliverables?: string[];
  priceLabel?: string;
  turnaround?: string;
}

interface ServiceDetailsModalProps {
  service: ServiceDetails | null;
  onClose: () => void;
  /** Optional primary action, e.g. open the division page or booking. */
  primaryAction?: { label: string; onClick: () => void };
  whatsappNumber?: string;
}

/**
 * Full service details opened from a ServiceTile's View button. Images use
 * the same 4:3 frame as gallery images.
 */
export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  onClose,
  primaryAction,
  whatsappNumber = '94750928078',
}) => {
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
    if (!service) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [service, onClose]);

  if (!service) return null;
  const images = service.images.filter(Boolean);
  const showImage = (delta: number) => setImageIndex((current) => (current + delta + images.length) % images.length);
  const whatsappText = encodeURIComponent(`Hello, I'd like to know more about "${service.title}".`);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={service.title}
      onClick={onClose}
    >
      <div
        className="max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          {images.length > 0 && (
            <ImageWithShimmer
              src={images[imageIndex]}
              alt={service.title}
              className="aspect-[4/3] w-full bg-slate-100"
              fallbackText={service.title}
              loading="eager"
            />
          )}
          {images.length > 1 && (
            <>
              <button type="button" onClick={() => showImage(-1)} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => showImage(1)} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white">
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white">
                {imageIndex + 1} / {images.length}
              </span>
            </>
          )}
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div>
            {service.divisionName && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{service.divisionName}</p>
            )}
            <h2 className="font-display text-2xl font-bold text-slate-900">{service.title}</h2>
            {(service.priceLabel || service.turnaround) && (
              <p className="mt-2 text-sm font-medium text-slate-600">
                {[service.priceLabel, service.turnaround].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {service.description && (
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{service.description}</p>
          )}

          {[{ label: 'What’s included', items: service.features }, { label: 'Deliverables', items: service.deliverables }]
            .filter((group) => group.items && group.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{group.label}</h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {group.items!.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enquire on WhatsApp
            </a>
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-800 hover:border-blue-600 hover:text-blue-700"
              >
                {primaryAction.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
    priceLabel: typeof price === 'number' && price > 0 ? `From LKR ${price.toLocaleString()}` : undefined,
    turnaround: service.turnaroundTime,
  };
}
