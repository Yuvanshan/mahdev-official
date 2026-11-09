import { type FC, useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

interface SeasonalLottieProps {
  path: string;
  amount: number;
  isPlaying: boolean;
  preserveAspectRatio?: string;
  className?: string;
  opacityScale?: number;
}

export const SeasonalLottie: FC<SeasonalLottieProps> = ({
  path,
  amount,
  isPlaying,
  preserveAspectRatio = 'xMidYMid slice',
  className,
  opacityScale = 0.48,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const isEnabled = amount > 0;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (!isEnabled) return;
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let animation: AnimationItem | undefined;
    void import('lottie-web')
      .then(({ default: lottie }) => {
        if (!active) return;
        animation = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          path,
          rendererSettings: {
            preserveAspectRatio,
            progressiveLoad: true,
          },
        });
        animationRef.current = animation;
        animation.addEventListener('data_failed', () => {
          console.error(`[SeasonalLottie] Animation data could not be loaded: ${path}`);
        });
        if (isPlayingRef.current) animation.play();
      })
      .catch((error: unknown) => {
        console.error(`[SeasonalLottie] Animation player could not be loaded: ${path}`, error);
      });

    return () => {
      active = false;
      animation?.destroy();
      animationRef.current = null;
    };
  }, [isEnabled, path, preserveAspectRatio]);

  useEffect(() => {
    if (isPlaying) animationRef.current?.play();
    else animationRef.current?.pause();
  }, [isPlaying]);

  if (!isEnabled) return null;

  return (
    <div
      ref={containerRef}
      className={`seasonal-lottie${className ? ` ${className}` : ''}`}
      style={{ opacity: Math.min(amount, 100) / 100 * opacityScale }}
      aria-hidden="true"
    />
  );
};
