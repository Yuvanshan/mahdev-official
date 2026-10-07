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

  return (
    <button
      type="button"
      onClick={() => onNavigate(division.route)}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {mediaUrl && division.mediaType === 'video' ? (
          <video
            src={mediaUrl}
            autoPlay
            loop
            muted
            playsInline
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
        ) : null}
        {division.isComingSoon && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700">
            Coming soon
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-slate-950">{division.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{division.description}</p>
        </div>
        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-blue-700" />
      </div>
    </button>
  );
};
