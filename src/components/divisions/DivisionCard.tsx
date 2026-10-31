import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DivisionCardItem } from '../../utils/divisionPresentation';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

interface DivisionCardProps {
  division: DivisionCardItem;
  onNavigate: (route: string) => void;
}

export const DivisionCard: React.FC<DivisionCardProps> = ({ division, onNavigate }) => {
  const [mediaUrl, setMediaUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');

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
      href={division.route}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(division.route);
      }}
      className="group relative block h-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
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
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt={division.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {!mediaUrl && <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-blue-50" />}
        {division.logoUrl && (
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
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent px-3 pb-3 pt-10 text-white sm:px-4 sm:pb-4">
          <h2 className="min-w-0 font-display text-sm font-bold leading-tight drop-shadow sm:text-base">{division.name}</h2>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-white/90 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:h-5 sm:w-5" />
        </div>
        {division.isComingSoon && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:text-[11px]">
            Coming soon
          </span>
        )}
      </div>
    </a>
  );
};
