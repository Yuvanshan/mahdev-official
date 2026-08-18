import React, { useState } from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '21/9' | 'auto';
  className?: string;
  fallbackSrc?: string;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  aspectRatio = 'auto',
  className = '',
  fallbackSrc,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectStyles = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '21/9': 'aspect-[21/9]',
    auto: '',
  };

  const imageSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 rounded-lg ${aspectStyles[aspectRatio]} ${className}`}
    >
      {/* Skeleton loader */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200/80 animate-pulse" />
      )}

      {hasError && !fallbackSrc ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs p-4 text-center">
          <span>Image preview unavailable</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
};
