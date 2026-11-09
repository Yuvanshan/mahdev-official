/**
 * Shared sort options for public listings (division pages, /services, Mart).
 * "Recommended" keeps the listing's own order (newly added first, then the
 * existing order); price sorts always put items without a price last.
 */

export type ListingSort = 'recommended' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export const LISTING_SORT_OPTIONS: Array<{ value: ListingSort; label: string }> = [
  { value: 'recommended', label: 'Recommended (newest first)' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

/** Returns a sorted copy (stable, so ties keep the listing order). */
export function sortListing<T>(
  items: T[],
  sort: ListingSort,
  getPrice: (item: T) => number | null,
  getName: (item: T) => string
): T[] {
  if (sort === 'recommended') return items;
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      let result = 0;
      if (sort === 'price-asc' || sort === 'price-desc') {
        const pa = getPrice(a.item);
        const pb = getPrice(b.item);
        if (pa === null || pb === null) {
          // Unpriced items go last in both directions
          result = pa === null && pb === null ? 0 : pa === null ? 1 : -1;
        } else {
          result = sort === 'price-asc' ? pa - pb : pb - pa;
        }
      } else {
        const order = getName(a.item).localeCompare(getName(b.item), undefined, { sensitivity: 'base' });
        result = sort === 'name-asc' ? order : -order;
      }
      return result || a.index - b.index;
    })
    .map((entry) => entry.item);
}
