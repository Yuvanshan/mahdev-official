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
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
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
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white p-8">
            {division.logoUrl && (
              <img
                src={division.logoUrl}
                alt={`${division.name} logo`}
                loading="lazy"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
            )}
          </div>
        )}
        {division.isComingSoon && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-slate-950">{division.name}</h2>
        </div>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-blue-700" />
      </div>
    </a>
  );
};
