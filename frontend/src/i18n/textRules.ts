/**
 * Pure rules for deciding which text is translated and how it is looked up.
 * No DOM access here, so these are unit-testable in plain Node.
 */

// At least two letters in a row. Single letters come from animated headings that put
// every character in its own element, and they must not be translated one by one.
const WORD = /\p{L}{2}/u;
// Text already in Tamil or Sinhala must never be sent for translation again.
const TAMIL_OR_SINHALA = /[஀-௿඀-෿]/;
const URL_OR_EMAIL = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+$|^\S+@\S+\.\S+$/i;
// Brand words that stay in English: "Mahdev", "Mahdev (Pvt) Ltd", "Mahdev Group".
const BRAND_ONLY = /^[\s(]*(?:mahdev|pvt|ltd|group)(?:[\s.()]+(?:mahdev|pvt|ltd|group))*[\s.)]*$/i;
const TRAILING_PUNCT = /[\s:*]+$/;

export const MAX_TEXT_LENGTH = 1500;

/** Collapse runs of whitespace and trim. This is the dictionary and cache key. */
export function normalise(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Split into leading whitespace, the text to translate, and trailing whitespace. */
export function splitEdges(raw: string): { lead: string; core: string; trail: string } {
  const lead = raw.match(/^\s*/)?.[0] ?? '';
  const trail = raw.slice(lead.length).match(/\s*$/)?.[0] ?? '';
  return { lead, core: raw.slice(lead.length, raw.length - trail.length), trail };
}

/** True when the text is human-readable words that may be translated. */
export function isTranslatable(text: string): boolean {
  const value = normalise(text);
  if (!value || value.length > MAX_TEXT_LENGTH) return false;
  if (!WORD.test(value)) return false; // numbers, prices, dates, phone numbers, lone letters
  if (TAMIL_OR_SINHALA.test(value)) return false;
  if (URL_OR_EMAIL.test(value)) return false;
  if (BRAND_ONLY.test(value)) return false;
  return true;
}

/**
 * Short all-capital labels such as "SWS", "IT" or "NIC" are names or abbreviations. They are
 * never sent to the server (it could rewrite them); the dictionaries can still translate them.
 */
export function isAcronym(text: string): boolean {
  return /^[A-Z0-9&. ]{2,5}$/.test(normalise(text));
}

export type Lookup = (normalisedText: string) => string | undefined;

// Whole numbers and decimals that stand alone ("3 items", "LKR 1,500.00"), not "U1" or "24h".
const STANDALONE_NUMBER = /(?<![\p{L}\d])\d[\d,]*(?:\.\d+)?(?![\p{L}\d])/gu;

/**
 * Replace numbers with {0}, {1}... so "View cart, 3 items" and "View cart, 12 items" share one
 * dictionary entry, one cache entry and one server request. Returns null when there is no number.
 */
export function toTemplate(text: string): { key: string; numbers: string[] } | null {
  const numbers: string[] = [];
  const key = text.replace(STANDALONE_NUMBER, (match) => `{${numbers.push(match) - 1}}`);
  return numbers.length > 0 ? { key, numbers } : null;
}

/** Put the original numbers back. Returns undefined if the translation lost a placeholder. */
export function fillTemplate(translated: string, numbers: string[]): string | undefined {
  for (let i = 0; i < numbers.length; i++) if (!translated.includes(`{${i}}`)) return undefined;
  return translated.replace(/\{(\d+)\}/g, (match, index) => numbers[Number(index)] ?? match);
}

/** What to look up and ask the server for: the text with numbers replaced, or the text itself. */
export function lookupKey(text: string): string {
  const key = normalise(text);
  return toTemplate(key)?.key ?? key;
}

/**
 * Find a translation. Tries the exact text first, then the text without trailing
 * ":" / "*" (so "Email *" and "Name:" match "Email" and "Name") and puts them back.
 */
export function translateText(raw: string, lookup: Lookup): string | undefined {
  const { lead, core, trail } = splitEdges(raw);
  const key = normalise(core);
  if (!isTranslatable(key)) return undefined;

  const exact = lookup(key);
  if (exact !== undefined) return lead + exact + trail;

  const suffix = key.match(TRAILING_PUNCT)?.[0];
  if (suffix) {
    const bare = lookup(key.slice(0, -suffix.length));
    if (bare !== undefined) return lead + bare + suffix + trail;
  }

  // Same text with the numbers taken out, e.g. "View cart, {0} items".
  const template = toTemplate(key);
  if (template) {
    const found = lookup(template.key);
    const filled = found === undefined ? undefined : fillTemplate(found, template.numbers);
    if (filled !== undefined) return lead + filled + trail;
  }
  return undefined;
}

/** Combine lookups in priority order: the first one that knows the text wins. */
export function chainLookups(...lookups: Lookup[]): Lookup {
  return (text) => {
    for (const lookup of lookups) {
      const found = lookup(text);
      if (found !== undefined) return found;
    }
    return undefined;
  };
}

// Pages that show personal data (names, addresses, orders): their text is only
// translated from the bundled dictionaries and never sent to the server.
const PRIVATE_PATH = /^\/(?:account|orders?|confirm-order|checkout|login|register|forgot-password|reset-password)/i;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH.test(pathname);
}
