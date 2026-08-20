import React, { useState } from 'react';
import {
  ShoppingCart,
  Eye,
  Star,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Product } from '../../data/martData';

interface MartProductCardProps {
  product: Product;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const MartProductCard: React.FC<MartProductCardProps> = ({
  product,
  onViewProduct,
  onAddToCart,
}) => {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.inStock) return;
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between h-full">
      {/* Top Media & Content Container */}
      <div className="flex flex-col flex-1">
        {/* Media Container */}
        <div
          onClick={() => onViewProduct(product)}
          className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
        >
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.discountPercent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-600 text-white shadow-xs">
                {product.discountPercent}% OFF
              </span>
            )}
            {product.isBestSeller && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-slate-950 shadow-xs">
                BEST SELLER
              </span>
            )}
            {product.isTrending && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#0052FF] text-white shadow-xs">
                TRENDING
              </span>
            )}
          </div>

          {/* Quick Action Hover Bar */}
          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewProduct(product);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/95 text-slate-900 hover:bg-white text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Quick View</span>
            </button>
          </div>
        </div>

        {/* Info Content */}
        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between text-[11px] gap-2 mb-1">
              <span className="font-mono text-slate-400 truncate max-w-[120px]">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold font-mono shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
              </div>
            </div>

            {/* Product Title (stable height for short and long titles) */}
            <h3
              onClick={() => onViewProduct(product)}
              className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug line-clamp-2 cursor-pointer min-h-[2.5rem]"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1 mb-2">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-1.5 text-[11px] pt-1">
            {product.inStock ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>In Stock ({product.stockCount} left)</span>
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Out of Stock</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Price & Add to Cart Responsive Container */}
      <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-3">
        {/* Price Row */}
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="font-mono text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {product.categoryName}
          </span>
        </div>

        {/* Action Button Container: 100% width responsive layout */}
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 text-slate-700 hover:text-[#0052FF] text-xs font-semibold transition-colors flex items-center justify-center shrink-0 min-h-[40px] cursor-pointer"
            title="View Product Details"
            aria-label="View Product Details"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline ml-1.5">Details</span>
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex-1 w-full min-h-[40px] px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer select-none ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : !product.inStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-[#0052FF] hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-200 shrink-0" />
                <span className="truncate">Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="truncate">{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
