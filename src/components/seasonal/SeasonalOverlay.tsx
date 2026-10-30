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

export const SeasonalHeroEffect: React.FC = () => {
  const { theme } = useSeasonalTheme();
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [isVisible, setIsVisible] = useState(() => document.visibilityState === 'visible');
  const activeTheme = theme.enabled ? theme.activeTheme : 'default';

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const updateDevice = () => setIsMobile(query.matches);
    const updateVisibility = () => setIsVisible(document.visibilityState === 'visible');
    query.addEventListener('change', updateDevice);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      query.removeEventListener('change', updateDevice);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  if (
    reducedMotion ||
    !theme.heroAnimation ||
    (isMobile ? !theme.mobile : !theme.desktop) ||
    activeTheme !== 'christmas'
  ) return null;

  return (
    <div className="seasonal-hero-flight seasonal-christmas-flight" aria-hidden="true">
      <SeasonalLottie
        path="/animations/seasonal/christmas-santa.json"
        amount={100}
        isPlaying={isVisible}
        preserveAspectRatio="xMidYMid meet"
        opacityScale={1}
      />
      <svg viewBox="0 0 42 38" className="seasonal-gift-drop seasonal-gift-drop-1">
        <rect x="4" y="12" width="34" height="23" rx="3" fill="#c6283d" stroke="#ffe6aa" strokeWidth="1.5" />
        <path d="M21 12v23M4 20h34M21 12c-13 0-13-10-6-9 4 1 6 6 6 9Zm0 0c13 0 13-10 6-9-4 1-6 6-6 9Z" fill="none" stroke="#ffe6aa" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 42 38" className="seasonal-gift-drop seasonal-gift-drop-2">
        <rect x="5" y="13" width="32" height="22" rx="3" fill="#26764d" stroke="#fff0bd" strokeWidth="1.5" />
        <path d="M21 13v22M5 21h32M21 13c-12 0-12-9-6-8 4 1 6 5 6 8Zm0 0c12 0 12-9 6-8-4 1-6 5-6 8Z" fill="none" stroke="#fff0bd" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 42 38" className="seasonal-gift-drop seasonal-gift-drop-3">
        <rect x="7" y="14" width="28" height="20" rx="3" fill="#3155a0" stroke="#ffe6aa" strokeWidth="1.5" />
        <path d="M21 14v20M7 21h28M21 14c-11 0-10-8-5-7 3 1 5 4 5 7Zm0 0c11 0 10-8 5-7-3 1-5 4-5 7Z" fill="none" stroke="#ffe6aa" strokeWidth="2" />
      </svg>
    </div>
  );
};
