import React, { useEffect, useRef, useState } from 'react';

interface CrossfadeImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'auto' | 'sync';
  onLoad?: () => void;
  onError?: () => void;
}

const CrossfadeSlide: React.FC<{
  src: string;
  alt: string;
  className: string;
  loading: 'eager' | 'lazy';
  decoding: 'async' | 'auto' | 'sync';
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, loading, decoding, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const finishedRef = useRef(false);

  const handleLoad = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsLoaded(true);
    onError?.();
  };

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) handleLoad();
  }, [src]);

  return (
    <>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="image-shimmer absolute inset-0 z-10"
        />
      )}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    </>
  );
};

export const CrossfadeImage: React.FC<CrossfadeImageProps> = ({
  src,
  alt,
  className = '',
  imageClassName = '',
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
}) => (
  <div className={`overflow-hidden ${className}`}>
    <CrossfadeSlide
      key={src}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onLoad={onLoad}
      onError={onError}
      className={imageClassName}
    />
  </div>
);
