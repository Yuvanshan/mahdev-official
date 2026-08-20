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
      className={`relative overflow-hidden bg-slate-100 rounded-xl ${aspectStyles[aspectRatio]} ${className}`}
    >
      {/* Premium Shimmer Skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200/70 overflow-hidden z-10">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      )}

      {hasError && !fallbackSrc ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400 text-xs p-4 text-center select-none">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-display font-bold text-slate-400 mb-1">
            M
          </div>
          <span className="text-[11px]">Mahdev Asset</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
          }`}
          {...props}
        />
      )}
    </div>
  );
};

