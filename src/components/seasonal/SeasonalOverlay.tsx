import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useSeasonalTheme } from '../../context/SeasonalThemeContext';
import { SeasonalLottie } from './SeasonalLottie';

const PARTICLES = Array.from({ length: 40 }, (_, index) => ({
  id: index,
  left: `${(index * 37 + 11) % 100}%`,
  delay: `${(index % 9) * -1.7}s`,
  duration: `${9 + (index % 8) * 1.8}s`,
  size: `${4 + (index % 4) * 2}px`,
}));

export const SeasonalOverlay: React.FC = () => {
  const { theme } = useSeasonalTheme();
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const activeTheme = theme.enabled ? theme.activeTheme : 'default';
  const enabledForDevice = isMobile ? theme.mobile : theme.desktop;

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible');
    const query = window.matchMedia('(max-width: 767px)');
    const updateDevice = () => setIsMobile(query.matches);
    document.addEventListener('visibilitychange', updateVisibility);
    query.addEventListener('change', updateDevice);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
      query.removeEventListener('change', updateDevice);
    };
  }, []);

  if (activeTheme === 'default' || !enabledForDevice || reducedMotion) return null;

  const className = `seasonal-overlay seasonal-${activeTheme}`;
  if (activeTheme === 'christmas') {
    return (
      <div className={className} aria-hidden="true">
        <SeasonalLottie
          path="/animations/seasonal/snowfall.json"
          amount={theme.snowAmount}
          isPlaying={isVisible}
          opacityScale={0.42}
        />
      </div>
    );
  }
  if (activeTheme === 'valentines') {
    return (
      <div className={className} aria-hidden="true">
        <SeasonalLottie
          path="/animations/seasonal/flying-hearts.json"
          amount={theme.heartsAmount}
          isPlaying={isVisible}
          opacityScale={0.45}
          className="seasonal-hearts-lottie"
        />
      </div>
    );
  }
  if (activeTheme === 'newYear') {
    return (
      <div className={className} aria-hidden="true">
        <SeasonalLottie
          path="/animations/seasonal/fireworks.json"
          amount={theme.fireworksAmount}
          isPlaying={isVisible}
          opacityScale={0.45}
        />
      </div>
    );
  }

  const baseParticleCount = theme.effectIntensity === 'low' ? 10 : theme.effectIntensity === 'high' ? 32 : 20;
  const particleCount = Math.round(baseParticleCount * theme.sparklesAmount / 100);
  const diyaCount = theme.effectIntensity === 'low' ? 3 : theme.effectIntensity === 'high' ? 7 : 5;

  return (
    <div className={`${className} ${isVisible ? '' : 'seasonal-paused'}`} aria-hidden="true">
      <div className="seasonal-diya-row">
        {Array.from({ length: diyaCount }, (_, lamp) => (
          <svg key={lamp} viewBox="0 0 64 48" className={`seasonal-diya seasonal-diya-${lamp % 3}`}>
            <defs>
              <linearGradient id={`diya-clay-${lamp}`} x1="0" x2="0.9" y1="0" y2="1">
                <stop offset="0" stopColor="#f4b64d" />
                <stop offset=".48" stopColor="#b65c19" />
                <stop offset="1" stopColor="#57230c" />
              </linearGradient>
              <radialGradient id={`diya-oil-${lamp}`} cx=".5" cy=".2" r=".9">
                <stop offset="0" stopColor="#fff4b0" />
                <stop offset="1" stopColor="#c87119" />
              </radialGradient>
              <filter id={`diya-glow-${lamp}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>
            <ellipse cx="32" cy="41" rx="26" ry="4" fill="#ffb02e" opacity=".48" filter={`url(#diya-glow-${lamp})`} />
            <path d="M5 27c4-5 12-9 27-9s23 4 27 9c-5 10-17 15-27 15S10 37 5 27Z" fill={`url(#diya-clay-${lamp})`} stroke="#f8c56d" strokeWidth="1.2" />
            <ellipse cx="32" cy="26.5" rx="25" ry="6.5" fill={`url(#diya-oil-${lamp})`} stroke="#ffe59a" strokeWidth="1" />
            <path d="M31.8 25c-7-7 1-12 1-21 8 8 10 16 1.5 22 5-7 0-10-1-12-1 5-4 7-1.5 11Z" fill="#ff8b22" className="seasonal-flame" />
            <path d="M32.3 24c-3-4 .5-7 .7-12 4 5 5.2 9 .6 13 1.4-3.5.4-5.3-.4-7.3-.6 2.4-2.2 4.1-.9 6.3Z" fill="#fff6bb" className="seasonal-flame-core" />
            <path d="M10 31c9 7 35 9 45 0" fill="none" stroke="#ffd889" strokeWidth="1" opacity=".8" />
          </svg>
        ))}
      </div>
      {PARTICLES.slice(0, particleCount).map((particle) => (
        <span
          key={particle.id}
          className="seasonal-diwali-spark"
          style={{ left: particle.left, animationDelay: particle.delay, animationDuration: particle.duration }}
        />
      ))}
    </div>
  );
};
