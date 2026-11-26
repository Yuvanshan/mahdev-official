/**
 * Fetches translations for text the bundled dictionaries do not know.
 *
 * Texts are queued, de-duplicated, sent in batches that respect the API limits,
 * retried with back-off on rate limits and network errors, and then given up on
 * quietly (the English text simply stays). Results are cached in memory and in
 * localStorage, so a returning visitor needs no request for text seen before.
 */
import type { TranslatedLang } from './languages';
import { MAX_TEXT_LENGTH } from './textRules';

const ENDPOINT = '/api/translate';
// Build-time switch: when off, the browser never calls the endpoint (cached text still shows).
const TRANSLATE_ENABLED = import.meta.env.VITE_TRANSLATE_ENABLED === 'true';
const MAX_TEXTS_PER_REQUEST = 60;
const MAX_TOTAL_CHARS = 20000;
const DEBOUNCE_MS = 400;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2000;
const MAX_CACHE_ENTRIES = 600;
const CACHE_KEY_PREFIX = 'mahdev_i18n_cache_';

type Listener = () => void;

export interface TranslateClient {
  /** Cached translation, if an earlier request returned one. */
  get(text: string): string | undefined;
  /** Put the text in the queue. Safe to call repeatedly for the same text. */
  request(text: string): void;
  /** Remember translations that are already known (for example stored by the admin). */
  prime(entries: Record<string, string>): void;
  /** Called after new translations arrive. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void;
  /** Stop timers and drop queued work. */
  dispose(): void;
}

type Fetcher = typeof fetch;

export function createTranslateClient(lang: TranslatedLang, fetcher: Fetcher = (input, init) => fetch(input, init)): TranslateClient {
  const cache = new Map<string, string>(loadCache(lang));
  const queued = new Set<string>();
  const inFlight = new Set<string>();
  const attempts = new Map<string, number>();
  const givenUp = new Set<string>();
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let blockedUntil = 0;

  const notify = () => listeners.forEach((listener) => listener());

  function schedule(delay: number) {
    if (disposed || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      void flush();
    }, delay);
  }

  function takeBatch(): string[] {
    const batch: string[] = [];
    let chars = 0;
    for (const text of queued) {
      if (batch.length >= MAX_TEXTS_PER_REQUEST || chars + text.length > MAX_TOTAL_CHARS) break;
      batch.push(text);
      chars += text.length;
    }
    batch.forEach((text) => {
      queued.delete(text);
      inFlight.add(text);
    });
    return batch;
  }

  async function flush(): Promise<void> {
    if (disposed || queued.size === 0) return;
    const wait = blockedUntil - Date.now();
    if (wait > 0) return schedule(wait);

    const batch = takeBatch();
    try {
      const response = await fetcher(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, texts: batch }),
      });
      if (!response.ok) throw new RetryableError(retryAfterMs(response));
      const data: unknown = await response.json();
      applyResult(batch, data);
    } catch (error) {
      retryOrGiveUp(batch, error instanceof RetryableError ? error.delayMs : undefined);
    }
    if (queued.size > 0) schedule(DEBOUNCE_MS);
  }

  function applyResult(batch: string[], data: unknown) {
    const translations = (data as { translations?: Record<string, unknown> } | null)?.translations ?? {};
    let changed = false;
    for (const text of batch) {
      inFlight.delete(text);
      const translated = translations[text];
      if (typeof translated === 'string' && translated.trim() && translated !== text) {
        cache.set(text, translated);
        changed = true;
      } else {
        givenUp.add(text); // the server has no translation: keep English
      }
    }
    if (changed) {
      scheduleSave();
      notify();
    }
  }

  function retryOrGiveUp(batch: string[], serverDelay?: number) {
    let delay = 0;
    for (const text of batch) {
      inFlight.delete(text);
      const used = (attempts.get(text) ?? 0) + 1;
      attempts.set(text, used);
      if (used >= MAX_ATTEMPTS) {
        givenUp.add(text);
        continue;
      }
      queued.add(text);
      delay = Math.max(delay, serverDelay ?? BASE_BACKOFF_MS * 2 ** (used - 1));
    }
    // Hold back every later batch too, so a 429 is not hammered.
    if (delay > 0) blockedUntil = Date.now() + delay;
  }

  function scheduleSave() {
    if (saveTimer !== undefined) return;
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      saveCache(lang, cache);
    }, 1000);
  }

  return {
    get: (text) => cache.get(text),
    request(text) {
      if (!TRANSLATE_ENABLED || disposed || cache.has(text) || queued.has(text) || inFlight.has(text) || givenUp.has(text)) return;
      if (text.length > MAX_TEXT_LENGTH) return;
      queued.add(text);
      schedule(DEBOUNCE_MS);
    },
    prime(entries) {
      let changed = false;
      for (const [text, translated] of Object.entries(entries)) {
        if (typeof translated === 'string' && translated && !cache.has(text)) {
          cache.set(text, translated);
          changed = true;
        }
      }
      if (changed) notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      if (timer !== undefined) clearTimeout(timer);
      if (saveTimer !== undefined) {
        clearTimeout(saveTimer);
        saveCache(lang, cache);
      }
      listeners.clear();
      queued.clear();
    },
  };
}

class RetryableError extends Error {
  constructor(readonly delayMs?: number) {
    super('translate request failed');
  }
}

function retryAfterMs(response: Response): number | undefined {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 60) * 1000 : undefined;
}

function loadCache(lang: TranslatedLang): Array<[string, string]> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CACHE_KEY_PREFIX + lang) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is [string, string] =>
        Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string',
    );
  } catch {
    return [];
  }
}

function saveCache(lang: TranslatedLang, cache: Map<string, string>): void {
  try {
    // Keep only the newest entries so the stored cache cannot grow without limit.
    const entries = [...cache.entries()].slice(-MAX_CACHE_ENTRIES);
    localStorage.setItem(CACHE_KEY_PREFIX + lang, JSON.stringify(entries));
  } catch {
    // Storage full or blocked: the in-memory cache still works for this visit.
  }
}
