import { ProductType } from './catalog';

export interface CartVariantSelection {
  id: string;
  name: string;
  sku: string;
  priceModifier?: number;
  weight?: string;
  color?: string;
  dimensions?: string;
}

export interface CartBookingDetails {
  date?: string;
  time?: string;
  location?: string;
  guestCount?: number;
  servicePackage?: string;
  notes?: string;
}

export interface CartItem {
  id: string; // Unique combination of productId and variantId
  productId: string;
  sku: string;
  name: string;
  slug: string;
  divisionId: 'mart' | 'sws' | 'u1' | 'it' | 'travels' | 'minerals' | 'consulting' | 'holdings' | string;
  divisionName: string;
  productType: ProductType;
  unitPrice: number; // Base price + variant price modifier
  originalPrice?: number;
  discountPercent?: number;
  selectedVariant?: CartVariantSelection;
  quantity: number;
  imageUrl: string;
  leadTimeDays?: number;
  bookingDetails?: CartBookingDetails;
  itemTotal: number; // unitPrice * quantity
  itemDiscount: number; // (originalPrice - unitPrice) * quantity if discounted
}

export interface CouponCode {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // e.g. 10 for 10%, 5 for $5
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate?: string;
}

export interface CartSummary {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  totalOriginalPrice: number;
  productDiscountTotal: number;
  couponDiscountTotal: number;
  appliedCoupon: CouponCode | null;
  shippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  tax: number;
  grandTotal: number;
  total?: number;
  requiresShippingAddress: boolean;
  requiresBookingInfo: boolean;
}
