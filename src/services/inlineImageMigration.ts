/**
 * One-off admin tool: moves base64 `data:image/...` values stored inside service
 * and gallery records into Firebase Storage (via the normal admin media upload)
 * and saves the resulting URL back on the record.
 *
 * Inline images make collection reads very large (hundreds of KB per record),
 * which slows every page that lists services or gallery items and causes
 * request timeouts. Records then hold a short URL like the rest of the data.
 */

import { firestoreServicesService } from './firestore/services';
import { firestoreGalleryService } from './firestore/gallery';
import { uploadMediaAsset } from './mediaUploadService';

// Image fields that may hold a single URL or a list of URLs.
const IMAGE_FIELDS = ['imageUrl', 'images', 'url', 'thumbnailUrl', 'image', 'galleryImages'] as const;

export interface InlineImageScanItem {
  collection: 'services' | 'gallery';
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

function countInline(record: Record<string, unknown>): { count: number; bytes: number } {
  let count = 0;
  let bytes = 0;
  for (const field of IMAGE_FIELDS) {
    const value = record[field];
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (isInlineImage(item)) {
        count += 1;
        bytes += item.length;
      }
    }
  }
  return { count, bytes };
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
  // Fresh reads so we never act on a stale cached copy.
  const [services, gallery] = await Promise.all([
    firestoreServicesService.getServices(undefined, true),
    firestoreGalleryService.getGallery(undefined, true),
  ]);
  return [
    ...services.map((record) => ({ collection: 'services' as const, record: record as unknown as Record<string, unknown> })),
    ...gallery.map((record) => ({ collection: 'gallery' as const, record: record as unknown as Record<string, unknown> })),
  ];
}

/** Lists records that still contain inline images, without changing anything. */
export async function scanInlineImages(): Promise<InlineImageScanItem[]> {
  const records = await loadRecords();
  return records
    .map(({ collection, record }) => {
      const { count, bytes } = countInline(record);
      return {
        collection,
        id: String(record.id),
        title: String(record.title || record.name || record.id),
        inlineImageCount: count,
        inlineBytes: bytes,
      };
    })
    .filter((item) => item.inlineImageCount > 0);
}

/** Uploads every inline image and saves only the changed image fields on each record. */
export async function migrateInlineImages(
  onProgress?: (done: number, total: number) => void
): Promise<InlineImageMigrationResult> {
  const records = (await loadRecords()).filter(({ record }) => countInline(record).count > 0);
  const result: InlineImageMigrationResult = { migratedRecords: 0, migratedImages: 0, failures: [] };

  for (let index = 0; index < records.length; index += 1) {
    const { collection, record } = records[index];
    const id = String(record.id);
    try {
      const patch: Record<string, unknown> = {};
      let imageNumber = 0;
      // Reuse one upload when the same inline image appears in several fields.
      const uploadedByDataUrl = new Map<string, string>();
      const upload = async (dataUrl: string) => {
        const existing = uploadedByDataUrl.get(dataUrl);
        if (existing) return existing;
        imageNumber += 1;
        const url = await uploadMediaAsset(dataUrlToFile(dataUrl, `${collection}-${id}-${imageNumber}`));
        uploadedByDataUrl.set(dataUrl, url);
        return url;
      };

      for (const field of IMAGE_FIELDS) {
        const value = record[field];
        if (Array.isArray(value) && value.some(isInlineImage)) {
          const next: unknown[] = [];
          for (const item of value) next.push(isInlineImage(item) ? await upload(item) : item);
          patch[field] = next;
        } else if (isInlineImage(value)) {
          patch[field] = await upload(value);
        }
      }

      if (Object.keys(patch).length > 0) {
        if (collection === 'services') await firestoreServicesService.saveService(id, patch);
        else await firestoreGalleryService.saveGallery(id, patch);
        result.migratedRecords += 1;
        result.migratedImages += uploadedByDataUrl.size;
      }
    } catch (error) {
      result.failures.push({ collection, id, error: error instanceof Error ? error.message : String(error) });
    }
    onProgress?.(index + 1, records.length);
  }

  return result;
}
