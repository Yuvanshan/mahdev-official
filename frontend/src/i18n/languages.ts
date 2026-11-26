/**
 * Languages the public website supports.
 *
 * Fonts: Plus Jakarta Sans has no Tamil or Sinhala glyphs, so the browser falls back
 * per character to a system font (Nirmala UI on Windows, Tamil/Sinhala Sangam MN on
 * Apple devices, Noto Sans Tamil/Sinhala on Android and Linux). The html `lang`
 * attribute below makes the browser pick the right fallback. No font files are added:
 * the CSP only allows `font-src 'self' data:`, and a CDN font would be blocked.
 */

export type Lang = 'en' | 'ta' | 'si';
export type TranslatedLang = Exclude<Lang, 'en'>;

export interface LanguageOption {
  code: Lang;
  /** Name in its own script, shown in the switcher. */
  label: string;
  /** Value for the html `lang` attribute. */
  htmlLang: string;
}

export const DEFAULT_LANG: Lang = 'en';
export const LANG_STORAGE_KEY = 'mahdev_lang';

export const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'ta', label: 'தமிழ்', htmlLang: 'ta' },
  { code: 'si', label: 'සිංහල', htmlLang: 'si' },
];

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'ta' || value === 'si';
}

export function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    // Storage blocked (private mode): fall back to English.
    return DEFAULT_LANG;
  }
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage blocked: the choice simply lasts for this page view.
  }
}
