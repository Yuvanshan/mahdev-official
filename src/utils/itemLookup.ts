import { deriveLookupSku } from './whatsapp';

export interface DisplayGalleryItem {
  id: string;
  sku: string;
  url: string;
  title: string;
  category: string;
  divisionId?: string;
  divisionName?: string;
  location?: string;
  description?: string;
  price?: number | string;
  tags?: string[];
  year?: string;
  dimensions?: string;
  isCustomInquiry?: boolean;
}

/**
 * Derives a consistent, canonical SKU for media assets across admin, gallery, and sharing.
 */
export function resolveMediaAssetSku(asset: {
  id?: string;
  sku?: string;
  title?: string;
  division?: string;
  divisionId?: string;
}): string {
  if (asset.sku && asset.sku.trim()) {
    return asset.sku.trim().toUpperCase();
  }
  const divRaw = asset.division || asset.divisionId || 'U1';
  const cleanDiv = divRaw.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase() || 'U1';

  if (asset.id && asset.id.trim()) {
    const cleanId = asset.id.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const shortId = cleanId.length > 6 ? cleanId.slice(-6) : cleanId;
    return `MED-${cleanDiv}-${shortId}`;
  }

  return deriveLookupSku(asset.title, cleanDiv);
}

/**
 * Normalizes SKU string for comparison (removes spaces, hyphens, lowercase)
 */
export function normalizeCode(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Intelligently matches an item against a target query (SKU, ID, or title slug)
 */
export function matchGalleryItem(
  items: DisplayGalleryItem[],
  query: string
): DisplayGalleryItem | undefined {
  if (!query || !query.trim() || items.length === 0) return undefined;

  const rawClean = query.trim().toLowerCase();
  const normalizedQuery = normalizeCode(query);

  // 1. Exact SKU match (case-insensitive)
  const exactSku = items.find((i) => i.sku && i.sku.toLowerCase() === rawClean);
  if (exactSku) return exactSku;

  // 2. Exact ID match
  const exactId = items.find((i) => i.id && i.id.toLowerCase() === rawClean);
  if (exactId) return exactId;

  // 3. Normalized SKU match (ignoring dashes and spacing)
  const normSku = items.find((i) => normalizeCode(i.sku) === normalizedQuery);
  if (normSku) return normSku;

  // 4. Normalized ID match
  const normId = items.find((i) => normalizeCode(i.id) === normalizedQuery);
  if (normId) return normId;

  // 5. Check if query matches deriveLookupSku from title
  const derivedMatch = items.find((i) => {
    const derived = deriveLookupSku(i.title, i.divisionId);
    return (
      derived.toLowerCase() === rawClean ||
      normalizeCode(derived) === normalizedQuery
    );
  });
  if (derivedMatch) return derivedMatch;

  // 6. Substring match on SKU or ID if long enough
  if (normalizedQuery.length >= 4) {
    const subMatch = items.find((i) => {
      const nSku = normalizeCode(i.sku);
      const nId = normalizeCode(i.id);
      return (
        (nSku && (nSku.includes(normalizedQuery) || normalizedQuery.includes(nSku))) ||
        (nId && (nId.includes(normalizedQuery) || normalizedQuery.includes(nId)))
      );
    });
    if (subMatch) return subMatch;
  }

  // 7. Title match (exact or containing)
  if (rawClean.length >= 4) {
    const titleMatch = items.find((i) => {
      const t = i.title.toLowerCase();
      return t === rawClean || t.includes(rawClean) || rawClean.includes(t);
    });
    if (titleMatch) return titleMatch;
  }

  return undefined;
}

/**
 * Builds a fallback synthesized item if the URL contained title/image params directly
 */
export function synthesizeInquiryItemFromParams(
  params: URLSearchParams
): DisplayGalleryItem | null {
  const title = params.get('title') || params.get('name');
  const imageUrl = params.get('image') || params.get('imageUrl') || params.get('url');
  const sku = params.get('sku') || params.get('id');

  if (!title && !imageUrl && !sku) return null;

  const division = params.get('division') || params.get('divisionName') || 'Mahdev Group';
  const category = params.get('category') || 'Customer Inquired Selection';

  return {
    id: sku || 'inquired-item',
    sku: sku || deriveLookupSku(title || 'Item', division),
    url: imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    title: title || `Inquired Item (${sku || 'Mahdev'})`,
    category,
    divisionId: division,
    divisionName: division,
    location: params.get('location') || 'Customer Selection',
    description: params.get('description') || 'Direct customer WhatsApp inquiry item.',
    isCustomInquiry: true,
  };
}
