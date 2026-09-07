import React from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { CartItem } from '../../data/martData';
import { Button } from '../ui/Button';

interface MartCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export const MartCartDrawer: React.FC<MartCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.itemTotal, 0);
  const freeShippingThreshold = 75;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const getWhatsAppCartOrderLink = () => {
    const itemLines = items
      .map(
        (i, idx) =>
          `${idx + 1}. *${i.product.name}* ${
            i.selectedVariant ? `(${i.selectedVariant.name})` : ''
          } x ${i.quantity} = $${i.itemTotal.toFixed(2)}`
      )
      .join('\n');

    const text = encodeURIComponent(
      `Hello Mahdev Online Mart,\n\nI would like to place an order for the following cart items:\n\n${itemLines}\n\n*Subtotal:* $${subtotal.toFixed(
        2
      )}\n*Shipping:* ${isFreeShipping ? 'FREE' : '$5.00'}\n\nPlease confirm availability and dispatch schedule.`
    );
    return `https://wa.me/94750928078?text=${text}`;
  };

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
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="p-3 bg-blue-50/80 border-b border-blue-100 text-xs shrink-0">
          <div className="flex items-center justify-between font-medium text-slate-700 mb-1.5 text-[11px]">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              {isFreeShipping ? (
                <strong className="text-emerald-700 font-bold">You qualify for FREE Island-Wide Delivery!</strong>
              ) : (
                <span>
                  Add <strong>${(freeShippingThreshold - subtotal).toFixed(2)}</strong> more for FREE delivery
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-blue-700">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFreeShipping ? 'bg-emerald-500' : 'bg-[#0052FF]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-sm font-bold text-slate-900">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Explore our curated event decor, ambient lighting, and smart tech collections.
                </p>
              </div>
              <Button variant="electric" size="sm" onClick={onClose} className="text-xs">
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex gap-3 items-start">
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.selectedVariant && (
                    <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                      {item.selectedVariant.name}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-l cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded-r cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="font-mono text-xs font-bold text-slate-900">
                      ${item.itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Phase 10 Readiness */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-mono text-slate-900">
                  {isFreeShipping ? <span className="text-emerald-600 font-bold">FREE</span> : '$5.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono text-base text-[#0052FF]">
                  ${(subtotal + (isFreeShipping ? 0 : 5)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Architecture Foundation Notice */}
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[10px] text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Direct Dispatch Ready:</strong> Dispatch your cart directly to our 24/7 WhatsApp dispatch desk or prepare for full automated gateway checkout in Phase 10.
              </span>
            </div>

            <div className="space-y-2">
              <a
                href={getWhatsAppCartOrderLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant WhatsApp Dispatch Order</span>
              </a>

              <div className="flex items-center justify-between">
                <button
                  onClick={onClearCart}
                  className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  onClick={onClose}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
