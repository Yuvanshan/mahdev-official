import { useMemo } from 'react';
import { FirestoreGallery } from '../../types/firestore';
import { getInterestWeights, scoreInterest } from '../../utils/usageProfile';
import { ShopTileData } from './ShopProductTile';
import { galleryPath } from '../../config/itemSeo';

/**
 * Tiles that match this visitor's searches and views (read from this browser only) come first,
 * then the rest in the order given (callers pass newest first), so new items always show up.
 */
export function rankByInterest(tiles: ShopTileData[], limit: number): ShopTileData[] {
  const weights = getInterestWeights();
  return tiles
    .map((tile, index) => ({ tile, index, score: scoreInterest(tile.interest || tile.name, weights) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.tile);
}

export function useSuggestedGallery(gallery: FirestoreGallery[], limit: number): ShopTileData[] {
  return useMemo(() => {
    const tiles = gallery
      .filter((item) => item.type === 'image' && (item.thumbnailUrl || item.url || item.mediaUrl))
      .sort((a, b) => (b.listedAt || '').localeCompare(a.listedAt || ''))
      .map<ShopTileData>((item) => ({
        id: item.id,
        name: item.title,
        imageUrl: item.thumbnailUrl || item.mediaUrl || item.url,
        caption: item.category || item.tag || 'Gallery',
        href: galleryPath(item.title, item.id),
        interest: [item.title, item.category, item.tag, item.caption, ...(item.tags || [])].filter(Boolean).join(' '),
      }));
    return rankByInterest(tiles, limit);
  }, [gallery, limit]);
}
