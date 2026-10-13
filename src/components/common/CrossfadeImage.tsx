import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface CrossfadeImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'auto' | 'sync';
  showShimmer?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const CrossfadeSlide: React.FC<{
  src: string;
  alt: string;
  className: string;
  loading: 'eager' | 'lazy';
  decoding: 'async' | 'auto' | 'sync';
  showShimmer: boolean;
  onLoad?: () => void;
  onError?: () => void;
}> = ({ src, alt, className, loading, decoding, showShimmer, onLoad, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasLoadedImage, setHasLoadedImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const finishedRef = useRef(false);

  const handleLoad = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setHasLoadedImage(true);
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
      {showShimmer && !hasLoadedImage && !isLoaded && (
        <div
          aria-hidden="true"
          className="image-shimmer absolute inset-0 z-10"
        />
      )}
      <motion.img
        ref={imageRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        whileHover={{ scale: 1.035 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.45, ease: 'easeInOut' },
          scale: { duration: 0.5, ease: 'easeOut' },
        }}
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
  showShimmer = true,
  onLoad,
  onError,
}) => {
  const [hasLoadedImage, setHasLoadedImage] = useState(false);
  const [displayedSrc, setDisplayedSrc] = useState(src);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!src || src === displayedSrc) return;

    let isCurrentRequest = true;
    const preloader = new Image();
    preloader.onload = () => {
      if (isCurrentRequest) setDisplayedSrc(src);
    };
    preloader.onerror = () => {
      if (isCurrentRequest) onErrorRef.current?.();
    };
    preloader.src = src;

    if (preloader.complete && preloader.naturalWidth > 0) {
      setDisplayedSrc(src);
    }

    return () => {
      isCurrentRequest = false;
      preloader.onload = null;
      preloader.onerror = null;
    };
  }, [src, displayedSrc]);

  const handleLoad = () => {
    setHasLoadedImage(true);
    onLoad?.();
  };

  return (
    <div className={`overflow-hidden ${className}`}>
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={displayedSrc}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          <CrossfadeSlide
            src={displayedSrc}
            alt={alt}
            loading={loading}
            decoding={decoding}
            showShimmer={showShimmer && !hasLoadedImage}
            onLoad={handleLoad}
            onError={() => {
              if (displayedSrc === src) onErrorRef.current?.();
            }}
            className={imageClassName}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
