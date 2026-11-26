/**
 * Which CMS text fields are auto-translated to Tamil (ta) and Sinhala (si).
 *
 * Shared by the backend (admin write hook) and the frontend (localising a record).
 * Pure code: no imports, no I/O.
 *
 * PATH SYNTAX (one string per field, relative to the document):
 *   'title'               top-level string
 *   'hero.title'          nested object field
 *   'features[]'          every string in an array of strings
 *   'stats[].label'       field `label` of every object in the array `stats`
 *   'sections[].content[]' arrays can be nested
 *   'specifications.*'    every string value of an object used as a map
 *
 * Concrete paths (what is stored in `translations.<lang>` and returned by
 * `extractTranslatable`) use real indexes, e.g. 'features[2]', 'stats[0].label'.
 *
 * KEY OF A COLLECTION: use 'collection' (e.g. 'services'). Single documents that hold
 * different shapes inside one collection use 'collection/docId'
 * (e.g. 'settings/homepage'). `getTranslatableFields` tries 'collection/docId' first,
 * then 'collection'.
 *
 * Stored shape on the document:
 *   translations: { ta: Record<concretePath, string>, si: Record<concretePath, string> }
 *   translationsLocked?: string[]   concrete paths an admin edited by hand; never overwritten
 *   translationsPending?: boolean   true when the save-time translation failed or timed out
 */

export const TRANSLATION_LANGS = ['ta', 'si'] as const;
export type TranslationLang = (typeof TRANSLATION_LANGS)[number];

export type TranslationMap = Record<string, string>;
export type DocTranslations = Partial<Record<TranslationLang, TranslationMap>>;

export function isTranslationLang(value: unknown): value is TranslationLang {
  return typeof value === 'string' && (TRANSLATION_LANGS as readonly string[]).includes(value);
}

const SERVICE_LIKE_TEXT = ['title', 'name', 'description', 'badge', 'features[]', 'turnaroundTime', 'imageAlt', 'seoDescription', 'divisionName', 'category'];

export const TRANSLATABLE_FIELDS: Record<string, string[]> = {
  divisions: [
    'name', 'shortName', 'tagline', 'description', 'badge', 'heroHeadline', 'heroSubheadline',
    'hero.title', 'hero.subtitle', 'hero.badge',
    'stats[].label', 'stats[].subtext',
    'galleryImages[].title', 'galleryImages[].caption',
    'shortDescription', 'aboutText', 'hero.ctaText',
    'comingSoonTitle', 'comingSoonMessage', 'seo.metaTitle', 'seo.metaDescription',
  ],
  services: SERVICE_LIKE_TEXT,
  products: [
    'name', 'shortDescription', 'description', 'categoryName', 'divisionName', 'warrantyInfo',
    'optionGroups[].name', 'optionGroups[].options[]', 'imageAlt', 'seoDescription', 'tags[]', 'specifications.*',
  ],
  categories: ['name', 'description'],
  packages: ['name', 'tagline', 'serviceTitle', 'duration', 'billingCycle', 'badge', 'ctaText', 'features[]'],
  portfolio: [
    'title', 'category', 'client', 'summary', 'fullDescription', 'highlights[]', 'deliverables[]',
    'impactMetrics[].label', 'tags[]',
  ],
  gallery: ['title', 'category', 'tag', 'caption', 'tags[]', 'location', 'imageAlt', 'seoDescription'],
  milestones: ['title', 'description', 'badge', 'metric', 'keyOutcome'],
  trustedCompanies: ['industry', 'partnershipType', 'description'],
  testimonials: ['role', 'quote', 'divisionName'],
  pages: [
    'title', 'metaDescription', 'heroHeading', 'heroSubheading', 'content',
    'sections[].heading', 'sections[].body',
  ],
  banners: ['title', 'subtitle', 'buttonText', 'badgeText'],
  faqs: ['question', 'answer', 'category'],
  announcements: ['title', 'message'],
  coupons: ['description'],
  seasonalWishCampaigns: ['name', 'occasion', 'greetingTitle', 'greetingDescription', 'ctaText'],
  careerOpenings: [
    'title', 'location', 'employmentType', 'experience', 'description', 'responsibilities[]',
    'requirements[]', 'benefits[]', 'seoDescription',
  ],
  team: ['title', 'role', 'bio', 'credentials[]'],
  legalPages: ['title', 'subtitle', 'sections[].heading', 'sections[].content[]', 'sections[].subsections[].title', 'sections[].subsections[].text'],
  heroSections: ['title', 'subtitle', 'description', 'badge', 'ctaText', 'buttonText'],
  navigation: ['label', 'title', 'description', 'items[].label', 'items[].description'],

  // About-us content (websiteContent/aboutUs)
  'websiteContent/aboutUs': [
    'hero.title', 'hero.subtitle', 'hero.description', 'hero.buttonText',
    'companyIntro.heading', 'companyIntro.description',
    'vision.heading', 'vision.description', 'mission.heading', 'mission.description',
    'values[].title', 'values[].description',
    'divisions[].name', 'divisions[].tagline', 'divisions[].description', 'divisions[].services[]',
    'timeline[].title', 'timeline[].description',
    'team[].name', 'team[].title',
    'locations[].city', 'locations[].address',
    'cta.title', 'cta.description', 'cta.primaryButtonText', 'cta.secondaryButtonText',
  ],

  // Homepage CMS config (settings/homepage)
  'settings/homepage': [
    'welcomeAnimation.welcomeText',
    'hero.badgeText', 'hero.titleLine1', 'hero.titleHighlight', 'hero.titleLine2', 'hero.description',
    'hero.primaryCtaLabel', 'hero.secondaryCtaLabel',
    'hero.metrics[].label', 'hero.metrics[].subtext',
    'hero.showcaseItems[].name', 'hero.showcaseItems[].badge', 'hero.showcaseItems[].tagline', 'hero.showcaseItems[].highlight',
    'intro.badge', 'intro.headline', 'intro.subheadline', 'intro.description',
    'intro.pillars[].title', 'intro.pillars[].desc',
    'aboutPage.badge', 'aboutPage.title', 'aboutPage.description', 'aboutPage.story[]',
    'divisionsSection.badge', 'divisionsSection.title', 'divisionsSection.subtitle',
    'bookingGuide.title', 'bookingGuide.subtitle', 'bookingGuide.steps[].title', 'bookingGuide.steps[].description',
    'whyMahdev.badge', 'whyMahdev.title', 'whyMahdev.subtitle',
    'whyMahdev.guarantees[].title', 'whyMahdev.guarantees[].description', 'whyMahdev.guarantees[].tag',
    'leadership.title', 'leadership.subtitle',
    'leadership.members[].name', 'leadership.members[].title', 'leadership.members[].role',
    'leadership.members[].bio', 'leadership.members[].badge', 'leadership.members[].credentials[]',
    'statistics.badge', 'statistics.title', 'statistics.subtitle',
    'featuredServices.badge', 'featuredServices.title', 'featuredServices.subtitle',
    'featuredProducts.badge', 'featuredProducts.title', 'featuredProducts.subtitle', 'featuredProducts.spotlightBannerText',
    'portfolio.badge', 'portfolio.title', 'portfolio.subtitle',
    'decorationShowcase.badge', 'decorationShowcase.title', 'decorationShowcase.subtitle',
    'decorationShowcase.videos[].title', 'decorationShowcase.videos[].category', 'decorationShowcase.videos[].location',
    'decorationShowcase.videos[].description', 'decorationShowcase.videos[].venueType', 'decorationShowcase.videos[].highlights[]',
    'milestones.badge', 'milestones.title', 'milestones.subtitle', 'milestones.achievementsTitle', 'milestones.achievementsSubtitle',
    'milestones.achievements[].label', 'milestones.achievements[].description', 'milestones.achievements[].badge',
    'companies.badge', 'companies.title', 'companies.subtitle',
    'testimonials.badge', 'testimonials.title', 'testimonials.subtitle',
    'ctaSection.badge', 'ctaSection.headline', 'ctaSection.subheadline',
    'ctaSection.primaryButtonText', 'ctaSection.secondaryButtonText', 'ctaSection.corporateLocation',
    'sectionsOrder[].name', 'sectionsOrder[].title', 'sectionsOrder[].subtitle', 'sectionsOrder[].badge',
    'sectionsOrder[].widgets[].title', 'sectionsOrder[].widgets[].subtitle', 'sectionsOrder[].widgets[].badge',
    'sectionsOrder[].widgets[].content',
    'legalPages.*.title', 'legalPages.*.subtitle',
    'legalPages.*.sections[].heading', 'legalPages.*.sections[].content[]',
    'seo.pageTitle', 'seo.metaDescription',
  ],

  // Company and site settings text
  'settings/company': [
    'tagline', 'description', 'mission', 'vision', 'address', 'formattedAddress',
    'offices.colombo.name', 'offices.colombo.address', 'offices.trincomalee.name', 'offices.trincomalee.address',
    'workingHours.*', 'businessHours.*',
  ],
  'settings/site': [
    'tagline', 'description', 'maintenanceTitle', 'maintenanceMessage', 'maintenance.title', 'maintenance.message',
    'maintenance.estimatedReturn', 'announcement.text',
  ],
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

type Json = unknown;

/** Field patterns for a collection, or 'collection/docId' when that is configured. */
export function getTranslatableFields(collection: string, docId?: string): string[] | undefined {
  if (docId && TRANSLATABLE_FIELDS[`${collection}/${docId}`]) return TRANSLATABLE_FIELDS[`${collection}/${docId}`];
  if (collection.includes('/') && TRANSLATABLE_FIELDS[collection]) return TRANSLATABLE_FIELDS[collection];
  return TRANSLATABLE_FIELDS[collection.split('/')[0]];
}

/** True when this collection (or collection/docId) is auto-translated. */
export function isTranslatableCollection(collection: string, docId?: string): boolean {
  return Boolean(getTranslatableFields(collection, docId));
}

/** True when the text holds at least one letter in any script (skips numbers/symbols). */
export function hasLetters(text: string): boolean {
  return /\p{L}/u.test(text);
}

/** True when the text is worth translating: has letters and is not just a URL or email. */
export function isTranslatableText(text: unknown): text is string {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed || !hasLetters(trimmed)) return false;
  if (/^(https?:\/\/|\/)\S*$/i.test(trimmed)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  return true;
}

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

interface Segment { key: string; each: boolean }

function parsePattern(pattern: string): Segment[] {
  return pattern.split('.').map((part) => {
    const each = part.endsWith('[]');
    return { key: each ? part.slice(0, -2) : part, each };
  });
}

function isPlainObject(value: Json): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Walk a doc along one pattern and call `visit(concretePath, value, set)` for each string
 * leaf. `set` writes a replacement string into the (copy of the) document.
 */
function walk(
  node: Json,
  segments: Segment[],
  index: number,
  prefix: string,
  visit: (path: string, value: string, set: (next: string) => void) => void,
): void {
  if (index >= segments.length || !isPlainObject(node)) return;
  const { key, each } = segments[index];
  const last = index === segments.length - 1;
  const join = (k: string) => (prefix ? `${prefix}.${k}` : k);

  const keys = key === '*' ? Object.keys(node) : [key];
  for (const k of keys) {
    if (UNSAFE_KEYS.has(k) || !Object.prototype.hasOwnProperty.call(node, k)) continue;
    const child = node[k];
    const path = join(k);

    if (each) {
      if (!Array.isArray(child)) continue;
      child.forEach((item, i) => {
        const itemPath = `${path}[${i}]`;
        if (last) {
          if (typeof item === 'string') visit(itemPath, item, (next) => { child[i] = next; });
        } else {
          walk(item, segments, index + 1, itemPath, visit);
        }
      });
    } else if (last) {
      if (typeof child === 'string') visit(path, child, (next) => { node[k] = next; });
    } else {
      walk(child, segments, index + 1, path, visit);
    }
  }
}

function deepClone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

function docIdOf(doc: Json): string | undefined {
  return isPlainObject(doc) && typeof doc.id === 'string' ? doc.id : undefined;
}

/**
 * Returns { concretePath: englishText } for every non-empty translatable string in the doc.
 * `collection` may be 'name' or 'name/docId'. Strings with no letters, URLs and emails are skipped.
 */
export function extractTranslatable(collection: string, doc: Json): Record<string, string> {
  const result: Record<string, string> = {};
  const patterns = getTranslatableFields(collection, docIdOf(doc));
  if (!patterns || !isPlainObject(doc)) return result;
  for (const pattern of patterns) {
    walk(doc, parsePattern(pattern), 0, '', (path, value) => {
      if (isTranslatableText(value)) result[path] = value;
    });
  }
  return result;
}

/**
 * Returns a copy of the doc with translatable strings replaced by `doc.translations[lang]`.
 * Missing translations leave the English text. The `translations` bag itself is kept.
 */
export function applyTranslations<T>(collection: string, doc: T, lang: TranslationLang | string): T {
  if (!isPlainObject(doc) || !isTranslatableCollection(collection, docIdOf(doc))) return doc;
  const bag = (doc as Record<string, Json>).translations;
  const map = isPlainObject(bag) && isPlainObject(bag[lang]) ? (bag[lang] as Record<string, Json>) : null;
  if (!map) return doc;

  const copy = deepClone(doc) as Record<string, Json>;
  for (const pattern of getTranslatableFields(collection, docIdOf(doc)) ?? []) {
    walk(copy, parsePattern(pattern), 0, '', (path, _value, set) => {
      const translated = map[path];
      if (typeof translated === 'string' && translated.trim()) set(translated);
    });
  }
  return copy as T;
}
