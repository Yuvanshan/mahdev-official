import {
  extractTranslatable,
  isTranslatableCollection,
  TRANSLATION_LANGS,
  type TranslationLang,
  type TranslationMap,
} from '../../../shared/config/translatableFields.js';
import { mergeData, type TursoDocument, type TursoWrite } from '../../db/tursoDatabase.js';
import type { TranslationService } from './translationService.js';

/** Save-time translation budget so admin saves stay fast. */
export const ADMIN_SAVE_TIMEOUT_MS = 8000;
/** Texts translated per save; the rest is left pending for the runtime endpoint. */
export const MAX_TEXTS_PER_SAVE = 200;

export interface AdminWriteTranslationDeps {
  service: TranslationService;
  loadExisting: (write: TursoWrite) => Promise<TursoDocument | null>;
  timeoutMs?: number;
}

type LangMaps = Record<TranslationLang, TranslationMap>;

interface Plan {
  write: TursoWrite;
  english: Record<string, string>;
  kept: LangMaps;
  needed: Record<TranslationLang, string[]>;
  skippedForLimit: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readLangMap(bag: unknown, lang: TranslationLang): TranslationMap {
  const map = isRecord(bag) && isRecord(bag[lang]) ? (bag[lang] as Record<string, unknown>) : {};
  return Object.fromEntries(Object.entries(map).filter(([, value]) => typeof value === 'string' && value.trim())) as TranslationMap;
}

/** Concrete paths an admin edited by hand. Accepts 'path' (both languages) or 'lang:path'. */
function lockedPaths(doc: Record<string, unknown>, lang: TranslationLang): Set<string> {
  const raw = Array.isArray(doc.translationsLocked) ? doc.translationsLocked : [];
  const paths = raw.filter((item): item is string => typeof item === 'string');
  return new Set(paths.flatMap((item) => {
    const [prefix, ...rest] = item.split(':');
    if (rest.length > 0 && (TRANSLATION_LANGS as readonly string[]).includes(prefix)) return prefix === lang ? [rest.join(':')] : [];
    return [item];
  }));
}

function docKey(write: TursoWrite): string {
  return `${write.collection}/${write.id}`;
}

export function isTranslatableWrite(write: TursoWrite): boolean {
  return (
    (write.type === 'set' || write.type === 'update') &&
    write.parentPath === '' &&
    isRecord(write.data) &&
    isTranslatableCollection(docKey(write))
  );
}

function planWrite(write: TursoWrite, existing: TursoDocument | null): Plan {
  const incoming = write.data as Record<string, unknown>;
  const keepsExisting = Boolean(write.merge || write.type === 'update');
  const effective = keepsExisting && existing ? mergeData(existing.data, incoming) : incoming;
  const english = extractTranslatable(docKey(write), { ...effective, id: write.id });
  const oldEnglish = existing ? extractTranslatable(docKey(write), { ...existing.data, id: write.id }) : {};

  const kept = {} as LangMaps;
  const needed = {} as Record<TranslationLang, string[]>;
  for (const lang of TRANSLATION_LANGS) {
    // Translations the doc already has: stored ones, overridden by anything the admin sent.
    const stored = { ...readLangMap(existing?.data.translations, lang), ...readLangMap(incoming.translations, lang) };
    const locked = lockedPaths(effective, lang);
    kept[lang] = {};
    needed[lang] = [];
    for (const [path, text] of Object.entries(english)) {
      const current = stored[path];
      const unchanged = !existing || oldEnglish[path] === text;
      if (current && (locked.has(path) || unchanged)) kept[lang][path] = current;
      else needed[lang].push(path);
    }
  }
  return { write, english, kept, needed, skippedForLimit: false };
}

function finishWrite(plan: Plan, fresh: Record<TranslationLang, Record<string, string>>): TursoWrite {
  const translations = {} as LangMaps;
  let pending = plan.skippedForLimit;
  for (const lang of TRANSLATION_LANGS) {
    translations[lang] = { ...plan.kept[lang] };
    for (const path of plan.needed[lang]) {
      const translated = fresh[lang][plan.english[path]];
      if (translated) translations[lang][path] = translated;
      else pending = true;
    }
  }
  return {
    ...plan.write,
    data: { ...(plan.write.data as Record<string, unknown>), translations, translationsPending: pending },
  };
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => { controller.abort(); resolve(null); }, ms);
  });
  try {
    return await Promise.race([run(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Adds `translations` (ta, si) to every translatable ADMIN write. Only changed or missing
 * fields are translated. Any failure or timeout still returns the write, marked
 * `translationsPending: true`, so a save is never blocked. Callers must call this for
 * admin-authenticated writes only (it spends provider budget).
 */
export async function addTranslationsToWrites(writes: TursoWrite[], deps: AdminWriteTranslationDeps): Promise<TursoWrite[]> {
  const candidates = writes.filter(isTranslatableWrite);
  if (candidates.length === 0) return writes;

  const plans = new Map<TursoWrite, Plan>();
  try {
    for (const write of candidates) {
      plans.set(write, planWrite(write, await deps.loadExisting(write)));
    }
  } catch {
    // Could not read the stored docs: save as is and let the runtime endpoint cover it.
    return writes.map((write) => (isTranslatableWrite(write)
      ? { ...write, data: { ...write.data, translationsPending: true } }
      : write));
  }

  // One translation call per language for the whole save, capped for cost and speed.
  const wanted = {} as Record<TranslationLang, Set<string>>;
  for (const lang of TRANSLATION_LANGS) wanted[lang] = new Set();
  for (const plan of plans.values()) {
    for (const lang of TRANSLATION_LANGS) {
      for (const path of plan.needed[lang]) {
        const text = plan.english[path];
        if (wanted[lang].has(text)) continue;
        if (wanted[lang].size >= MAX_TEXTS_PER_SAVE) { plan.skippedForLimit = true; plan.needed[lang] = plan.needed[lang].filter((p) => p !== path); continue; }
        wanted[lang].add(text);
      }
    }
  }

  const fresh = {} as Record<TranslationLang, Record<string, string>>;
  for (const lang of TRANSLATION_LANGS) fresh[lang] = {};
  if (TRANSLATION_LANGS.some((lang) => wanted[lang].size > 0)) {
    const done = await withTimeout(async (signal) => {
      await Promise.all(TRANSLATION_LANGS.map(async (lang) => {
        fresh[lang] = await deps.service.translate([...wanted[lang]], lang, { signal });
      }));
      return true;
    }, deps.timeoutMs ?? ADMIN_SAVE_TIMEOUT_MS).catch(() => null);
    if (!done) for (const lang of TRANSLATION_LANGS) fresh[lang] = {};
  }

  return writes.map((write) => {
    const plan = plans.get(write);
    return plan ? finishWrite(plan, fresh) : write;
  });
}
