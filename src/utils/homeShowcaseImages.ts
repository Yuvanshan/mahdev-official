import type { FirestoreGallery } from '../types/firestore';
import { divisionIdFromName } from './onlineBooking';

function categoryKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word && !['decoration', 'decorations', 'decor', 'event', 'events', 'service', 'services'].includes(word))
    .map((word) => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)
    .join(' ');
}

function divisionKey(value: string): string {
  return divisionIdFromName(value) || value.trim().toLowerCase();
}

function galleryRecordImages(item: FirestoreGallery): string[] {
  const candidates = item.images?.length
    ? item.images
    : [item.mediaUrl, item.url, item.thumbnailUrl];
  return candidates.filter((url): url is string =>
    Boolean(url) &&
    !/\.(mp4|webm|mov|m4v|ogv)(?:[?#]|$)/i.test(url) &&
    !/^firestore:\/\/media_blobs\/vid_/i.test(url)
  );
}

export function getRelatedGalleryImages(
  gallery: FirestoreGallery[],
  category: string,
  divisionId: string,
  excludeId?: string
): string[] {
  const key = categoryKey(category);
  const division = divisionKey(divisionId);
  if (!key || !division) return [];

  const seen = new Set<string>();
  const images: string[] = [];

  gallery.forEach((item) => {
    if (
      item.status === 'hidden' ||
      item.id === excludeId ||
      categoryKey(item.category || item.tag || '') !== key ||
      divisionKey(String((item as FirestoreGallery & { divisionId?: string }).divisionId || item.division || '')) !== division
    ) {
      return;
    }

    galleryRecordImages(item).forEach((image) => {
      if (!seen.has(image)) {
        seen.add(image);
        images.push(image);
      }
    });
  });

  return images;
}
