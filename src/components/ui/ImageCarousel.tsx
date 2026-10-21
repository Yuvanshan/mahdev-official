import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithShimmer } from './ImageWithShimmer';
import { wrapIndex } from '../services/ServiceDetailsModal';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  /** Tailwind height classes for the photo area. */
  heightClassName?: string;
}

// Minimum horizontal finger movement (px) that counts as a swipe.
const SWIPE_THRESHOLD = 45;

/**
 * Photo slider for a page (e.g. /services/{id}): the whole photo (never cropped),
 * left/right arrows, swipe on touch screens, a counter and thumbnails.
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images: rawImages,
  alt,
  heightClassName = 'h-[50svh] sm:h-[60svh] lg:h-[32rem]',
}) => {
  const images = Array.from(new Set(rawImages.filter(Boolean)));
  const [index, setIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const imagesKey = images.join('\n');

  useEffect(() => setIndex(0), [imagesKey]);

  if (images.length === 0) return null;
  const show = (delta: number) => setIndex((current) => wrapIndex(current, delta, images.length));

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
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(touch.clientY - start.y)) return;
    show(deltaX < 0 ? 1 : -1);
  };

  return (
    <div className="bg-slate-950" role="region" aria-roledescription="carousel" aria-label={`${alt} photos`}>
      <div
        className={`relative w-full touch-pan-y ${heightClassName}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') show(-1);
          if (event.key === 'ArrowRight') show(1);
        }}
        tabIndex={images.length > 1 ? 0 : undefined}
      >
        <ImageWithShimmer
          src={images[index]}
          alt={`${alt} – photo ${index + 1} of ${images.length}`}
          className="absolute inset-0"
          imageFit="contain"
          fallbackText={alt}
          loading="eager"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => show(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-900 shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => show(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-900 shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-white" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((image, imageIndex) => (
            <button
              key={`${image}-${imageIndex}`}
              type="button"
              onClick={() => setIndex(imageIndex)}
              aria-label={`Show photo ${imageIndex + 1}`}
              aria-current={imageIndex === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${imageIndex === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <ImageWithShimmer src={image} alt="" className="absolute inset-0" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
