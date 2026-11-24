import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizedImageSrcSet, optimizedImageUrl } from '../../utils/optimizedImage';

export interface ShopBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  /** Narrower picture used below 640px wide. */
  mobileImageUrl?: string;
  route: string;
  buttonText?: string;
}

interface ShopBannerSliderProps {
  banners: ShopBanner[];
  onNavigate: (route: string) => void;
}

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;

const OptimizedBannerImage: React.FC<{
  imageUrl: string;
  mobileImageUrl?: string;
  loading: 'eager' | 'lazy';
}> = ({ imageUrl, mobileImageUrl, loading }) => {
  const [useOriginalSources, setUseOriginalSources] = useState(false);
  const desktopSrc = useOriginalSources ? imageUrl : optimizedImageUrl(imageUrl, 1080);
  const desktopSrcSet = useOriginalSources ? undefined : optimizedImageSrcSet(imageUrl);
  const mobileSrcSet = mobileImageUrl
    ? useOriginalSources
      ? mobileImageUrl
      : optimizedImageSrcSet(mobileImageUrl) || mobileImageUrl
    : undefined;

  return (
    <picture>
      {mobileImageUrl && (
        <source media="(max-width: 639px)" sizes="100vw" srcSet={mobileSrcSet} />
      )}
      <img
        src={desktopSrc}
        srcSet={desktopSrcSet}
        sizes="100vw"
        alt=""
        loading={loading}
        fetchPriority={loading === 'eager' ? 'high' : 'low'}
        decoding="async"
        draggable={false}
        onError={() => setUseOriginalSources(true)}
        className="h-full w-full object-cover"
      />
    </picture>
  );
};

// Auto-advancing banner carousel with arrows and dots (Flipkart home banner).
export const ShopBannerSlider: React.FC<ShopBannerSliderProps> = ({ banners, onNavigate }) => {
  const [index, setIndex] = useState(0);
  const count = banners.length;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, index]);

  if (count === 0) return null;
  const go = (delta: number) => setIndex((current) => (current + delta + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured offers"
      className="group/banner relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-sm bg-slate-900 shadow sm:aspect-[16/5] sm:max-h-[26rem]"
      // Swipe left or right to change the banner; vertical scrolling is left alone.
      onTouchStart={(event) => {
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        swiped.current = false;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
    >
      <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((banner, position) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => {
              // A swipe ends with a click on the banner; ignore that one.
              if (swiped.current) return;
              onNavigate(banner.route);
            }}
            aria-hidden={position !== index}
            tabIndex={position === index ? 0 : -1}
            className="relative h-full w-full shrink-0 text-left"
          >
            <OptimizedBannerImage
              imageUrl={banner.imageUrl}
              mobileImageUrl={banner.mobileImageUrl}
              loading={position === 0 ? 'eager' : 'lazy'}
            />
            <span className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-950/30 to-transparent" />
            <span className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center gap-2 px-6 sm:px-12">
              <span className="text-2xl font-bold text-white sm:text-4xl">{banner.title}</span>
              {banner.subtitle && <span className="line-clamp-2 text-sm text-slate-100 sm:text-base">{banner.subtitle}</span>}
              <span className="mt-1 w-fit rounded-sm bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-950">{banner.buttonText || 'Explore'}</span>
            </span>
          </button>
        ))}
      </div>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous banner" className="absolute left-0 top-1/2 hidden h-20 w-10 -translate-y-1/2 items-center justify-center rounded-r-md bg-white/90 text-slate-900 shadow md:flex md:opacity-0 md:group-hover/banner:opacity-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next banner" className="absolute right-0 top-1/2 hidden h-20 w-10 -translate-y-1/2 items-center justify-center rounded-l-md bg-white/90 text-slate-900 shadow md:flex md:opacity-0 md:group-hover/banner:opacity-100">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((banner, position) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Show banner ${position + 1}`}
                className={`h-1.5 rounded-full transition-all ${position === index ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
