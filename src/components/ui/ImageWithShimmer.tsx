import React, { useState } from 'react';
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
  showShimmer?: boolean;
}

export const ImageWithShimmer: React.FC<ImageWithShimmerProps> = ({
  src,
  fallbackSources = EMPTY_IMAGE_SOURCES,
  alt,
  className,
  imageClassName = '',
  loading = 'lazy',
  fallbackText,
  showShimmer = true,
}) => {
  const [hasLoadedImage, setHasLoadedImage] = useState(false);
  const sourceCandidates = getImageSourceCandidates(src, fallbackSources);
  const candidateKey = sourceCandidates.join('\n');
  const hasPositionClass = className
    .split(/\s+/)
    .some((className) => ['static', 'fixed', 'absolute', 'relative', 'sticky'].includes(className));

  return (
    <ImageSourceSequence
      candidateKey={candidateKey}
      sourceCandidates={sourceCandidates}
      alt={alt}
      className={`${hasPositionClass ? '' : 'relative'} overflow-hidden ${className}`}
      imageClassName={imageClassName}
      loading={loading}
      fallbackText={fallbackText}
      showShimmer={showShimmer && !hasLoadedImage}
      onImageLoad={() => setHasLoadedImage(true)}
    />
  );
};

const ImageSourceSequence: React.FC<{
  candidateKey: string;
  sourceCandidates: string[];
  alt: string;
  className: string;
  imageClassName: string;
  loading: 'eager' | 'lazy';
  fallbackText?: string;
  showShimmer: boolean;
  onImageLoad: () => void;
}> = ({ candidateKey, sourceCandidates, alt, className, imageClassName, loading, fallbackText, showShimmer, onImageLoad }) => {
  const [sequence, setSequence] = useState({ candidateKey, sourceIndex: 0 });
  const sourceIndex = sequence.candidateKey === candidateKey ? sequence.sourceIndex : 0;
  const currentSrc = sourceCandidates[sourceIndex] || '';

  return (
    <div className={className}>
      {currentSrc ? (
        <CrossfadeImage
          src={currentSrc}
          alt={alt}
          loading={loading}
          decoding="async"
          showShimmer={showShimmer}
          onLoad={onImageLoad}
          className="absolute inset-0"
          imageClassName={imageClassName}
          onError={() =>
            setSequence((current) => ({
              candidateKey,
              sourceIndex:
                Math.min(
                  (current.candidateKey === candidateKey ? current.sourceIndex : 0) + 1,
                  sourceCandidates.length
                ),
            }))
          }
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
