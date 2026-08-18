import React, { useState } from 'react';
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Minus,
  Plus,
  Share2,
} from 'lucide-react';
import { Product, ProductVariant, MART_PRODUCTS } from '../../data/martData';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface MartProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onSelectRelatedProduct: (product: Product) => void;
}

export const MartProductDetailModal: React.FC<MartProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onSelectRelatedProduct,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('desc');

  if (!isOpen || !product) return null;

  // Calculate current price based on variant modifier
  const currentVariant = selectedVariant || (product.variants?.options[0] || null);
  const variantModifier = currentVariant?.priceModifier || 0;
  const unitPrice = product.price + variantModifier;
  const originalUnitPrice = product.originalPrice ? product.originalPrice + variantModifier : undefined;

  // Find related products in the same category
  const relatedProducts = MART_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3);

  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    onAddToCart(product, currentVariant || undefined, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate">
            <span className="text-slate-400">Mart</span>
            <span>/</span>
            <span className="text-blue-400">{product.categoryName}</span>
            <span>/</span>
            <span className="text-white truncate max-w-[200px]">{product.name}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close product modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 text-slate-800">
          {/* Main 2-Column Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Image Gallery (5 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={product.gallery[activeImageIndex] || product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.discountPercent && (
                  <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md shadow-md">
                    {product.discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#0052FF] scale-105 shadow-sm'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Product Info & Purchase Controls (6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                  <span>Brand: {product.brand}</span>
                  <span>SKU: {currentVariant?.sku || product.sku}</span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm font-mono">{product.rating}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    ({product.reviewsCount} customer reviews)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Sourcing
                  </span>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    Online Price
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-3xl font-extrabold text-slate-900">
                      ${unitPrice.toFixed(2)}
                    </span>
                    {originalUnitPrice && (
                      <span className="font-mono text-sm text-slate-400 line-through">
                        ${originalUnitPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {product.inStock ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      In Stock ({product.stockCount})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Variant Selector (if available) */}
              {product.variants && (
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 block">
                    Select {product.variants.type}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.options.map((opt) => {
                      const isSelected = currentVariant?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedVariant(opt)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#0052FF] bg-blue-50 text-[#0052FF] shadow-xs'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          <span>{opt.name}</span>
                          {opt.priceModifier ? (
                            <span className="ml-1 text-[10px] text-slate-500 font-mono">
                              (+${opt.priceModifier})
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Add to Cart Controls */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-sm text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart CTA */}
                  <Button
                    variant="electric"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    leftIcon={<ShoppingCart className="w-4 h-4" />}
                    className="flex-1 text-sm font-bold shadow-md shadow-blue-500/20 py-3"
                  >
                    Add {quantity} to Cart • ${(unitPrice * quantity).toFixed(2)}
                  </Button>
                </div>

                {/* Trust Features Strip */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Island-Wide Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Authentic</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Tabs Section (Specifications, Full Description, Reviews) */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex gap-4 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'desc'
                    ? 'border-[#0052FF] text-[#0052FF]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Detailed Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'specs'
                    ? 'border-[#0052FF] text-[#0052FF]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Specifications ({product.specifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reviews'
                    ? 'border-[#0052FF] text-[#0052FF]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Customer Reviews ({product.reviewsCount})
              </button>
            </div>

            {activeTab === 'desc' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                <p>{product.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {product.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="rounded-xl border border-slate-200 overflow-hidden text-xs max-w-3xl">
                <table className="w-full text-left">
                  <tbody>
                    {product.specifications.map((spec, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}
                      >
                        <td className="p-3 font-semibold text-slate-900 w-1/3 border-r border-slate-100">
                          {spec.label}
                        </td>
                        <td className="p-3 text-slate-600">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 max-w-3xl">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.author}</span>
                        <span className="text-slate-400 font-mono">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-600 italic leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No customer reviews logged yet for this batch. Be the first to review!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Related Products Grid */}
          {relatedProducts.length > 0 && (
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                You May Also Like in {product.categoryName}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelatedProduct(rel)}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-[#0052FF] hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                  >
                    <img
                      src={rel.imageUrl}
                      alt={rel.name}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display text-xs font-bold text-slate-900 truncate">
                        {rel.name}
                      </h4>
                      <div className="font-mono text-xs font-bold text-[#0052FF] mt-0.5">
                        ${rel.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
