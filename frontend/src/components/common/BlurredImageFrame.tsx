import React, { useEffect, useMemo, useState } from 'react';
import { optimizedImageSrcSet, withOptimizedSources } from '../../utils/optimizedImage';
import type { OptimizedImageWidth } from '../../utils/optimizedImage';

interface BlurredImageFrameProps {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallbackSources?: string[];
  loading?: 'eager' | 'lazy';
  imageWidth?: OptimizedImageWidth;
  imageSizes?: string;
}

export const BlurredImageFrame: React.FC<BlurredImageFrameProps> = ({
  src,
  alt,
  className = '',
  imageClassName = '',
  fallbackSources = [],
  loading = 'lazy',
  imageWidth = 640,
  imageSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
}) => {
  const fallbackKey = fallbackSources.join('\n');
  const rawSources = useMemo(
    () => [...new Set([src, ...fallbackSources].filter((source): source is string => Boolean(source)))],
    [src, fallbackKey]
  );
  const sources = useMemo(
    () => [...new Set(withOptimizedSources(rawSources, imageWidth))],
    [rawSources, imageWidth]
  );
  const sourcesKey = sources.join('\n');
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [sourcesKey]);

  const currentSrc = sources[Math.min(sourceIndex, Math.max(0, sources.length - 1))];
  const currentSrcSet = sourceIndex === 0 && rawSources[0] ? optimizedImageSrcSet(rawSources[0]) : undefined;
  return (
    <div className={`relative aspect-[4/5] overflow-hidden bg-slate-100 ${className}`}>
      {currentSrc ? (
        <>
          <img
            key={`background-${currentSrc}`}
            src={currentSrc}
            srcSet={currentSrcSet}
            sizes={imageSizes}
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
            srcSet={currentSrcSet}
            sizes={imageSizes}
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
