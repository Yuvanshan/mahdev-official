/**
 * Page head for the single service, product, project and gallery URLs listed in
 * the sitemap (/services/x, /products/x, /projects/x, /gallery?id=x). The page
 * shell writes it into the HTML so each URL reaches Google with its own title,
 * description and canonical URL instead of the home page's.
 */

import { initializeTursoDatabase, listTursoDocuments, type TursoDocument } from '../db/tursoDatabase.js';
import { gallerySeo, productSeo, projectSeo, serviceSeo, type ItemSeo } from '../../src/config/itemSeo.js';
import { SITE_NAME } from '../../src/config/site.js';
import type { RouteSeo } from './publicRoutes.js';

const CACHE_MS = 60_000;
const MAX_ROWS = 1000;
const cache = new Map<string, { documents: TursoDocument[]; loadedAt: number }>();

// Collections are cached briefly per instance; the page shell response is also CDN-cached.
async function listCollection(collection: string): Promise<TursoDocument[]> {
  const cached = cache.get(collection);
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) return cached.documents;
  await initializeTursoDatabase();
  const documents = await listTursoDocuments(collection, '', [], undefined, MAX_ROWS);
  cache.set(collection, { documents, loadedAt: Date.now() });
  return documents;
}

const lower = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// Same visibility rules as the sitemap (backend/api/handlers/sitemap.ts).
const isListedService = ({ data }: TursoDocument) =>
  data.isPublished !== false && data.status !== 'inactive' && data.status !== 'draft' && data.isDeleted !== true;
const isListedProduct = (document: TursoDocument) => isListedService(document) && document.data.status !== 'archived';
const isListedProject = ({ data }: TursoDocument) =>
  data.isPublished === true || data.status === 'published' || data.status === 'active';
const isListedGalleryItem = ({ data }: TursoDocument) =>
  data.isPublished !== false && !['hidden', 'inactive', 'draft', 'archived'].includes(String(data.status));

/** Finds a listed record by slug, id or SKU (case-insensitive), as the app does. */
async function findRecord(
  collection: string,
  key: string,
  isListed: (document: TursoDocument) => boolean,
): Promise<TursoDocument | undefined> {
  const wanted = key.toLowerCase();
  return (await listCollection(collection)).find((document) =>
    isListed(document) &&
    (lower(document.data.slug) === wanted || document.id.toLowerCase() === wanted || lower(document.data.sku) === wanted)
  );
}

function toRouteSeo(seo: ItemSeo, intro: string, structuredData?: Array<Record<string, unknown>>): RouteSeo {
  return {
    path: seo.path,
    title: seo.title,
    description: seo.description,
    heading: seo.heading,
    intro,
    ogImage: seo.image,
    structuredData,
  };
}

/** Head for a single item URL, or null when the URL is not an item page or the item is not listed. */
export async function resolveDynamicRouteSeo(path: string, search: URLSearchParams): Promise<RouteSeo | null> {
  const [first = '', second = '', ...rest] = path.replace(/^\/+|\/+$/g, '').split('/');
  const segment = first.toLowerCase();
  let key = '';
  try {
    key = decodeURIComponent(second).trim();
  } catch {
    return null;
  }

  if (!rest.length && key && (segment === 'services' || segment === 'service') && key !== 'category') {
    const record = await findRecord('services', key, isListedService);
    if (!record) return null;
    const seo = serviceSeo(record.data, record.id);
    return toRouteSeo(seo, `${seo.heading} by ${SITE_NAME}.`);
  }

  if (!rest.length && key && (segment === 'products' || segment === 'product')) {
    const record = await findRecord('products', key, isListedProduct);
    if (!record) return null;
    return toRouteSeo(productSeo(record.data, record.id), 'Available from Mahdev Online Mart with island-wide delivery.');
  }

  if (!rest.length && key && ['projects', 'project', 'work', 'portfolio'].includes(segment)) {
    const record = await findRecord('portfolio', key, isListedProject);
    if (!record) return null;
    return toRouteSeo(projectSeo(record.data, record.id), `A ${SITE_NAME} project.`);
  }

  const galleryId = search.get('id')?.trim();
  if (!second && (segment === 'gallery' || segment === 'media') && galleryId) {
    const wanted = galleryId.toLowerCase();
    const [gallery, mediaAssets] = await Promise.all([listCollection('gallery'), listCollection('media_assets')]);
    const record = [...gallery, ...mediaAssets].find(
      (document) => isListedGalleryItem(document) && document.id.toLowerCase() === wanted
    );
    if (!record) return null;
    return toRouteSeo(gallerySeo(record.data, record.id), `From the ${SITE_NAME} gallery.`);
  }

  return null;
}
