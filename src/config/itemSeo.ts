import { DIVISION_SEO } from './divisionSeo.js';
import { formatPageTitle } from './pageTitles.js';

/**
 * Search title, description and canonical path for single service, product,
 * project and gallery pages. Shared by the React views and the page shell
 * (backend/seo/dynamicRouteSeo.ts), so Google sees the same head before and
 * after JavaScript runs on every URL listed in the sitemap.
 */
export interface ItemSeo {
  /** Canonical path, including ?id= for gallery items. */
  path: string;
  title: string;
  description: string;
  heading: string;
  /** Main image (absolute URL or site path) for link previews. */
  image?: string;
}

type ItemRecord = Record<string, unknown>;

/** Both branches; added to every description that does not already name them. */
export const SERVICE_AREA = 'Trincomalee & Colombo, Sri Lanka';
const DESCRIPTION_LIMIT = 300;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Description that always names the Trincomalee and Colombo branches, within the length limit. */
export function withServiceArea(description: string): string {
  const base = description.replace(/\s+/g, ' ').trim();
  if (/trincomalee/i.test(base) && /colombo/i.test(base)) return base.slice(0, DESCRIPTION_LIMIT);
  const suffix = ` Serving ${SERVICE_AREA}.`;
  const room = DESCRIPTION_LIMIT - suffix.length;
  const trimmed = base.length > room ? `${base.slice(0, room - 1).trimEnd()}…` : base;
  return `${trimmed}${/[.!?…]$/.test(trimmed) || !trimmed ? '' : '.'}${suffix}`.trim();
}

const divisionName = (record: ItemRecord) => {
  const id = text(record.divisionId) || text(record.division);
  return text(record.divisionName) || DIVISION_SEO[id as keyof typeof DIVISION_SEO]?.name || 'Mahdev';
};

const firstImage = (record: ItemRecord, ...fields: string[]) => {
  for (const field of fields) {
    const value = record[field];
    const url = Array.isArray(value) ? text(value[0]) : text(value);
    if (url) return url;
  }
  return undefined;
};

/** /services/{slug or id} for a database service record, or undefined without either. */
export function servicePagePath(record: { id?: unknown; slug?: unknown }): string | undefined {
  const key = text(record.slug) || text(record.id);
  return key ? `/services/${encodeURIComponent(key)}` : undefined;
}

export function serviceSeo(record: ItemRecord, id: string): ItemSeo {
  const title = text(record.title) || text(record.name) || 'Service';
  const division = divisionName(record);
  return {
    path: `/services/${encodeURIComponent(text(record.slug) || id)}`,
    title: `${title} | ${division} | Mahdev`,
    description: withServiceArea(text(record.description) || `${title} from ${division}.`),
    heading: title,
    image: firstImage(record, 'imageUrl', 'images'),
  };
}

export function productSeo(record: ItemRecord, id: string): ItemSeo {
  const name = text(record.name) || text(record.title) || 'Product';
  return {
    path: `/products/${encodeURIComponent(text(record.slug) || id)}`,
    title: formatPageTitle(name),
    description: withServiceArea(
      text(record.shortDescription) || text(record.description) || `${name} from Mahdev Online Mart, with island-wide delivery.`
    ),
    heading: name,
    image: firstImage(record, 'imageUrl', 'images'),
  };
}

export function projectSeo(record: ItemRecord, id: string): ItemSeo {
  const title = text(record.title) || 'Project';
  return {
    path: `/projects/${encodeURIComponent(text(record.slug) || id)}`,
    title: `${title} – Mahdev Case Study`,
    description: withServiceArea(
      text(record.shortIntroduction) || text(record.summary) || text(record.description) || 'An enterprise showcase engineered by the Mahdev Group.'
    ),
    heading: title,
    image: firstImage(record, 'imageUrl', 'coverImage', 'images'),
  };
}

/** A gallery record or media asset, linked as /gallery?id=<record id>. */
export function gallerySeo(record: ItemRecord, id: string): ItemSeo {
  const title = text(record.title) || 'Mahdev Production Showcase';
  const category = text(record.category) || text(record.tag);
  const label = category && category.toLowerCase() !== title.toLowerCase() ? `${title} | ${category}` : title;
  return {
    path: `/gallery?id=${encodeURIComponent(id)}`,
    title: formatPageTitle(label),
    description: withServiceArea(
      text(record.description) || text(record.caption) || `${title}${category ? ` – ${category}` : ''} by ${divisionName(record)}.`
    ),
    heading: title,
    image: firstImage(record, 'images', 'mediaUrl', 'url', 'thumbnailUrl'),
  };
}
