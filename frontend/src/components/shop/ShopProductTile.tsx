import React from 'react';
import { Heart, Star } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { recordView } from '../../utils/usageProfile';
import { formatCurrency } from '../../utils/currency';
import { BlurredImageFrame } from '../common/BlurredImageFrame';

export interface ShopTileData {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewsCount?: number;
  caption?: string;
  href?: string;
  /** Text the visitor's interests are learned from when they open this tile. */
  interest?: string;
  currency?: string;
}

interface ShopProductTileProps {
  item: ShopTileData;
  onSelect: () => void;
}

// Flipkart-style tile: image, name, rating badge, price, struck-through price and % off.
export const ShopProductTile: React.FC<ShopProductTileProps> = ({ item, onSelect }) => {
  const hasDiscount = item.price !== undefined && item.originalPrice !== undefined && item.originalPrice > item.price;
  const percentOff = hasDiscount ? Math.round(((item.originalPrice! - item.price!) / item.originalPrice!) * 100) : 0;
  const currency = item.currency || 'LKR';
  const { isInWishlist, toggleWishlist } = useWishlist();
  const saved = isInWishlist(item.id);

  return (
    <div className="relative w-40 shrink-0 snap-start sm:w-48">
    <button
      type="button"
      onClick={() => {
        recordView(item.interest || item.name);
        onSelect();
      }}
      className="group flex w-full flex-col items-stretch gap-1.5 rounded-sm p-3 text-center transition-shadow hover:shadow-lg"
    >
      <BlurredImageFrame src={item.imageUrl} alt={item.name} className="mx-auto w-full transition-transform duration-200 group-hover:scale-[1.02]" />
      <span className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-900 group-hover:text-blue-700">{item.name}</span>
      {item.rating ? (
        <span className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-0.5 rounded-sm bg-emerald-600 px-1.5 py-0.5 font-semibold text-white">
            {item.rating.toFixed(1)} <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          </span>
          {item.reviewsCount ? `(${item.reviewsCount})` : null}
        </span>
      ) : null}
      {item.price !== undefined ? (
        <span className="flex flex-wrap items-center justify-center gap-1.5 text-sm font-semibold text-slate-900">
          {formatCurrency(item.price, currency)}
          {hasDiscount && (
            <>
              <span className="text-xs font-normal text-slate-500 line-through">{formatCurrency(item.originalPrice!, currency)}</span>
              <span className="text-xs font-semibold text-emerald-600">{percentOff}% off</span>
            </>
          )}
        </span>
      ) : (
        item.caption && <span className="text-xs font-medium text-emerald-600">{item.caption}</span>
      )}
    </button>
    {item.href && (
      <button
        type="button"
        onClick={() => toggleWishlist({ id: item.id, name: item.name, imageUrl: item.imageUrl, price: item.price, originalPrice: item.originalPrice, currency: item.currency, href: item.href! })}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
        className={`absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow ${saved ? 'text-rose-600' : 'text-slate-400 hover:text-rose-600'}`}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
      </button>
    )}
    </div>
  );
};
