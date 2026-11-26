/**
 * Swap English CMS text for the Tamil or Sinhala text the server stored when an admin
 * saved the record. A field with no stored translation keeps its English text.
 *
 * Results are memoised per record, so a record that did not change keeps the same
 * object between renders and React does not re-render what uses it.
 */
import { applyTranslations } from '../../../shared/config/translatableFields.js';
import type { TranslatedLang } from './languages';

const memo = new WeakMap<object, Map<string, object>>();

export function localizeRecord<T extends object>(collection: string, record: T, lang: TranslatedLang): T {
  if (!record || typeof record !== 'object') return record;
  const key = `${lang}|${collection}`;
  const perRecord = memo.get(record) ?? new Map<string, object>();
  memo.set(record, perRecord);
  const cached = perRecord.get(key);
  if (cached) return cached as T;
  const localized = applyTranslations(collection, record, lang);
  perRecord.set(key, localized);
  return localized;
}

export function localizeList<T extends object>(collection: string, list: readonly T[], lang: TranslatedLang): T[] {
  return list.map((record) => localizeRecord(collection, record, lang));
}
