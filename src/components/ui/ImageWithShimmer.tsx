import React, { useState } from 'react';
import { CrossfadeImage } from '../common/CrossfadeImage';

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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasFailed = failedSrc === src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!hasFailed ? (
        <CrossfadeImage
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          className="absolute inset-0"
          imageClassName={imageClassName}
          onError={() => setFailedSrc(src)}
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
