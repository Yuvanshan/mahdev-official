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
    <section className="bg-slate-50">
      <div className="mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 items-center gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:min-h-[600px] lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-10 lg:py-16">
        <div className="max-w-xl">
          {hero.badgeText && (
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {hero.badgeText}
            </p>
          )}
          {(hero.titleLine1 || hero.titleHighlight || hero.titleLine2) && (
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {hero.titleLine1}
              {hero.titleHighlight && <span className="block text-blue-700">{hero.titleHighlight}</span>}
              {hero.titleLine2 && <span className="block">{hero.titleLine2}</span>}
            </h1>
          )}
          {hero.description && (
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              {hero.description}
            </p>
          )}
          {(hero.primaryCtaLabel || hero.secondaryCtaLabel) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {hero.primaryCtaLabel && (
                <button
                  type="button"
                  onClick={() =>
                    navigateTo(hero.primaryCtaLink, onExploreServices || onExploreMahdev)
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
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
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-500"
                >
                  {hero.secondaryCtaLabel}
                </button>
              )}
            </div>
          )}
          {hero.metrics?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-slate-200 pt-5">
              {hero.metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`} className="text-sm text-slate-600">
                  <strong className="text-slate-950">{metric.value}</strong>
                  <span className="ml-1">{metric.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-slate-200 sm:min-h-[390px] lg:min-h-[480px]">
          {hero.mediaType === 'image' && imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <video
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
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
};
