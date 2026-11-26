import { isTranslatableText, type TranslationLang } from '../../../shared/config/translatableFields.js';
import { hashText, type TranslationCacheStore } from './cache.js';
import type { TranslationProvider } from './provider.js';

/** Texts sent to the provider in one request. */
export const PROVIDER_CHUNK_TEXTS = 40;
export const PROVIDER_CHUNK_CHARS = 8000;

export interface TranslationServiceDeps {
  /** Null when no API key is set: every miss stays in English. */
  provider: TranslationProvider | null;
  cache: TranslationCacheStore;
  /** Asks permission to spend `count` provider translations (daily cap). Omit for no cap. */
  reserveMisses?: (count: number) => Promise<boolean>;
  warn?: (message: string) => void;
}

export interface TranslateOptions {
  signal?: AbortSignal;
}

const TAG_PATTERN = /<\/?([a-z][a-z0-9-]*)\b[^>]*>/gi;
const TOKEN_PATTERN = /\{\{[^}]*\}\}|\{[^}\s]*\}|%\d*\$?[sd]|https?:\/\/[^\s<>"']+|[\w.+-]+@[\w-]+\.[\w.-]+/gi;

function tagNames(text: string): string[] {
  return [...text.matchAll(TAG_PATTERN)].map((match) => match[1].toLowerCase()).sort();
}

/**
 * Rejects a model answer that dropped a placeholder, URL or email, or that added or
 * removed an HTML tag (the website may render some texts as HTML).
 */
export function preservesStructure(source: string, translated: string): boolean {
  if (!translated.trim()) return false;
  const sourceTags = tagNames(source);
  const translatedTags = tagNames(translated);
  if (sourceTags.length !== translatedTags.length || sourceTags.some((tag, i) => tag !== translatedTags[i])) return false;
  const withoutTags = source.replace(TAG_PATTERN, ' ');
  return (withoutTags.match(TOKEN_PATTERN) ?? []).every((token) => translated.includes(token));
}

function chunkTexts(texts: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let chars = 0;
  for (const text of texts) {
    if (current.length > 0 && (current.length >= PROVIDER_CHUNK_TEXTS || chars + text.length > PROVIDER_CHUNK_CHARS)) {
      chunks.push(current);
      current = [];
      chars = 0;
    }
    current.push(text);
    chars += text.length;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/**
 * English -> Tamil/Sinhala with a persistent cache. Never throws: texts that could not be
 * translated are simply missing from the result, so callers keep showing English.
 */
export class TranslationService {
  constructor(private readonly deps: TranslationServiceDeps) {}

  /** Returns { originalText: translation } for the texts that have a translation. */
  async translate(texts: string[], lang: TranslationLang, options: TranslateOptions = {}): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    // Unique trimmed texts worth translating, each remembering the original strings that map to it.
    const byHash = new Map<string, { source: string; originals: string[] }>();
    for (const original of texts) {
      if (!isTranslatableText(original)) continue;
      const source = original.trim();
      const hash = hashText(source);
      const entry = byHash.get(hash) ?? { source, originals: [] };
      entry.originals.push(original);
      byHash.set(hash, entry);
    }
    if (byHash.size === 0) return result;

    const assign = (hash: string, translated: string) => {
      for (const original of byHash.get(hash)?.originals ?? []) result[original] = translated;
    };

    let cached = new Map<string, string>();
    try {
      cached = await this.deps.cache.getMany([...byHash.keys()], lang);
    } catch {
      this.deps.warn?.('[Translate] Cache lookup failed; continuing without cache.');
    }
    for (const [hash, translated] of cached) assign(hash, translated);

    const missHashes = [...byHash.keys()].filter((hash) => !cached.has(hash));
    if (missHashes.length === 0) return result;
    if (!this.deps.provider) {
      this.deps.warn?.('[Translate] GEMINI_API_KEY is not set; returning English for uncached text.');
      return result;
    }
    if (this.deps.reserveMisses && !(await this.safeReserve(missHashes.length))) {
      this.deps.warn?.('[Translate] Daily translation limit reached; returning English for uncached text.');
      return result;
    }

    const fresh: { hash: string; source: string; translated: string }[] = [];
    const provider = this.deps.provider;
    const chunks = chunkTexts(missHashes.map((hash) => byHash.get(hash)!.source));
    const hashBySource = new Map(missHashes.map((hash) => [byHash.get(hash)!.source, hash]));
    await Promise.all(chunks.map(async (chunk) => {
      try {
        const translations = await provider.translate(chunk, lang, { signal: options.signal });
        chunk.forEach((source, index) => {
          const translated = translations[index]?.trim();
          if (translated && preservesStructure(source, translated)) {
            fresh.push({ hash: hashBySource.get(source)!, source, translated });
          }
        });
      } catch (error) {
        // Short, non-secret message only; texts could be personal so they are never logged.
        this.deps.warn?.(`[Translate] Provider failed (${lang}): ${error instanceof Error ? error.name : 'error'}`);
      }
    }));

    for (const entry of fresh) assign(entry.hash, entry.translated);
    if (fresh.length > 0) {
      try {
        await this.deps.cache.putMany(fresh, lang);
      } catch {
        this.deps.warn?.('[Translate] Could not store translations in the cache.');
      }
    }
    return result;
  }

  private async safeReserve(count: number): Promise<boolean> {
    try {
      return await this.deps.reserveMisses!(count);
    } catch {
      // If the cap cannot be checked, fail closed: no provider spend.
      return false;
    }
  }
}
