import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const DEFAULT_HERO_VIDEO = '/assets/hero_main.mp4';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onContactUs,
  onExploreServices,
}) => {
  const { homepageConfig } = useFirestoreDataContext();
  const hero = homepageConfig?.hero;
  if (!hero) return null;

  const configuredVideo = hero.videoUrl || (hero.mediaType === 'video' ? hero.mediaUrl : '');
  const videoUrl = configuredVideo || DEFAULT_HERO_VIDEO;
  const imageUrl = hero.defaultImageUrl || hero.imageUrl || (hero.mediaType === 'image' ? hero.mediaUrl : '');
  const showVideo = hero.mediaType !== 'image';

  const navigateTo = (destination: string | undefined, fallback: () => void) => {
    const target = destination?.trim();
    if (!target) {
      fallback();
      return;
    }

    if (target.startsWith('#')) {
      const section = document.getElementById(target.slice(1));
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      } else {
        fallback();
      }
    } else if (target.startsWith('/')) {
      onNavigate(target);
    } else if (/^https?:\/\//i.test(target)) {
      window.location.assign(target);
    } else {
      fallback();
    }
  };

  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-slate-950 sm:min-h-[740px] lg:min-h-[min(820px,calc(100svh-5rem))]">
      <div className="absolute inset-0 z-0 bg-slate-900">
        {showVideo ? (
          <video
            key={videoUrl}
            src={videoUrl}
            poster={imageUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            src={DEFAULT_HERO_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/10 sm:via-slate-950/65"
      />
      <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/10" />

      <div className="relative z-20 mx-auto flex min-h-[680px] max-w-7xl items-center px-5 py-20 sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))] lg:px-10">
        <div className="max-w-2xl">
          {hero.badgeText && (
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200 sm:text-sm">
              {hero.badgeText}
            </p>
          )}
          {(hero.titleLine1 || hero.titleHighlight || hero.titleLine2) && (
            <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {hero.titleLine1}
              {hero.titleHighlight && (
                <span className="block bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">
                  {hero.titleHighlight}
                </span>
              )}
              {hero.titleLine2 && <span className="block text-white">{hero.titleLine2}</span>}
            </h1>
          )}
          {hero.description && (
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              {hero.description}
            </p>
          )}
          {(hero.primaryCtaLabel || hero.secondaryCtaLabel) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {hero.primaryCtaLabel && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(hero.primaryCtaLink, onExploreServices || onExploreMahdev)
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-blue-50"
                >
                  {hero.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {hero.secondaryCtaLabel && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(hero.secondaryCtaLink, onContactUs || (() => onNavigate('/contact')))
                  }
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/50 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  {hero.secondaryCtaLabel}
                </button>
              )}
            </div>
          )}
          {hero.metrics?.length > 0 && (
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/25 pt-5">
              {hero.metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="text-sm text-white/70">
                  <strong className="text-white">{metric.value}</strong>
                  <span className="ml-1">{metric.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
