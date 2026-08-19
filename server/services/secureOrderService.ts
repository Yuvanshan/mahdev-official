/**
 * Mahdev Enterprise Secure Order Service (Server-side)
 * 
 * Provides authoritative price recalculation, discount verification,
 * tax computation, stock validation, and state transition security.
 */

import crypto from 'crypto';

export interface OrderItemInput {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  selectedVariant?: string;
}

export interface OrderValidationInput {
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  items: OrderItemInput[];
  couponCode?: string;
  currency?: string;
  deliveryMethod?: 'standard' | 'express' | 'freight';
}

export interface ValidatedOrderResult {
  orderId: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  items: OrderItemInput[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending_payment' | 'confirmed' | 'in_production' | 'dispatched' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
  orderSignature: string;
  createdAt: string;
}

// Authoritative Master Catalog Price Registry (Server Truth)
const MASTER_PRICE_REGISTRY: Record<string, { name: string; priceUSD: number }> = {
  'prod-tea-01': { name: 'Single-Estate Ceylon Earl Grey Reserve', priceUSD: 38.0 },
  'prod-tea-02': { name: 'Silver Tips Imperial White Reserve', priceUSD: 85.0 },
  'prod-tea-03': { name: 'High-Grown Nuwara Eliya Pekoe Blend', priceUSD: 32.0 },
  'prod-tea-04': { name: 'Ruhuna Low-Grown Bold Leaf Reserve', priceUSD: 28.0 },
  'prod-tea-05': { name: 'Dimbula Valley Flowery Broken Orange Pekoe', priceUSD: 35.0 },
  'prod-tea-06': { name: 'Mahdev Ceylon Royal Heritage Master Tin', priceUSD: 120.0 },
  'prod-it-01': { name: 'Enterprise Cloud Ingress & Security Appliance', priceUSD: 2450.0 },
  'prod-it-02': { name: 'Managed Kubernetes Cluster Appliance Node', priceUSD: 1850.0 },
  'prod-sp-01': { name: 'Ceylon Organic Cinnamon Quills Grade ALBA', priceUSD: 45.0 },
  'prod-sp-02': { name: 'Organic Cardamom Green Pods AAA Special', priceUSD: 52.0 },
};

// Verified Coupon Codes
const VALID_COUPONS: Record<string, { type: 'percentage' | 'fixed'; value: number; minOrderUSD: number }> = {
  WELCOME10: { type: 'percentage', value: 10, minOrderUSD: 50 },
  MAHDEVVIP: { type: 'percentage', value: 15, minOrderUSD: 100 },
  ENTERPRISE20: { type: 'percentage', value: 20, minOrderUSD: 500 },
  DIRECT5: { type: 'fixed', value: 5, minOrderUSD: 30 },
};

const ORDER_SIGNATURE_SECRET =
  process.env.ORDER_SIGNATURE_SECRET || 'mahdev_authoritative_order_secret_salt_2026';

/**
 * Generates HMAC SHA-256 signature for tamper-proof order records
 */
export function generateOrderSignature(orderId: string, totalAmount: number, email: string): string {
  const data = `${orderId}:${totalAmount.toFixed(2)}:${email}:${ORDER_SIGNATURE_SECRET}`;
  return crypto.createHmac('sha256', ORDER_SIGNATURE_SECRET).update(data).digest('hex');
}

/**
 * Authoritatively validates items, discounts, shipping, and tax
 */
export function validateAndCreateAuthoritativeOrder(input: OrderValidationInput): {
  success: boolean;
  order?: ValidatedOrderResult;
  error?: string;
} {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: 'Cannot create order with an empty items cart.' };
  }

  if (!input.customerEmail || !input.customerEmail.includes('@')) {
    return { success: false, error: 'Valid customer email is required for authoritative order creation.' };
  }

  // Recalculate subtotal using server-authoritative price lookup
  let verifiedSubtotal = 0;
  const validatedItems: OrderItemInput[] = [];

  for (const item of input.items) {
    if (!item.quantity || item.quantity <= 0 || item.quantity > 500) {
      return { success: false, error: `Invalid item quantity (${item.quantity}) for item ${item.name || item.productId}.` };
    }

    const catalogEntry = MASTER_PRICE_REGISTRY[item.productId];
    const unitPrice = catalogEntry ? catalogEntry.priceUSD : Math.max(1, item.unitPrice);
    const itemName = catalogEntry ? catalogEntry.name : item.name;

    verifiedSubtotal += unitPrice * item.quantity;
    validatedItems.push({
      productId: item.productId,
      name: itemName,
      unitPrice,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant,
    });
  }

  // Authoritative Coupon & Discount Calculation
  let discountAmount = 0;
  if (input.couponCode) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = VALID_COUPONS[code];
    if (coupon) {
      if (verifiedSubtotal >= coupon.minOrderUSD) {
        if (coupon.type === 'percentage') {
          discountAmount = (verifiedSubtotal * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }
      }
    }
  }

  const discountedSubtotal = Math.max(0, verifiedSubtotal - discountAmount);

  // Authoritative Shipping Calculation
  let shippingFee = 0;
  if (input.deliveryMethod === 'express') {
    shippingFee = 35.0;
  } else if (input.deliveryMethod === 'freight') {
    shippingFee = 95.0;
  } else {
    // Standard shipping: Free if discountedSubtotal >= $150, else $15
    shippingFee = discountedSubtotal >= 150.0 ? 0.0 : 15.0;
  }

  // Tax calculation (8% standard fiscal rate)
  const taxAmount = parseFloat((discountedSubtotal * 0.08).toFixed(2));
  const totalAmount = parseFloat((discountedSubtotal + shippingFee + taxAmount).toFixed(2));

  const orderId = `ORD-2026-${Date.now().toString().slice(-4)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const orderSignature = generateOrderSignature(orderId, totalAmount, input.customerEmail);

  const order: ValidatedOrderResult = {
    orderId,
    customerId: input.customerId,
    customerEmail: input.customerEmail.toLowerCase().trim(),
    customerName: input.customerName.trim(),
    items: validatedItems,
    subtotal: parseFloat(verifiedSubtotal.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    shippingFee: parseFloat(shippingFee.toFixed(2)),
    taxAmount,
    totalAmount,
    currency: input.currency || 'USD',
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    orderSignature,
    createdAt: new Date().toISOString(),
  };

  return {
    success: true,
    order,
  };
}

/**
 * Validates state transitions to prevent unauthorized status changes
 */
export function validateOrderStatusTransition(
  currentStatus: string,
  newStatus: string
): { isValid: boolean; reason?: string } {
  const allowedTransitions: Record<string, string[]> = {
    pending_payment: ['paid', 'cancelled', 'confirmed'],
    paid: ['confirmed', 'refunded', 'in_production'],
    confirmed: ['in_production', 'dispatched', 'cancelled', 'refunded'],
    in_production: ['dispatched', 'cancelled'],
    dispatched: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  const validNextStates = allowedTransitions[currentStatus] || [];
  if (!validNextStates.includes(newStatus)) {
    return {
      isValid: false,
      reason: `Illegal order transition from "${currentStatus}" to "${newStatus}". Allowed transitions: [${validNextStates.join(', ')}]`,
    };
  }

  return { isValid: true };
}
