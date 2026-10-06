import React, { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../../services/firestoreMediaService';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9' | 'auto';
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  fit?: 'cover' | 'contain';
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  aspectRatio = 'auto',
  className = '',
  fallbackSrc,
  priority = false,
  fit = 'cover',
  ...props
}) => {
  const { onLoad, onError, ...imageProps } = props;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [resolvedSrc, setResolvedSrc] = useState('');

  const aspectStyles = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '21/9': 'aspect-[21/9]',
    auto: '',
  };

  const validSrc = src && typeof src === 'string' && src.trim() !== '' ? src.trim() : null;
  const validFallback = fallbackSrc && typeof fallbackSrc === 'string' && fallbackSrc.trim() !== '' ? fallbackSrc.trim() : null;
  const candidates = Array.from(new Set([validSrc, validFallback].filter((candidate): candidate is string => Boolean(candidate))));
  const activeCandidate = candidates[candidateIndex] || '';

  const advanceCandidate = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((index) => index + 1);
    } else {
      setHasError(true);
    }
  };

  useEffect(() => {
    setCandidateIndex(0);
    setIsLoaded(false);
    setHasError(false);
    setResolvedSrc('');
  }, [validSrc, validFallback]);

  useEffect(() => {
    let isCurrent = true;
    if (!activeCandidate) {
      setHasError(true);
      return () => {
        isCurrent = false;
      };
    }

    resolveMediaUrl(activeCandidate)
      .then((url) => {
        if (!isCurrent) return;
        if (url) {
          setResolvedSrc(url);
        } else {
          advanceCandidate();
        }
      })
      .catch((error) => {
        console.warn('[Image] Media URL resolution failed:', error);
        if (isCurrent) advanceCandidate();
      });

    return () => {
      isCurrent = false;
    };
  }, [activeCandidate, candidateIndex, candidates.length]);

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    onError?.(event);
    setIsLoaded(false);
    advanceCandidate();
  };

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    onLoad?.(event);
    setIsLoaded(true);
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 rounded-xl transform-gpu will-change-transform ${aspectStyles[aspectRatio]} ${className}`}
    >
      {/* Premium Shimmer Skeleton while loading */}
      {!isLoaded && !hasError && activeCandidate && (
        <div className="absolute inset-0 bg-slate-200/70 overflow-hidden z-10">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      )}

      {hasError ? (
        <div role="img" aria-label={alt || 'Image unavailable'} className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 select-none">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-display font-bold text-slate-400 mb-1">
            M
          </div>
        </div>
      ) : resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority ? { fetchPriority: 'high' as any } : { fetchPriority: 'auto' as any })}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-500 ease-out transform-gpu will-change-transform ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
          }`}
          {...imageProps}
        />
      ) : null}
    </div>
  );
};
