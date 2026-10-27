/**
 * Alt text for every public content image (gallery, services, products,
 * projects, tours), shared by the React components and the page shell's
 * ImageObject JSON-LD, so the image description Google reads in the HTML
 * matches the one in the structured data.
 *
 * Each image keeps its own title and gets one local search phrase matched to
 * its division and subject: SWS and U1 use their own keyword lists, the other
 * divisions use the lists below.
 */

import { keywordImageAlt, type ImageAltKeyword } from '../utils/keywordImageAlt.js';
import { getSwsImageAlt } from '../data/swsLocalSeo.js';
import { getU1ImageAlt } from '../data/u1LocalSeo.js';

type DivisionKey = 'sws' | 'u1' | 'it' | 'travels' | 'mart';

const DIVISION_ALT_KEYWORDS: Record<Exclude<DivisionKey, 'sws' | 'u1'>, { rules: readonly ImageAltKeyword[]; fallback: string }> = {
  travels: {
    rules: [
      { pattern: /safari|wildlife|yala|wilpattu|minneriya|elephant|leopard/i, phrase: 'Wildlife Safari Tours Sri Lanka' },
      { pattern: /airport|transfer|vehicle|car|van|bus|fleet|coach|cab/i, phrase: 'Airport Transfers & Vehicle Hire Sri Lanka' },
      { pattern: /train|rail|ella|kandy|nuwara|tea/i, phrase: 'Hill Country & Rail Tours Sri Lanka' },
      { pattern: /trincomalee|nilaveli|uppuveli|pigeon island|beach|whale/i, phrase: 'Trincomalee Tours & Beach Holidays' },
    ],
    fallback: 'Mahdev Travels – Sri Lanka Tours from Trincomalee & Colombo',
  },
  mart: {
    rules: [
      { pattern: /decor|balloon|party|wedding|birthday|backdrop|flower/i, phrase: 'Event & Party Decor Online, Sri Lanka' },
      { pattern: /light|lamp|led|bulb/i, phrase: 'Lighting Online, Sri Lanka' },
      { pattern: /camera|mic|audio|speaker|phone|smart|tech|electronic/i, phrase: 'Smart Electronics & Creator Tech, Sri Lanka' },
    ],
    fallback: 'Mahdev Online Mart, Island-Wide Delivery in Sri Lanka',
  },
  it: {
    rules: [
      { pattern: /web\s?site|web design|landing|e-?commerce/i, phrase: 'Web Design Trincomalee & Colombo' },
      { pattern: /mobile|app\b|android|ios/i, phrase: 'Mobile App Development Sri Lanka' },
      { pattern: /pos\b|erp|billing|inventory/i, phrase: 'POS & ERP Systems Sri Lanka' },
      { pattern: /cloud|ai\b|automation|server/i, phrase: 'Cloud & AI Solutions Sri Lanka' },
    ],
    fallback: 'Mahdev IT Solutions – Software Development Trincomalee & Colombo',
  },
};

/** Division key for a record's division id or name ("sws", "SWS Event Management", "U1 Studio"...). */
export function toDivisionKey(division: unknown): DivisionKey | undefined {
  const value = typeof division === 'string' ? division.trim().toLowerCase() : '';
  if (!value) return undefined;
  if (value === 'sws' || value.includes('sws') || value.includes('event')) return 'sws';
  if (value === 'u1' || value.includes('u1') || value.includes('studio')) return 'u1';
  if (value === 'travels' || value.includes('travel')) return 'travels';
  if (value === 'mart' || value.includes('mart')) return 'mart';
  if (value === 'it' || value.includes('it solutions')) return 'it';
  return undefined;
}

/**
 * "<title> – <local search phrase>" for a content image of the given division.
 * Extra context (category, tagline, event type) helps pick the phrase; it is not
 * added to the text. Without a known division the title gets the group's area.
 */
export function getImageAlt(title: string, division?: unknown, ...context: Array<string | undefined>): string {
  const cleanTitle = title.trim() || 'Mahdev';
  const key = toDivisionKey(division);
  if (key === 'sws') return withBranchLocations(getSwsImageAlt(cleanTitle, ...context));
  if (key === 'u1') return withBranchLocations(getU1ImageAlt(cleanTitle, ...context));
  if (key) {
    const { rules, fallback } = DIVISION_ALT_KEYWORDS[key];
    return withBranchLocations(keywordImageAlt(rules, fallback, cleanTitle, ...context));
  }
  return `${cleanTitle} – Mahdev, Trincomalee & Colombo, Sri Lanka`;
}

/**
 * Every image is tagged with both branch cities: adds "Trincomalee & Colombo"
 * (or whichever of the two is missing) to alt text that does not name them.
 */
export function withBranchLocations(alt: string): string {
  const text = alt.trim();
  const hasTrincomalee = /trincomalee/i.test(text);
  const hasColombo = /colombo/i.test(text);
  if (hasTrincomalee && hasColombo) return text;
  if (hasTrincomalee) return `${text} & Colombo`;
  if (hasColombo) return `${text} & Trincomalee`;
  // A comma when the alt already has a " – " separator, so it never reads "… – … – …".
  return `${text}${text.includes(' – ') ? ',' : ' –'} Trincomalee & Colombo`;
}

/** schema.org Place values for the two branch cities, used as an image's contentLocation. */
export const BRANCH_CONTENT_LOCATIONS = [
  { '@type': 'Place', name: 'Trincomalee, Sri Lanka', address: { '@type': 'PostalAddress', addressLocality: 'Trincomalee', addressCountry: 'LK' } },
  { '@type': 'Place', name: 'Colombo, Sri Lanka', address: { '@type': 'PostalAddress', addressLocality: 'Colombo', addressCountry: 'LK' } },
] as const;

const textField = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

/**
 * getImageAlt for any service, product, project or gallery record: reads its
 * title/name, division id or name, and category-like fields. Also used by the
 * page shell for item pages' ImageObject JSON-LD.
 */
export function getRecordImageAlt(record: object, title?: string): string {
  const data = record as Record<string, unknown>;
  // Alt text saved from the admin editor (auto-filled or hand-written) wins.
  const savedAlt = textField(data.imageAlt);
  if (savedAlt) return withBranchLocations(savedAlt);
  const name = textField(title) || textField(data.title) || textField(data.name) || 'Mahdev';
  const division = textField(data.divisionId) || textField(data.division) || textField(data.divisionName);
  return getImageAlt(
    name,
    division,
    textField(data.category),
    textField(data.categoryName),
    textField(data.eventType),
    textField(data.tagline),
    textField(data.tag),
  );
}

/** Alt for the nth extra photo of an item ("… – photo 2 of 5"), for thumbnails and carousels. */
export function getImageAltForPhoto(baseAlt: string, index: number, total: number): string {
  return total > 1 ? `${baseAlt} – photo ${index + 1} of ${total}` : baseAlt;
}

const SEO_DESCRIPTION_LIMIT = 160;

/** Shortens to the limit at a word boundary, ending with "…" when cut. */
function clip(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).replace(/[\s,;:–-]+$/, '')}…`;
}

/**
 * Search description for a gallery item, service or product, auto-filled in the
 * admin editors: the keyword alt text (which names both branch cities), the
 * division, then as much of the item's own description as fits in ~160 characters.
 */
export function buildSeoDescription(input: {
  title: string;
  division?: unknown;
  divisionName?: string;
  category?: string;
  description?: string;
}): string {
  const title = input.title.trim();
  if (!title) return '';
  const alt = getImageAlt(title, input.division ?? input.divisionName, input.category);
  const divisionName = input.divisionName?.trim();
  let text = divisionName && !alt.toLowerCase().includes(divisionName.toLowerCase()) ? `${alt} by ${divisionName}.` : `${alt}.`;
  const sentences = (input.description || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]?/g) || [];
  for (const sentence of sentences) {
    const next = `${text} ${sentence.trim()}`;
    if (next.length > SEO_DESCRIPTION_LIMIT) break;
    text = next;
  }
  return clip(text, SEO_DESCRIPTION_LIMIT);
}

/**
 * Keyword file name for an upload ("kavyas-1st-birthday-birthday-decoration-trincomalee-colombo.jpg"),
 * keeping the original extension (.jpg, .jpeg, .png ...). Returns the original name when there is no text to use.
 */
export function seoFileName(name: string, originalFileName: string, photoNumber?: number): string {
  const extension = originalFileName.includes('.') ? originalFileName.split('.').pop()!.toLowerCase() : 'jpg';
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/, '');
  if (!slug) return originalFileName;
  return `${slug}${photoNumber && photoNumber > 1 ? `-${photoNumber}` : ''}.${extension}`;
}

/** The admin-saved alt text when there is one (tagged with both cities), otherwise the computed alt. */
export function preferSavedAlt(savedAlt: string | undefined, computedAlt: string): string {
  return savedAlt?.trim() ? withBranchLocations(savedAlt) : computedAlt;
}

/** Both branch cities, for location tags on images, gallery items, services and projects. */
export const BRANCH_LOCATION_LABEL = 'Trincomalee & Colombo, Sri Lanka';

/**
 * Location tag for a content card: the record's own venue when it names one
 * ("Shangri-La Ballroom, Colombo"), otherwise both branch cities. A bare
 * "Colombo" (the old default) is widened to both cities too.
 */
export function branchLocationTag(location: unknown): string {
  const value = typeof location === 'string' ? location.trim() : '';
  if (!value || /^colombo(\s+studio)?(,?\s*sri lanka)?$/i.test(value)) return BRANCH_LOCATION_LABEL;
  return value;
}

/**
 * Auto alt text and SEO description for a gallery item, service or product,
 * matching what the admin editor fills in. cmsService fills in any that are
 * empty whenever one of these records is created or updated, and the
 * "Generate Image SEO" button finds and fills any records still missing them.
 */
export function generateImageSeo(record: object): { imageAlt: string; seoDescription: string } {
  const data = record as Record<string, unknown>;
  const title = textField(data.title) || textField(data.name) || '';
  const division = textField(data.divisionId) || textField(data.division) || textField(data.divisionName);
  const divisionName = textField(data.divisionName);
  const category = textField(data.category) || textField(data.categoryName);
  return {
    imageAlt: title ? getImageAlt(title, division, category) : '',
    seoDescription: buildSeoDescription({
      title,
      division,
      divisionName,
      category,
      description: textField(data.description) || textField(data.caption),
    }),
  };
}
