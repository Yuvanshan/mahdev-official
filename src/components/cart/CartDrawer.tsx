import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  onNavigate?: (path: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    isCartDrawerOpen,
    closeCart,
    cartItems,
    cartSummary,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponFeedback({ type: 'success', message: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  const handleQuickCoupon = (code: string) => {
    const res = applyCoupon(code);
    if (res.success) {
      setCouponFeedback({ type: 'success', message: res.message });
    } else {
      setCouponFeedback({ type: 'error', message: res.message });
    }
  };

  const handleProceedToCheckout = () => {
    closeCart();
    if (onNavigate) {
      onNavigate('/checkout');
    } else {
      window.location.href = '/checkout';
    }
  };

  const progressPercent = Math.min(
    100,
    (cartSummary.subtotal / cartSummary.freeShippingThreshold) * 100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-white">Your Shopping Cart</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {cartSummary.totalQuantity} {cartSummary.totalQuantity === 1 ? 'item' : 'items'} across Mahdev Ecosystem
              </span>
            </div>
          </div>

          <button
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator (for physical items) */}
        {cartSummary.requiresShippingAddress && (
          <div className="p-3 bg-blue-50/90 border-b border-blue-100 text-xs shrink-0">
            <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5 text-[11px]">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                {cartSummary.isFreeShipping ? (
                  <strong className="text-emerald-700 font-bold">
                    You unlocked FREE Island-Wide Courier Delivery!
                  </strong>
                ) : (
                  <span>
                    Add <strong>${(cartSummary.freeShippingThreshold - cartSummary.subtotal).toFixed(2)}</strong> more for FREE delivery
                  </span>
                )}
              </span>
              <span className="font-mono font-bold text-blue-700">
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  cartSummary.isFreeShipping ? 'bg-emerald-500' : 'bg-[#0052FF]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 divide-y divide-slate-100">
          {cartItems.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-slate-900">Your Cart is Empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our Master Catalog, Ceylon luxury teas, IT systems, or reserve event & travel services.
                </p>
              </div>
              <div className="flex flex-col gap-2 max-w-xs mx-auto pt-2">
                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => {
                    closeCart();
                    if (onNavigate) onNavigate('/catalog');
                  }}
                  className="text-xs"
                >
                  Explore Master Catalog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeCart();
                    if (onNavigate) onNavigate('/mart');
                  }}
                  className="text-xs"
                >
                  Browse Mahdev Mart
                </Button>
              </div>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-start">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider">
                        {item.divisionName}
                      </span>
                      <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1">
                        {item.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Variant & Service Metadata */}
                  <div className="flex flex-wrap gap-1">
                    {item.selectedVariant && (
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.selectedVariant.name}
                      </span>
                    )}
                    {item.productType !== 'physical' && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {item.productType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {item.bookingDetails?.date && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{item.bookingDetails.date}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-l cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-r cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price and Savings */}
                    <div className="text-right">
                      {item.originalPrice && item.originalPrice > item.unitPrice && (
                        <span className="text-[10px] text-slate-400 line-through mr-1.5 font-mono">
                          ${(item.originalPrice * item.quantity).toFixed(2)}
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-900">
                        ${item.itemTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon.code}</strong> Applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-xs underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter Promo Code (e.g. MAHDEV2026)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="text-xs">
                    Apply
                  </Button>
                </form>
              )}

              {couponFeedback && (
                <p
                  className={`text-[11px] ${
                    couponFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {couponFeedback.message}
                </p>
              )}

              {/* Quick Coupon Suggestions */}
              {!appliedCoupon && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 overflow-x-auto pb-0.5">
                  <span className="shrink-0 text-slate-400 font-medium">Try:</span>
                  <button
                    onClick={() => handleQuickCoupon('MAHDEV2026')}
                    className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 font-mono text-slate-700 cursor-pointer"
                  >
                    MAHDEV2026 (-10%)
                  </button>
                  <button
                    onClick={() => handleQuickCoupon('FREESHIP')}
                    className="px-1.5 py-0.5 rounded bg-slate-200/80 hover:bg-slate-300 font-mono text-slate-700 cursor-pointer"
                  >
                    FREESHIP
                  </button>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 text-xs pt-1 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cartSummary.totalQuantity} items)</span>
                <span className="font-mono font-bold text-slate-900">
                  ${cartSummary.subtotal.toFixed(2)}
                </span>
              </div>

              {cartSummary.productDiscountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Product Savings</span>
                  <span className="font-mono font-bold">
                    -${cartSummary.productDiscountTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {cartSummary.couponDiscountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Promo Discount ({appliedCoupon?.code})</span>
                  <span className="font-mono font-bold">
                    -${cartSummary.couponDiscountTotal.toFixed(2)}
                  </span>
                </div>
              )}

              {cartSummary.requiresShippingAddress && (
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Delivery</span>
                  <span className="font-mono text-slate-900">
                    {cartSummary.isFreeShipping ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      `$${cartSummary.shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-base text-[#0052FF]">
                  ${cartSummary.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Transition Note */}
            <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[10px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Enterprise Checkout Architecture:</strong> Phase 12 collects all customer, delivery, and booking specifications and transitions into payment processing.
              </span>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2">
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 px-4 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  onClick={closeCart}
                  className="font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
