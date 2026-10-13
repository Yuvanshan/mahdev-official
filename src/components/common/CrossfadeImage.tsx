import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

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

  return (
    <>
      {!isLoaded && (
        <div
          aria-hidden="true"
          className="image-shimmer absolute inset-0"
        />
      )}
      <motion.img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setIsLoaded(true);
          onError?.();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
    <AnimatePresence initial={false} mode="sync">
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
    </AnimatePresence>
  </div>
);
