import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { seasonalThemeService } from '../services/seasonalThemeService';
import { resolveMediaUrl } from '../services/firestoreMediaService';
import { DEFAULT_SEASONAL_THEME, SeasonalThemeConfig } from '../types/seasonalTheme';

interface SeasonalThemeContextValue {
  theme: SeasonalThemeConfig;
  isLoading: boolean;
  refresh: () => Promise<void>;
  publish: (theme: SeasonalThemeConfig) => Promise<SeasonalThemeConfig>;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextValue | undefined>(undefined);

export const SeasonalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_SEASONAL_THEME);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setTheme(await seasonalThemeService.getPublished());
    } catch (error) {
      console.warn('[SeasonalTheme] Published appearance unavailable; using default theme.', error);
      setTheme(DEFAULT_SEASONAL_THEME);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!theme.enabled || theme.activationMode !== 'schedule') return;
    const now = Date.now();
    const nextTransition = theme.schedules
      .flatMap((schedule) => [Date.parse(schedule.startAt), Date.parse(schedule.endAt)])
      .filter((timestamp) => Number.isFinite(timestamp) && timestamp > now)
      .sort((left, right) => left - right)[0];
    if (nextTransition === undefined) return;
    const timeout = window.setTimeout(() => {
      void refresh();
    }, Math.min(nextTransition - now + 1000, 24 * 60 * 60 * 1000));
    return () => window.clearTimeout(timeout);
  }, [refresh, theme.activationMode, theme.enabled, theme.schedules]);

  useEffect(() => {
    const activeTheme = theme.enabled ? theme.activeTheme : 'default';
    document.documentElement.dataset.seasonalTheme = activeTheme;
    document.documentElement.dataset.seasonalEffectIntensity = theme.effectIntensity;
    const favicons = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
    );
    let active = true;
    const rawFavicon = activeTheme === 'christmas' ? theme.seasonalFavicon : undefined;
    if (favicons.length > 0 && rawFavicon) {
      resolveMediaUrl(rawFavicon)
        .then((url) => {
          if (active) favicons.forEach((favicon) => { favicon.href = url || '/favicon.png'; });
        })
        .catch((error: unknown) => {
          console.error('[SeasonalTheme] Seasonal favicon could not be resolved:', error);
          if (active) favicons.forEach((favicon) => { favicon.href = '/favicon.png'; });
        });
    } else if (favicons.length > 0) {
      favicons.forEach((favicon) => { favicon.href = '/favicon.png'; });
    }
    return () => {
      active = false;
      delete document.documentElement.dataset.seasonalTheme;
      delete document.documentElement.dataset.seasonalEffectIntensity;
      favicons.forEach((favicon) => { favicon.href = '/favicon.png'; });
    };
  }, [theme]);

  const publish = useCallback(async (nextTheme: SeasonalThemeConfig) => {
    const published = await seasonalThemeService.publish(nextTheme);
    setTheme(published);
    return published;
  }, []);

  const value = useMemo(() => ({ theme, isLoading, refresh, publish }), [theme, isLoading, refresh, publish]);
  return <SeasonalThemeContext.Provider value={value}>{children}</SeasonalThemeContext.Provider>;
};

export function useSeasonalTheme(): SeasonalThemeContextValue {
  const value = useContext(SeasonalThemeContext);
  if (!value) throw new Error('useSeasonalTheme must be used within a SeasonalThemeProvider.');
  return value;
}
