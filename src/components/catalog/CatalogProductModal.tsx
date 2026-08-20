import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Star,
  CheckCircle2,
  AlertTriangle,
  Infinity as InfinityIcon,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Cpu,
  Layers,
  Camera,
  Compass,
  ArrowRight,
  Download,
  Calendar,
  Layers as LayersIcon,
  Check,
  Share2,
  ShoppingCart,
} from 'lucide-react';
import { CatalogProduct, ProductVariantOption } from '../../types/catalog';
import { catalogService } from '../../services/catalogService';
import { useCart } from '../../context/CartContext';

interface CatalogProductModalProps {
  product: CatalogProduct | null;
  onClose: () => void;
  onSelectRelated: (product: CatalogProduct) => void;
}

export const CatalogProductModal: React.FC<CatalogProductModalProps> = ({
  product,
  onClose,
  onSelectRelated,
}) => {
  if (!product) return null;

  const { addToCart, openCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantOption | undefined>(
    product.variants?.options[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [actionSuccess, setActionSuccess] = useState(false);

  const relatedProducts = catalogService.getRelatedProducts(product, 3);

  const currentPrice = (product.price + (selectedVariant?.priceModifier || 0)) * quantity;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setActionSuccess(true);
    setTimeout(() => {
      setActionSuccess(false);
    }, 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    onClose();
    openCart();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200"
        >
          {/* Top Bar with SKU & Close Button */}
          <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-neutral-500 bg-neutral-200/80 px-2.5 py-1 rounded">
                SKU: {selectedVariant ? selectedVariant.sku : product.sku}
              </span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {product.divisionName}
              </span>
              <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
                {product.categoryName}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content Scrollable Area */}
          <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Gallery */}
              <div className="space-y-4">
                <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.discountPercent && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-md">
                      -{product.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {product.gallery && product.gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.gallery.map((imgUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          selectedImage === imgUrl
                            ? 'border-amber-600 ring-2 ring-amber-500/30'
                            : 'border-neutral-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Assurance Points */}
                <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-xs text-neutral-600">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certified Genuine Mahdev Verified Quality Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Express Island-Wide & Global Air Courier Shipping</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Info & Configuration */}
              <div className="flex flex-col justify-between space-y-6">
                <div>
                  {/* Brand & Type */}
                  <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-1">
                    {product.brand} • <span className="text-neutral-700 capitalize">{product.productType.replace('_', ' ')}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-serif text-neutral-900 mb-2 font-medium leading-tight">
                    {product.name}
                  </h2>

                  {/* Rating & Stock Summary */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-neutral-800">{product.rating}</span>
                      <span className="text-xs text-neutral-400">({product.reviewsCount} customer reviews)</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-3 mb-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
                    <span className="text-3xl font-bold text-neutral-900">
                      ${currentPrice.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        ${(product.originalPrice * quantity).toFixed(2)}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500 font-mono ml-auto">
                      Currency: {product.currency}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    {product.description}
                  </p>

                  {/* Variants Selector if present */}
                  {product.variants && (
                    <div className="space-y-2 mb-6">
                      <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Select {product.variants.type}:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.options.map((opt) => {
                          const isSelected = selectedVariant?.id === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setSelectedVariant(opt)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                              }`}
                            >
                              <span>{opt.name}</span>
                              {opt.priceModifier ? (
                                <span className="ml-1 opacity-80">(+${opt.priceModifier})</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector for physical products */}
                  {product.productType === 'physical' && (
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Quantity:
                      </span>
                      <div className="inline-flex items-center border border-neutral-200 rounded-lg bg-neutral-50">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-200/70 rounded-l-lg transition-colors font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 text-sm font-semibold text-neutral-800 font-mono">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-200/70 rounded-r-lg transition-colors font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-neutral-400">
                        Available Stock: <strong>{product.stockQuantity}</strong> units
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary CTA & Interactive Feedback */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all bg-slate-900 hover:bg-slate-800 text-white cursor-pointer min-h-[44px]"
                    >
                      {actionSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 shrink-0" />
                          <span>Add to Cart (${currentPrice.toFixed(2)})</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all bg-[#0052FF] hover:bg-blue-700 text-white cursor-pointer min-h-[44px] shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4 shrink-0" />
                      <span>Checkout</span>
                    </button>
                  </div>

                  {['bookable_service', 'package', 'service'].includes(product.productType) && (
                    <a
                      href={`/book?division=${product.division}`}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 border border-amber-500/40 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Book via Universal Reservation Engine</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Product Specifications Section */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="pt-6 border-t border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <LayersIcon className="w-4 h-4 text-amber-600" />
                  <span>Technical Specifications & Metadata</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {product.specifications.map((spec, index) => (
                    <div
                      key={index}
                      className="flex justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200/70"
                    >
                      <span className="font-medium text-neutral-500">{spec.label}</span>
                      <span className="font-semibold text-neutral-900 text-right ml-4">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Products from Master Catalog */}
            {relatedProducts.length > 0 && (
              <div className="pt-6 border-t border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-900 mb-4">
                  Related Catalog Products & Services
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelated(rel)}
                      className="group p-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-xs transition-all cursor-pointer bg-neutral-50/50 flex flex-col justify-between"
                    >
                      <div className="aspect-16/10 rounded-lg overflow-hidden mb-2 bg-neutral-200">
                        <img src={rel.imageUrl} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                          {rel.divisionName}
                        </span>
                        <h4 className="text-xs font-medium text-neutral-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                          {rel.name}
                        </h4>
                        <p className="text-xs font-bold text-neutral-900 mt-1">
                          ${rel.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
