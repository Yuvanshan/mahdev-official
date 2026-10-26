import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';
import { StartingPriceTag } from '../common/StartingPriceTag';

interface ServiceTileProps {
  title: string;
  images: string[];
  onView: () => void;
  imageLoading?: 'eager' | 'lazy';
  /** Optional starting price; shown as "Starting From" with the transport tag. */
  price?: unknown;
  /**
   * The item's own page (e.g. /services/{slug}). When set, the controls are real
   * links search engines can follow; a plain click still opens the details pop-up.
   */
  href?: string;
  /** Image alt text; defaults to the title. Pass getImageAlt(...) for the keyword version. */
  imageAlt?: string;
}

/**
 * Click handler for a link that opens a pop-up in the app: a plain left click runs
 * the action instead of navigating; Ctrl/Cmd/Shift/middle clicks open the page normally.
 */
export function inAppLinkClick(action: () => void) {
  return (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    action();
  };
}

/** A link to the item's page when an href is given, otherwise a button. */
const ViewControl: React.FC<{
  href?: string;
  onView: () => void;
  className: string;
  ariaLabel?: string;
  children: React.ReactNode;
}> = ({ href, onView, className, ariaLabel, children }) =>
  href ? (
    <a href={href} onClick={inAppLinkClick(onView)} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onView} aria-label={ariaLabel} className={className}>
      {children}
    </button>
  );

/**
 * Compact service card used everywhere services are listed: image, title,
 * optional starting price and a View button. Images use the same 4:3 frame as gallery images. Full
 * details (description, features, price, booking) open from View.
 */
export const ServiceTile: React.FC<ServiceTileProps> = ({ title, images, onView, imageLoading = 'lazy', price, href, imageAlt }) => {
  const usableImages = images.filter(Boolean);
  const { activeIndex, containerRef } = useAutoSlideImage(usableImages.length);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <ViewControl
        href={href}
        onView={onView}
        ariaLabel={`View ${title}`}
        className="relative block w-full text-left"
      >
        <div ref={containerRef}>
        <ImageWithShimmer
          src={usableImages[activeIndex] || usableImages[0] || ''}
          alt={imageAlt || title}
          className="aspect-[4/3] w-full bg-slate-100"
          // Whole image, never cropped (letterboxed inside the gallery-sized 4:3 frame).
          imageFit="contain"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.02]"
          fallbackText={title}
          fallbackSources={usableImages.filter((_, index) => index !== activeIndex)}
          loading={imageLoading}
        />
        </div>
      </ViewControl>
      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="space-y-2">
          <h3 className="font-display text-base font-bold leading-snug text-slate-900">{title}</h3>
          <StartingPriceTag price={price} />
        </div>
        <ViewControl
          href={href}
          onView={onView}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-blue-600 hover:text-blue-700"
        >
          View
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ViewControl>
      </div>
    </article>
  );
};
