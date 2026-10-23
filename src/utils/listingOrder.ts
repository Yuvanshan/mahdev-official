/**
 * "Newly added first" ordering for gallery items, services and products.
 *
 * Records created from the admin portal get a `listedAt` timestamp (set once,
 * on create — see cmsService.create). Records without it are the existing
 * catalogue, which keeps its current order. So: items with `listedAt` come
 * first, newest first, followed by everything else exactly as before.
 */

export const LISTED_AT_FIELD = 'listedAt';

/** Entities whose new records are stamped with `listedAt` on create. */
export const NEWEST_FIRST_ENTITIES = ['gallery', 'services', 'products'] as const;

const listedTime = (item: unknown): number | null => {
  const value = (item as Record<string, unknown> | null)?.[LISTED_AT_FIELD];
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : null;
};

export function newestListedFirst<T>(items: T[]): T[] {
  const listed: Array<{ item: T; time: number }> = [];
  const rest: T[] = [];
  for (const item of items) {
    const time = listedTime(item);
    if (time === null) rest.push(item);
    else listed.push({ item, time });
  }
  // Nothing new yet: return the same array so memoised consumers don't re-render.
  if (listed.length === 0) return items;
  listed.sort((a, b) => b.time - a.time);
  return [...listed.map((entry) => entry.item), ...rest];
}
