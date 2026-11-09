/**
 * Admin tool: moves base64 `data:image/...` values stored inside database
 * records into Firebase Storage (via the normal admin media upload) and saves
 * the resulting URL back in the same place.
 *
 * Inline images make every read of a record very large (a single logo can be
 * 550 KB), which slows the site and drives up Vercel "Fast Origin Transfer".
 * Images are found at any depth (e.g. settings.darkLogoUrl,
 * divisions.seo.ogImage, gallery.mediaUrl), and only changed fields are saved.
 */

import { collection, doc, getDocs, setDoc } from '../lib/tursoFirestore';
import { db } from '../lib/firebase';
import { uploadMediaAsset } from './mediaUploadService';

// Collections whose records may hold inline images.
const MIGRATED_COLLECTIONS = ['services', 'gallery', 'divisions', 'settings'] as const;
type MigratedCollection = typeof MIGRATED_COLLECTIONS[number];

export interface InlineImageScanItem {
  collection: MigratedCollection;
  id: string;
  title: string;
  inlineImageCount: number;
  inlineBytes: number;
}

export interface InlineImageMigrationResult {
  migratedRecords: number;
  migratedImages: number;
  failures: Array<{ collection: string; id: string; error: string }>;
}

function isInlineImage(value: unknown): value is string {
  return typeof value === 'string' && /^data:image\//i.test(value);
}

// Every inline image anywhere inside a value (strings, arrays, nested objects).
function collectInline(value: unknown, found: string[] = []): string[] {
  if (isInlineImage(value)) found.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectInline(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectInline(item, found));
  return found;
}

// Returns a copy of `value` with every inline image replaced via `replace`.
async function replaceInline(value: unknown, replace: (dataUrl: string) => Promise<string>): Promise<unknown> {
  if (isInlineImage(value)) return replace(value);
  if (Array.isArray(value)) {
    const next: unknown[] = [];
    for (const item of value) next.push(await replaceInline(item, replace));
    return next;
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) next[key] = await replaceInline(item, replace);
    return next;
  }
  return value;
}

// Convert a data URL into a File so it can go through the standard upload flow.
function dataUrlToFile(dataUrl: string, baseName: string): File {
  const [header, base64 = ''] = dataUrl.split(',', 2);
  const mimeType = header.match(/^data:([^;]+)/i)?.[1] || 'image/jpeg';
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], `${baseName}.${extension}`, { type: mimeType });
}

async function loadRecords() {
  // Direct reads on the admin portal: live, complete records (no caches).
  const lists = await Promise.all(MIGRATED_COLLECTIONS.map(async (name) => {
    const snapshot = await getDocs(collection(db, name));
    return snapshot.docs.map((document) => ({
      collection: name,
      id: document.id,
      data: document.data() as Record<string, unknown>,
    }));
  }));
  return lists.flat();
}

/** Lists records that still contain inline images, without changing anything. */
export async function scanInlineImages(): Promise<InlineImageScanItem[]> {
  return (await loadRecords())
    .map(({ collection: name, id, data }) => {
      const images = collectInline(data);
      return {
        collection: name,
        id,
        title: String(data.title || data.name || id),
        inlineImageCount: images.length,
        inlineBytes: images.reduce((sum, image) => sum + image.length, 0),
      };
    })
    .filter((item) => item.inlineImageCount > 0);
}

/** Uploads every inline image and saves only the changed top-level fields of each record. */
export async function migrateInlineImages(
  onProgress?: (done: number, total: number) => void
): Promise<InlineImageMigrationResult> {
  const records = (await loadRecords()).filter(({ data }) => collectInline(data).length > 0);
  const result: InlineImageMigrationResult = { migratedRecords: 0, migratedImages: 0, failures: [] };

  for (let index = 0; index < records.length; index += 1) {
    const { collection: name, id, data } = records[index];
    try {
      // Reuse one upload when the same image appears several times in a record.
      const uploaded = new Map<string, string>();
      const upload = async (dataUrl: string) => {
        const existing = uploaded.get(dataUrl);
        if (existing) return existing;
        const url = await uploadMediaAsset(dataUrlToFile(dataUrl, `${name}-${id}-${uploaded.size + 1}`));
        uploaded.set(dataUrl, url);
        return url;
      };

      const patch: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(data)) {
        if (collectInline(value).length > 0) patch[field] = await replaceInline(value, upload);
      }
      if (Object.keys(patch).length > 0) {
        await setDoc(doc(db, name, id), patch, { merge: true });
        result.migratedRecords += 1;
        result.migratedImages += uploaded.size;
      }
    } catch (error) {
      result.failures.push({ collection: name, id, error: error instanceof Error ? error.message : String(error) });
    }
    onProgress?.(index + 1, records.length);
  }

  return result;
}
