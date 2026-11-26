import crypto from 'node:crypto';
import { getTursoClient, TRANSLATION_CACHE_TABLE_SQL } from '../../db/tursoDatabase.js';
import type { TranslationLang } from '../../../shared/config/translatableFields.js';

/** sha-256 (hex) of the trimmed source text. */
export function hashText(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

export interface TranslationCacheEntry {
  hash: string;
  source: string;
  translated: string;
}

/** Stores translations by text hash so identical text is translated once. */
export interface TranslationCacheStore {
  /** Returns hash -> translated text for the hashes found. */
  getMany(hashes: string[], lang: TranslationLang): Promise<Map<string, string>>;
  putMany(entries: TranslationCacheEntry[], lang: TranslationLang): Promise<void>;
}

const LOOKUP_CHUNK = 80;

let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  tableReady ??= getTursoClient()
    .execute(TRANSLATION_CACHE_TABLE_SQL)
    .then(() => undefined)
    .catch((error: unknown) => {
      tableReady = null;
      throw error;
    });
  return tableReady;
}

/** Turso (SQLite) implementation. All values go in as bound parameters. */
export class TursoTranslationCache implements TranslationCacheStore {
  async getMany(hashes: string[], lang: TranslationLang): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    if (hashes.length === 0) return found;
    await ensureTable();
    for (let i = 0; i < hashes.length; i += LOOKUP_CHUNK) {
      const chunk = hashes.slice(i, i + LOOKUP_CHUNK);
      const result = await getTursoClient().execute({
        sql: `SELECT hash, translated FROM translation_cache WHERE lang = ? AND hash IN (${chunk.map(() => '?').join(', ')})`,
        args: [lang, ...chunk],
      });
      for (const row of result.rows) found.set(String(row.hash), String(row.translated));
    }
    return found;
  }

  async putMany(entries: TranslationCacheEntry[], lang: TranslationLang): Promise<void> {
    if (entries.length === 0) return;
    await ensureTable();
    await getTursoClient().batch(
      entries.map((entry) => ({
        sql: 'INSERT OR REPLACE INTO translation_cache (hash, lang, source, translated) VALUES (?, ?, ?, ?)',
        args: [entry.hash, lang, entry.source, entry.translated],
      })),
      'write',
    );
  }
}
