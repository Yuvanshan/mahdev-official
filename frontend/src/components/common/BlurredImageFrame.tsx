import React, { useEffect, useMemo, useState } from 'react';

interface BlurredImageFrameProps {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackSources?: string[];
  loading?: 'eager' | 'lazy';
}

export const BlurredImageFrame: React.FC<BlurredImageFrameProps> = ({
  src,
  alt,
  className = '',
  imageClassName = '',
  fallbackSources = [],
  loading = 'lazy',
}) => {
  const fallbackKey = fallbackSources.join('\n');
  const sources = useMemo(
    () => [...new Set([src, ...fallbackSources].filter((source): source is string => Boolean(source)))],
    [src, fallbackKey]
  );
  const sourcesKey = sources.join('\n');
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [sourcesKey]);

  const currentSrc = sources[Math.min(sourceIndex, Math.max(0, sources.length - 1))];
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-slate-100 ${className}`}>
      {currentSrc ? (
        <>
          <img
            key={`background-${currentSrc}`}
            src={currentSrc}
            alt=""
            aria-hidden="true"
            loading={loading}
            draggable={false}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
          />
          <img
            key={`foreground-${currentSrc}`}
            src={currentSrc}
            alt={alt}
            loading={loading}
            draggable={false}
            onError={(event) => {
              if (sourceIndex < sources.length - 1) setSourceIndex((index) => index + 1);
              else event.currentTarget.style.visibility = 'hidden';
            }}
            className={`relative h-full w-full object-contain ${imageClassName}`}
          />
        </>
      ) : (
        <div className="h-full w-full" aria-hidden="true" />
      )}
    </div>
  );
};
