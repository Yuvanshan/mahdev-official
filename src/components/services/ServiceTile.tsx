import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ImageWithShimmer } from '../ui/ImageWithShimmer';
import { useAutoSlideImage } from '../../hooks/useAutoSlideImage';

interface ServiceTileProps {
  title: string;
  images: string[];
  onView: () => void;
  imageLoading?: 'eager' | 'lazy';
}

/**
 * Compact service card used everywhere services are listed: image, title and
 * a View button. Images use the same 4:3 frame as gallery images. Full
 * details (description, features, price, booking) open from View.
 */
export const ServiceTile: React.FC<ServiceTileProps> = ({ title, images, onView, imageLoading = 'lazy' }) => {
  const usableImages = images.filter(Boolean);
  const { activeIndex, containerRef } = useAutoSlideImage(usableImages.length);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <button
        type="button"
        onClick={onView}
        aria-label={`View ${title}`}
        className="relative block w-full text-left"
      >
        <div ref={containerRef}>
        <ImageWithShimmer
          src={usableImages[activeIndex] || usableImages[0] || ''}
          alt={title}
          className="aspect-[4/3] w-full bg-slate-100"
          imageClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          fallbackText={title}
          fallbackSources={usableImages.filter((_, index) => index !== activeIndex)}
          loading={imageLoading}
        />
        </div>
      </button>
      <div className="flex flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
        <h3 className="font-display text-base font-bold leading-snug text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onView}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-blue-600 hover:text-blue-700"
        >
          View
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
