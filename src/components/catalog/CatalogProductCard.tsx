import React from 'react';
import { motion } from 'motion/react';
import {
  Star,
  Eye,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  Camera,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Infinity as InfinityIcon,
  XCircle,
  FileCode,
  Calendar,
} from 'lucide-react';
import { CatalogProduct, ProductType, StockStatus } from '../../types/catalog';
import { useCart } from '../../context/CartContext';

interface CatalogProductCardProps {
  product: CatalogProduct;
  onSelect: (product: CatalogProduct) => void;
  onAddToCart?: (product: CatalogProduct) => void;
}

export const CatalogProductCard: React.FC<CatalogProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const { addToCart } = useCart();
  const [addedRecently, setAddedRecently] = React.useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product, product.variants?.options[0] || null, 1);
    }
    setAddedRecently(true);
    setTimeout(() => setAddedRecently(false), 2000);
  };
  // Helper for Product Type Badge
  const getTypeBadge = (type: ProductType) => {
    switch (type) {
      case 'physical':
        return { label: 'Physical Good', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'digital':
        return { label: 'Digital License', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'service':
        return { label: 'Enterprise Service', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'package':
        return { label: 'Curated Package', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'bookable_service':
        return { label: 'Bookable Session', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: 'Item', bg: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
    }
  };

  // Helper for Stock Status Badge
  const getStockBadge = (status: StockStatus, count: number) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>In Stock ({count})</span>
          </span>
        );
      case 'low_stock':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span>Only {count} Left</span>
          </span>
        );
      case 'unlimited':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <InfinityIcon className="w-3 h-3" />
            <span>Instant Digital / Available</span>
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Out of Stock</span>
          </span>
        );
    }
  };

  const typeBadge = getTypeBadge(product.productType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-xl border border-neutral-200/80 shadow-xs hover:shadow-lg hover:border-neutral-300 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Division Badge Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-neutral-900/90 text-white rounded-md backdrop-blur-md">
            {product.divisionName}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border backdrop-blur-md ${typeBadge.bg}`}>
            {typeBadge.label}
          </span>
        </div>

        {/* Discount Tag Top Right */}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 text-[11px] font-bold bg-red-600 text-white rounded-md shadow-xs">
            -{product.discountPercent}%
          </span>
        )}

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-0 bg-neutral-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-neutral-900 text-xs font-semibold rounded-lg shadow-md hover:bg-neutral-100 transition-colors transform translate-y-2 group-hover:translate-y-0 duration-200"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Specs & Details</span>
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* SKU + Category Line */}
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5 font-mono">
            <span className="truncate pr-2">SKU: {product.sku}</span>
            <span className="text-[11px] font-sans text-neutral-500 truncate max-w-[130px]">{product.categoryName}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-medium text-neutral-900 text-base leading-snug group-hover:text-amber-600 transition-colors line-clamp-2 cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">
            {product.shortDescription}
          </p>

          {/* Rating & Stock Status Row */}
          <div className="flex items-center justify-between gap-2 mb-4 pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-neutral-800">{product.rating}</span>
              <span className="text-[11px] text-neutral-400 font-sans">({product.reviewsCount})</span>
            </div>

            <div>{getStockBadge(product.stockStatus, product.stockQuantity)}</div>
          </div>
        </div>

        {/* Pricing & Primary CTA */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-neutral-900">
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              {product.currency} • {product.brand}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelect(product)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <span>View</span>
            </button>
            <button
              onClick={handleQuickAdd}
              disabled={product.stockStatus === 'out_of_stock'}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-xs cursor-pointer ${
                addedRecently
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {addedRecently ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
