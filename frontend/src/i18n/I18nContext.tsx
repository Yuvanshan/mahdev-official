/**
 * Language state for the public website.
 *
 * English is the default and costs nothing: no dictionary is downloaded and no
 * translator runs. When the visitor picks Tamil or Sinhala, the dictionary is loaded
 * on demand and the DOM translator starts (see domTranslator.ts). The admin portal
 * always stays English.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isBrowserOnAdminPortal } from '../config/adminRoutes';
import { createDomTranslator, type DomTranslator } from './domTranslator';
import { LANGUAGES, readStoredLang, storeLang, type Lang, type TranslatedLang } from './languages';
import { chainLookups, isPrivatePath, translateText, type Lookup } from './textRules';
import { createTranslateClient, type TranslateClient } from './translateClient';

type Dictionary = Record<string, string>;

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a fixed English string. Returns the text unchanged until a translation is known. */
  t: (text: string) => string;
}

const dictionaryLoaders: Record<TranslatedLang, () => Promise<{ default: Dictionary }>> = {
  ta: () => import('./dictionaries/ta'),
  si: () => import('./dictionaries/si'),
};

// Outside a provider (tests, prerender) the site simply stays English.
const I18nContext = createContext<I18nContextValue>({ lang: 'en', setLang: () => {}, t: (text) => text });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  // Bumped when a lookup source changes so `t` gives fresh results to its callers.
  const [version, setVersion] = useState(0);
  const lookupRef = useRef<Lookup | null>(null);

  const setLang = useCallback((next: Lang) => {
    storeLang(next);
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGUAGES.find((option) => option.code === lang)?.htmlLang ?? 'en';
    if (lang === 'en') return;

    let cancelled = false;
    let translator: DomTranslator | undefined;
    let client: TranslateClient | undefined;
    let unsubscribe: (() => void) | undefined;

    dictionaryLoaders[lang]()
      .then(({ default: dictionary }) => {
        if (cancelled) return;
        const translateClient = createTranslateClient(lang);
        const lookup = chainLookups(
          (text) => dictionary[text],
          (text) => translateClient.get(text),
        );
        client = translateClient;
        lookupRef.current = lookup;
        translator = createDomTranslator({
          root: document.body,
          lookup,
          request: translateClient.request,
          isEnabled: () => !isBrowserOnAdminPortal(),
          canRequest: () => !isPrivatePath(window.location.pathname),
        });
        unsubscribe = translateClient.subscribe(() => {
          translator?.refresh();
          setVersion((value) => value + 1);
        });
        translator.start();
        setVersion((value) => value + 1);
      })
      .catch((error) => {
        // The dictionary chunk failed to load (offline): the page stays in English.
        console.warn('[i18n] Could not load the dictionary:', error);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      translator?.stop(); // puts the English text back
      client?.dispose();
      lookupRef.current = null;
    };
  }, [lang]);

  const t = useCallback(
    (text: string) => {
      const lookup = lookupRef.current;
      return lang === 'en' || !lookup ? text : (translateText(text, lookup) ?? text);
    },
    // `version` is the signal that lookupRef now holds newer data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, version],
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => useContext(I18nContext);
