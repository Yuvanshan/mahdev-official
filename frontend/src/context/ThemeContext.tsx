import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

// Same key as public/theme-init.js, which applies the theme before first paint.
const STORAGE_KEY = 'mahdev_theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readPreference = (): ThemePreference => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    // Storage blocked (private mode): fall back to the system setting.
  }
  return 'system';
};

const systemTheme = (): Theme =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [system, setSystem] = useState<Theme>(systemTheme);

  // Follow the OS setting live while the preference is 'system'.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme: Theme = preference === 'system' ? system : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
  }, []);

  const toggle = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [setPreference, theme]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggle }),
    [theme, preference, setPreference, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within a ThemeProvider.');
  return value;
};
