import { CartVariantSelection, CartBookingDetails } from './cart';
import { ProductType } from './catalog';

export type OrderStatus =
  | 'pending_payment'
  | 'processing'
  | 'confirmed'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export type OrderPaymentStatus =
  | 'unpaid'
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export type OrderPaymentMethod =
  | 'credit_card'
  | 'bank_transfer'
  | 'cod'
  | 'stripe'
  | 'koko_pay';

export interface OrderRefundRecord {
  id: string;
  amount: number;
  reason: string;
  processedAt: string;
  processedBy: string;
  restocked: boolean;
}

export interface OrderAdminNote {
  id: string;
  author: string;
  note: string;
  createdAt: string;
  isCustomerVisible?: boolean;
}

export interface ShippingMethod {
  id: 'standard' | 'express' | 'freight' | 'digital_instant';
  name: string;
  cost: number;
  estimatedDelivery: string;
  description: string;
}

export interface CustomerOrderDetails {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  preferredContact: 'email' | 'phone' | 'whatsapp';
}

export interface ShippingAddress {
  street: string;
  apartment?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface OrderDeliveryInfo {
  methodId: string;
  methodName: string;
  cost: number;
  estimatedDelivery: string;
  address?: ShippingAddress;
  specialInstructions?: string;
}

export interface OrderBookingInfo {
  preferredDate?: string;
  preferredTimeSlot?: string;
  venueOrLocation?: string;
  specialRequirements?: string;
  attendeesOrGuests?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  slug: string;
  divisionId: string;
  divisionName: string;
  productType: ProductType;
  selectedVariant?: CartVariantSelection;
  unitPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  lineTotal: number;
  discountAmount: number;
  imageUrl: string;
  bookingDetails?: CartBookingDetails;
}

export interface Order {
  id: string; // Formatted Order ID: e.g. "ORD-2026-8941"
  customer: CustomerOrderDetails;
  items: OrderItem[];
  totalQuantity: number;
  subtotal: number;
  productDiscounts: number;
  couponDiscount: number;
  appliedCouponCode?: string;
  shippingFee: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  paymentGatewayReady: boolean;
  deliveryInfo?: OrderDeliveryInfo;
  bookingInfo?: OrderBookingInfo;
  customerNotes?: string;
  adminNotesList?: OrderAdminNote[];
  refunds?: OrderRefundRecord[];
  trackingNumber?: string;
  carrier?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateOrderInput {
  customer: CustomerOrderDetails;
  deliveryInfo?: OrderDeliveryInfo;
  bookingInfo?: OrderBookingInfo;
  customerNotes?: string;
  appliedCouponCode?: string;
  paymentMethod?: string;
  transactionId?: string;
}
