import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Building2, Camera, Code2, Plane, ShoppingBag } from 'lucide-react';
import { DIVISIONS } from '../../config/divisions';
import { DivisionCardItem } from '../../utils/divisionPresentation';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

interface DivisionCardProps {
  division: DivisionCardItem;
  onNavigate: (route: string) => void;
  variant?: 'standard' | 'featured';
  showLogo?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  sws: Building2,
  u1: Camera,
  it: Code2,
  travels: Plane,
  mart: ShoppingBag,
};

export const DivisionCard: React.FC<DivisionCardProps> = ({
  division,
  onNavigate,
  variant = 'standard',
  showLogo = true,
}) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const destination = division.externalUrl || division.route;
  const fallbackImage = variant === 'featured'
    ? DIVISIONS[division.id as keyof typeof DIVISIONS]?.imageUrl || ''
    : '';
  const displayMediaUrl = mediaUrl || division.posterUrl || fallbackImage;
  const CategoryIcon = categoryIcons[division.id] || Building2;

  useEffect(() => {
    let active = true;
    if (!division.mediaUrl) {
      setMediaUrl('');
      return;
    }

    if (!division.mediaUrl.startsWith('firestore://')) {
      setMediaUrl(division.mediaUrl);
      return;
    }

    resolveMediaUrl(division.mediaUrl)
      .then((resolvedUrl) => {
        if (active) setMediaUrl(resolvedUrl);
      })
      .catch((error) => {
        console.error(`[DivisionCard] Could not load media for ${division.id}:`, error);
      });

    return () => {
      active = false;
    };
  }, [division.id, division.mediaUrl]);

  // Poster for video cards; Google treats a video without one as having no thumbnail.
  useEffect(() => {
    let active = true;
    if (!division.posterUrl.startsWith('firestore://')) {
      setPosterUrl(division.posterUrl);
      return;
    }

    resolveMediaUrl(division.posterUrl)
      .then((resolvedUrl) => {
        if (active) setPosterUrl(resolvedUrl);
      })
      .catch((error) => {
        console.error(`[DivisionCard] Could not load poster for ${division.id}:`, error);
      });

    return () => {
      active = false;
    };
  }, [division.id, division.posterUrl]);

  return (
    <a
      href={destination}
      onClick={(event) => {
        event.preventDefault();
        if (division.externalUrl) {
          try {
            const externalUrl = new URL(division.externalUrl);
            if (externalUrl.protocol !== 'https:' || externalUrl.username || externalUrl.password) {
              throw new Error('Division destination must be a secure HTTPS URL.');
            }
            window.location.assign(externalUrl.toString());
          } catch (error) {
            console.error(`[DivisionCard] Invalid external destination for ${division.id}:`, error);
          }
          return;
        }
        onNavigate(division.route);
      }}
      className={`group relative block h-full overflow-hidden rounded-2xl border text-left transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg ${
        variant === 'featured'
          ? 'border-slate-200 bg-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
          : 'border-slate-200 bg-slate-950'
      }`}
    >
      <div className={`division-card-media relative overflow-hidden bg-slate-100 ${variant === 'featured' ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {mediaUrl && division.mediaType === 'video' ? (
          <video
            src={mediaUrl}
            poster={posterUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            preload="metadata"
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        ) : displayMediaUrl ? (
          <img
            src={displayMediaUrl}
            alt={division.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {!displayMediaUrl && <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50" />}
        {variant === 'featured' ? (
          <>
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/95 px-3 py-1 text-[10px] font-bold text-blue-800 shadow-sm">
              <CategoryIcon className="h-3 w-3 text-blue-600" aria-hidden="true" />
              {division.categoryLabel}
            </span>
            {showLogo && division.logoUrl && (
              <div className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-white/95 p-1.5 shadow-sm">
                <img
                  src={division.logoUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
            {division.isComingSoon && (
              <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                Coming soon
              </span>
            )}
          </>
        ) : showLogo && division.logoUrl && (
          <div className="absolute inset-x-[14%] top-[10%] bottom-[23%] flex items-center justify-center rounded-2xl border border-white/60 bg-white/90 p-3 shadow-lg backdrop-blur-sm sm:inset-x-[18%] sm:p-4">
            <img
              src={division.logoUrl}
              alt={`${division.name} logo`}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}
        {variant === 'standard' && <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent px-3 pb-3 pt-10 text-white sm:px-4 sm:pb-4">
          <h2 className="min-w-0 font-display text-sm font-bold leading-tight drop-shadow sm:text-base">{division.name}</h2>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/90 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
        </div>}
        {variant === 'standard' && division.isComingSoon && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[11px]">
            Coming soon
          </span>
        )}
      </div>
      {variant === 'featured' && (
        <div className="flex h-[96px] flex-col border-t border-slate-100 bg-white p-4">
          <h3 className="font-display text-base font-bold leading-snug text-slate-950">{division.name}</h3>
          <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-blue-700">
            Explore {division.categoryLabel}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      )}
    </a>
  );
};
