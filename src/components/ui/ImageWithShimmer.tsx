import React, { useState } from 'react';

interface ImageWithShimmerProps {
  src: string;
  alt: string;
  className: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  fallbackText?: string;
}

export const ImageWithShimmer: React.FC<ImageWithShimmerProps> = ({
  src,
  alt,
  className,
  imageClassName = '',
  loading = 'lazy',
  fallbackText,
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isLoaded = loadedSrc === src;
  const hasFailed = failedSrc === src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasFailed && (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      {!hasFailed ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={`absolute inset-0 h-full w-full object-cover ${imageClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-4">
          {fallbackText && (
            <span className="text-center text-xs font-semibold text-slate-600">{fallbackText}</span>
          )}
        </div>
      )}
    </div>
  );
};
