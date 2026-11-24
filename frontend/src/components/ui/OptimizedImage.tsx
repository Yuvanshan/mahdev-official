import React, { useEffect, useState } from 'react';
import { optimizedImageSrcSet, optimizedImageUrl } from '../../utils/optimizedImage';
import type { OptimizedImageWidth } from '../../utils/optimizedImage';

type OptimizedImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  src: string;
  optimizedWidth?: OptimizedImageWidth;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  optimizedWidth = 1080,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) => {
  const [useOriginalSource, setUseOriginalSource] = useState(false);
  const optimizedSrc = optimizedImageUrl(src, optimizedWidth);
  const optimizedSrcSet = optimizedImageSrcSet(src);

  useEffect(() => {
    setUseOriginalSource(false);
  }, [src]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (!useOriginalSource && (optimizedSrc !== src || optimizedSrcSet)) {
      setUseOriginalSource(true);
      return;
    }
    onError?.(event);
  };

  return (
    <img
      {...props}
      src={useOriginalSource ? src : optimizedSrc}
      srcSet={useOriginalSource ? undefined : optimizedSrcSet}
      loading={loading}
      decoding={decoding}
      onError={handleError}
    />
  );
};
