import React, { useEffect, useState } from 'react';
import { CrossfadeImage } from '../common/CrossfadeImage';
import { getImageSourceCandidates } from '../../utils/imageSources';

const EMPTY_IMAGE_SOURCES: string[] = [];

interface ImageWithShimmerProps {
  src: string;
  fallbackSources?: string[];
  alt: string;
  className: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  fallbackText?: string;
}

export const ImageWithShimmer: React.FC<ImageWithShimmerProps> = ({
  src,
  fallbackSources = EMPTY_IMAGE_SOURCES,
  alt,
  className,
  imageClassName = '',
  loading = 'lazy',
  fallbackText,
}) => {
  const sourceCandidates = getImageSourceCandidates(src, fallbackSources);
  const candidateKey = sourceCandidates.join('\n');
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSrc = sourceCandidates[sourceIndex] || '';

  useEffect(() => {
    setSourceIndex(0);
  }, [candidateKey]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {currentSrc ? (
        <CrossfadeImage
          key={currentSrc}
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          className="absolute inset-0"
          imageClassName={imageClassName}
          onError={() => setSourceIndex((index) => Math.min(index + 1, sourceCandidates.length))}
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
