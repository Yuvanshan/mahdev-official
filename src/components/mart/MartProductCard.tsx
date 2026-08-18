import React from 'react';
import {
  ShoppingCart,
  Eye,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Product } from '../../data/martData';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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
  return (
    <div className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      {/* Top Media Container */}
      <div>
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
        <div className="p-4 space-y-2.5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-400 truncate max-w-[120px]">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold font-mono">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onViewProduct(product)}
            className="font-display text-sm font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors leading-snug line-clamp-2 cursor-pointer h-10"
          >
            {product.name}
          </h3>

          {/* Availability Status */}
          <div className="flex items-center gap-1.5 text-[11px]">
            {product.inStock ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>In Stock ({product.stockCount} left)</span>
              </span>
            ) : (
              <span className="text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Out of Stock</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer: Price & Add to Cart */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-3">
        <div className="flex items-baseline justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-bold text-slate-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="font-mono text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProduct(product)}
            className="text-xs w-full hover:border-[#0052FF] hover:text-[#0052FF]"
          >
            Details
          </Button>

          <Button
            variant="electric"
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            className="text-xs w-full font-bold shadow-xs"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};
