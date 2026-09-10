import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { CartItem, CartSummary, CouponCode, CartVariantSelection, CartBookingDetails } from '../types/cart';
import { CatalogProduct, ProductVariantOption } from '../types/catalog';
import { analyticsService } from '../services/analyticsService';

interface CartContextType {
  cartItems: CartItem[];
  cartSummary: CartSummary;
  addToCart: (
    product: CatalogProduct | any,
    variant?: ProductVariantOption | CartVariantSelection | null,
    quantity?: number,
    bookingDetails?: CartBookingDetails
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: CouponCode | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  isCartDrawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalQuantity: number;
}

const VALID_COUPONS: CouponCode[] = [
  {
    code: 'MAHDEV2026',
    description: '10% Corporate Launch Discount across all divisions',
    discountType: 'percentage',
    discountValue: 10,
  },
  {
    code: 'CEYLON15',
    description: '15% Off Orders above Rs. 10,000 on Pure Ceylon Goods',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 10000,
  },
  {
    code: 'FREESHIP',
    description: 'Complimentary Island-Wide Courier Dispatch',
    discountType: 'free_shipping',
    discountValue: 0,
  },
  {
    code: 'WELCOME5',
    description: 'Rs. 1,000 Instant Welcome Credit (Min order Rs. 5,000)',
    discountType: 'fixed',
    discountValue: 1000,
    minOrderAmount: 5000,
  },
];

const CART_STORAGE_KEY = 'mahdev_cart_v1';
const COUPON_STORAGE_KEY = 'mahdev_coupon_v1';
const FREE_SHIPPING_THRESHOLD = 15000; // 15,000 LKR for automatic free courier delivery
const STANDARD_SHIPPING_RATE = 650; // 650 LKR standard islandwide shipping

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial cart from LocalStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load coupon from LocalStorage
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to persist cart items to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist coupon to localStorage', e);
    }
  }, [appliedCoupon]);

  // Comprehensive cart calculations
  const cartSummary: CartSummary = useMemo(() => {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);

    const totalOriginalPrice = cartItems.reduce((sum, item) => {
      const orig = item.originalPrice !== undefined ? item.originalPrice : item.unitPrice;
      return sum + orig * item.quantity;
    }, 0);

    const productDiscountTotal = Math.max(0, totalOriginalPrice - subtotal);

    const requiresShippingAddress = cartItems.some(
      (item) => item.productType === 'physical'
    );

    const requiresBookingInfo = cartItems.some((item) =>
      ['service', 'package', 'bookable_service'].includes(item.productType)
    );

    // Shipping calculations
    let isFreeShipping = false;
    let shippingFee = 0;

    if (requiresShippingAddress && subtotal > 0) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD || appliedCoupon?.discountType === 'free_shipping') {
        isFreeShipping = true;
        shippingFee = 0;
      } else {
        shippingFee = STANDARD_SHIPPING_RATE;
      }
    }

    // Coupon discount calculations
    let couponDiscountTotal = 0;
    if (appliedCoupon && subtotal > 0) {
      if (
        appliedCoupon.minOrderAmount === undefined ||
        subtotal >= appliedCoupon.minOrderAmount
      ) {
        if (appliedCoupon.discountType === 'percentage') {
          couponDiscountTotal = (subtotal * appliedCoupon.discountValue) / 100;
        } else if (appliedCoupon.discountType === 'fixed') {
          couponDiscountTotal = Math.min(subtotal, appliedCoupon.discountValue);
        }
      }
    }

    const tax = 0; // Tax included or standard
    const grandTotal = Math.max(0, subtotal - couponDiscountTotal + shippingFee + tax);

    return {
      items: cartItems,
      totalQuantity,
      subtotal,
      totalOriginalPrice,
      productDiscountTotal,
      couponDiscountTotal,
      appliedCoupon,
      shippingFee,
      isFreeShipping,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      tax,
      grandTotal,
      requiresShippingAddress,
      requiresBookingInfo,
    };
  }, [cartItems, appliedCoupon]);

  const addToCart = (
    product: CatalogProduct | any,
    variant?: ProductVariantOption | CartVariantSelection | null,
    quantity: number = 1,
    bookingDetails?: CartBookingDetails
  ) => {
    if (quantity <= 0) return;

    const variantId = variant?.id || 'standard';
    const cartItemId = `${product.id}_${variantId}`;

    const basePrice = Number(product.price) || 0;
    const priceModifier = Number(variant?.priceModifier) || 0;
    const unitPrice = basePrice + priceModifier;

    const originalPrice = product.originalPrice !== undefined ? Number(product.originalPrice) + priceModifier : undefined;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          itemTotal: unitPrice * newQty,
          itemDiscount: originalPrice ? (originalPrice - unitPrice) * newQty : 0,
          bookingDetails: bookingDetails || updated[existingIndex].bookingDetails,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          productId: product.id,
          sku: variant?.sku || product.sku || `SKU-${product.id}`,
          name: product.name,
          slug: product.slug || product.id,
          divisionId: product.divisionId || product.division || 'mart',
          divisionName: product.divisionName || 'Mahdev Group',
          productType: product.productType || 'physical',
          unitPrice,
          originalPrice,
          discountPercent: product.discountPercent,
          selectedVariant: variant
            ? {
                id: variant.id,
                name: variant.name,
                sku: variant.sku,
                priceModifier: variant.priceModifier,
                weight: 'weight' in variant ? variant.weight : undefined,
                color: 'color' in variant ? variant.color : undefined,
                dimensions: 'dimensions' in variant ? variant.dimensions : undefined,
              }
            : undefined,
          quantity,
          imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
          leadTimeDays: product.leadTimeDays,
          bookingDetails,
          itemTotal: unitPrice * quantity,
          itemDiscount: originalPrice ? (originalPrice - unitPrice) * quantity : 0,
        };
        return [...prevItems, newItem];
      }
    });

    analyticsService.trackAddToCart(
      product.id,
      product.name,
      unitPrice,
      quantity
    );

    setIsCartDrawerOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const itemTotal = item.unitPrice * quantity;
          const itemDiscount = item.originalPrice ? (item.originalPrice - item.unitPrice) * quantity : 0;
          return {
            ...item,
            quantity,
            itemTotal,
            itemDiscount,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const trimmed = code.trim().toUpperCase();
    const found = VALID_COUPONS.find((c) => c.code === trimmed);

    if (!found) {
      return { success: false, message: `Coupon code "${code}" is invalid or expired.` };
    }

    if (found.minOrderAmount && cartSummary.subtotal < found.minOrderAmount) {
      return {
        success: false,
        message: `Coupon "${trimmed}" requires a minimum subtotal of $${found.minOrderAmount.toFixed(2)}.`,
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `Promo code "${found.code}" applied: ${found.description}` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const openCart = () => setIsCartDrawerOpen(true);
  const closeCart = () => setIsCartDrawerOpen(false);
  const toggleCart = () => setIsCartDrawerOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSummary,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        isCartDrawerOpen,
        openCart,
        closeCart,
        toggleCart,
        totalQuantity: cartSummary.totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
