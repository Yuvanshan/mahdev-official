import {
  Order,
  CreateOrderInput,
  OrderStatus,
  OrderPaymentStatus,
  ShippingMethod,
  CustomerOrderDetails,
  ShippingAddress,
  OrderDeliveryInfo,
  OrderBookingInfo,
  OrderItem,
  OrderAdminNote,
  OrderRefundRecord,
} from '../types/order';
import { CartSummary, CartItem } from '../types/cart';

const ORDERS_STORAGE_KEY = 'mahdev_orders_v1';

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Island-Wide Courier',
    cost: 5.0,
    estimatedDelivery: '2-4 Business Days',
    description: 'Secure tracked domestic delivery across all 9 provinces in Sri Lanka.',
  },
  {
    id: 'express',
    name: 'Same-Day Express Metro (Colombo & Suburbs)',
    cost: 12.0,
    estimatedDelivery: 'Same Day (Within 6 Hours)',
    description: 'Priority courier with live GPS dispatch dispatching from Mahdev Central Hub.',
  },
  {
    id: 'freight',
    name: 'DHL / FedEx International Air Courier',
    cost: 38.0,
    estimatedDelivery: '3-6 Business Days Worldwide',
    description: 'Phytosanitary certified export shipping with customs clearance documents.',
  },
  {
    id: 'digital_instant',
    name: 'Instant Digital / Electronic Delivery',
    cost: 0.0,
    estimatedDelivery: 'Instant Automated Access',
    description: 'Instant credential and software license delivery to registered email address.',
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ORD-2026-8941',
    customer: {
      fullName: 'Dr. Ruwan Wickremasinghe',
      email: 'ruwan.w@colombomed.lk',
      phone: '+94 77 982 1144',
      company: 'Apex Healthcare Lanka',
      preferredContact: 'email',
    },
    items: [
      {
        id: 'ceylon-silver-tips-reserve_st-100g',
        productId: 'ceylon-silver-tips-reserve',
        sku: 'MD-TEA-ST01-100G',
        name: 'Royal Ceylon Silver Tips Reserve Tea',
        slug: 'royal-ceylon-silver-tips-reserve',
        divisionId: 'mart',
        divisionName: 'Mahdev Online Mart',
        productType: 'physical',
        selectedVariant: {
          id: 'st-100g',
          name: '100g Collector Tin',
          sku: 'MD-TEA-ST01-100G',
          priceModifier: 32,
          weight: '100g',
        },
        unitPrice: 74.0,
        originalPrice: 90.0,
        quantity: 2,
        lineTotal: 148.0,
        discountAmount: 32.0,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      },
      {
        id: 'ceylon-alba-cinnamon-quills_standard',
        productId: 'ceylon-alba-cinnamon-quills',
        sku: 'MD-SPC-ALBA01',
        name: 'Organic Ceylon Alba Grade Cinnamon Quills',
        slug: 'organic-ceylon-alba-cinnamon-quills',
        divisionId: 'mart',
        divisionName: 'Mahdev Online Mart',
        productType: 'physical',
        unitPrice: 28.5,
        originalPrice: 34.0,
        quantity: 1,
        lineTotal: 28.5,
        discountAmount: 5.5,
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
      },
    ],
    totalQuantity: 3,
    subtotal: 176.5,
    productDiscounts: 37.5,
    couponDiscount: 17.65,
    appliedCouponCode: 'MAHDEV2026',
    shippingFee: 5.0,
    tax: 0,
    total: 163.85,
    currency: 'USD',
    status: 'processing',
    paymentStatus: 'paid',
    paymentMethod: 'credit_card',
    transactionId: 'TXN-STRIPE-89104812',
    paymentGatewayReady: true,
    deliveryInfo: {
      methodId: 'standard',
      methodName: 'Standard Island-Wide Courier',
      cost: 5.0,
      estimatedDelivery: '2-4 Business Days',
      address: {
        street: '42 Gregory Road',
        apartment: 'Suite 8B',
        city: 'Colombo',
        state: 'Western Province',
        postalCode: '00700',
        country: 'Sri Lanka',
      },
      specialInstructions: 'Please leave with concierge if office is closed after 5pm.',
    },
    customerNotes: 'Please ensure luxury gift boxing is included.',
    adminNotesList: [
      {
        id: 'NOTE-1',
        author: 'Fulfillment Lead Dilshan',
        note: 'High-grade tea inventory verified batch #2026-A. Dispatching with Cert of Authenticity.',
        createdAt: '2026-08-16T10:00:00.000Z',
      },
    ],
    trackingNumber: 'LK-EXP-9920182',
    carrier: 'Certis Lanka Logistics',
    createdAt: '2026-08-16T09:30:00.000Z',
    updatedAt: '2026-08-16T10:00:00.000Z',
  },
  {
    id: 'ORD-2026-7219',
    customer: {
      fullName: 'Ayesha De Silva',
      email: 'ayesha.desilva@innovate.sg',
      phone: '+65 9123 4567',
      company: 'Nexis Media Asia',
      preferredContact: 'whatsapp',
    },
    items: [
      {
        id: 'enterprise-cloud-saas-core_standard',
        productId: 'enterprise-cloud-saas-core',
        sku: 'MD-IT-CLOUD01',
        name: 'Mahdev Enterprise Cloud Architecture Framework',
        slug: 'enterprise-cloud-saas-core',
        divisionId: 'it',
        divisionName: 'Mahdev IT & Solutions',
        productType: 'digital',
        unitPrice: 499.0,
        originalPrice: 650.0,
        quantity: 1,
        lineTotal: 499.0,
        discountAmount: 151.0,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      },
    ],
    totalQuantity: 1,
    subtotal: 499.0,
    productDiscounts: 151.0,
    couponDiscount: 49.9,
    appliedCouponCode: 'MAHDEV2026',
    shippingFee: 0,
    tax: 0,
    total: 449.1,
    currency: 'USD',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'stripe',
    transactionId: 'pi_3MtwL2LkdIwHu7ix28A00v1z',
    paymentGatewayReady: true,
    deliveryInfo: {
      methodId: 'digital_instant',
      methodName: 'Instant Digital / Electronic Delivery',
      cost: 0,
      estimatedDelivery: 'Instant Automated Access',
    },
    createdAt: '2026-08-14T14:15:00.000Z',
    updatedAt: '2026-08-14T14:20:00.000Z',
  },
  {
    id: 'ORD-2026-6104',
    customer: {
      fullName: 'Vikram Singhania',
      email: 'vikram.s@singhania.in',
      phone: '+91 9820 112233',
      company: 'Singhania Luxury Group',
      preferredContact: 'phone',
    },
    items: [
      {
        id: 'u1-red-v-raptor-8k-package',
        productId: 'u1-red-v-raptor-8k',
        sku: 'MD-U1-CAM01',
        name: 'RED V-Raptor 8K VV Cinema Package',
        slug: 'red-v-raptor-8k-cinema-package',
        divisionId: 'u1',
        divisionName: 'U1 Studio',
        productType: 'physical',
        unitPrice: 1250.0,
        originalPrice: 1400.0,
        quantity: 1,
        lineTotal: 1250.0,
        discountAmount: 150.0,
        imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
      },
    ],
    totalQuantity: 1,
    subtotal: 1250.0,
    productDiscounts: 150.0,
    couponDiscount: 0,
    shippingFee: 38.0,
    tax: 0,
    total: 1288.0,
    currency: 'USD',
    status: 'dispatched',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    transactionId: 'WT-HNB-9912048',
    paymentGatewayReady: true,
    deliveryInfo: {
      methodId: 'freight',
      methodName: 'DHL International Air Courier',
      cost: 38.0,
      estimatedDelivery: '3-6 Business Days Worldwide',
      address: {
        street: '14 Marine Drive',
        apartment: 'Penthouse 12',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
        country: 'India',
      },
    },
    trackingNumber: 'DHL-EXP-44910284',
    carrier: 'DHL Express International',
    createdAt: '2026-08-12T08:10:00.000Z',
    updatedAt: '2026-08-13T16:40:00.000Z',
  },
  {
    id: 'ORD-2026-5530',
    customer: {
      fullName: 'Tanya Perera',
      email: 'tanya.p@gmail.com',
      phone: '+94 71 884 9922',
      preferredContact: 'phone',
    },
    items: [
      {
        id: 'kandy-spices-culinary-box',
        productId: 'kandy-spices-culinary-box',
        sku: 'MD-SPC-BOX01',
        name: 'Kandy Spice Valley Master Culinary Hamper',
        slug: 'kandy-spices-culinary-box',
        divisionId: 'mart',
        divisionName: 'Mahdev Online Mart',
        productType: 'physical',
        unitPrice: 65.0,
        originalPrice: 75.0,
        quantity: 1,
        lineTotal: 65.0,
        discountAmount: 10.0,
        imageUrl: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=800&q=80',
      },
    ],
    totalQuantity: 1,
    subtotal: 65.0,
    productDiscounts: 10.0,
    couponDiscount: 0,
    shippingFee: 5.0,
    tax: 0,
    total: 70.0,
    currency: 'USD',
    status: 'cancelled',
    paymentStatus: 'refunded',
    paymentMethod: 'credit_card',
    transactionId: 'TXN-REFUNDED-33910',
    paymentGatewayReady: true,
    refunds: [
      {
        id: 'REF-2026-001',
        amount: 70.0,
        reason: 'Customer requested cancellation prior to dispatch (duplicate order).',
        processedAt: '2026-08-11T11:20:00.000Z',
        processedBy: 'Finance Lead Anuki',
        restocked: true,
      },
    ],
    adminNotesList: [
      {
        id: 'NOTE-R1',
        author: 'Finance Lead Anuki',
        note: 'Processed full card refund $70.00 back to original card ending in 4109.',
        createdAt: '2026-08-11T11:20:00.000Z',
      },
    ],
    createdAt: '2026-08-11T09:00:00.000Z',
    updatedAt: '2026-08-11T11:20:00.000Z',
  },
];

class OrderService {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadOrders();
  }

  private loadOrders(): void {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        this.orders = JSON.parse(stored);
      } else {
        this.orders = [...SEED_ORDERS];
        this.saveOrders();
      }
    } catch {
      this.orders = [...SEED_ORDERS];
    }
  }

  private saveOrders(): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      this.notify();
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  public generateOrderId(): string {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${year}-${randomDigits}`;
  }

  public createOrder(
    input: CreateOrderInput,
    cartSummary: CartSummary
  ): Order {
    const orderId = this.generateOrderId();
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = cartSummary.items.map((item) => ({
      id: `${item.id}_${Date.now()}`,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      slug: item.slug,
      divisionId: item.divisionId,
      divisionName: item.divisionName,
      productType: item.productType,
      selectedVariant: item.selectedVariant,
      unitPrice: item.unitPrice,
      originalPrice: item.originalPrice,
      discountPercent: item.discountPercent,
      quantity: item.quantity,
      lineTotal: item.itemTotal,
      discountAmount: item.itemDiscount,
      imageUrl: item.imageUrl,
      bookingDetails: item.bookingDetails,
    }));

    const newOrder: Order = {
      id: orderId,
      customer: input.customer,
      items: orderItems,
      totalQuantity: cartSummary.totalQuantity,
      subtotal: cartSummary.subtotal,
      productDiscounts: cartSummary.productDiscountTotal,
      couponDiscount: cartSummary.couponDiscountTotal,
      appliedCouponCode: input.appliedCouponCode || cartSummary.appliedCoupon?.code,
      shippingFee: input.deliveryInfo?.cost !== undefined ? input.deliveryInfo.cost : cartSummary.shippingFee,
      tax: cartSummary.tax,
      total: Math.max(
        0,
        cartSummary.subtotal -
          cartSummary.couponDiscountTotal +
          (input.deliveryInfo?.cost !== undefined ? input.deliveryInfo.cost : cartSummary.shippingFee) +
          cartSummary.tax
      ),
      currency: 'USD',
      status: 'pending_payment',
      paymentStatus: 'payment_pending',
      paymentMethod: input.paymentMethod || 'credit_card',
      transactionId: input.transactionId || `TXN-${Date.now()}`,
      paymentGatewayReady: true,
      deliveryInfo: input.deliveryInfo,
      bookingInfo: input.bookingInfo,
      customerNotes: input.customerNotes,
      adminNotesList: [],
      refunds: [],
      createdAt: now,
      updatedAt: now,
    };

    this.orders.unshift(newOrder);
    this.saveOrders();

    return newOrder;
  }

  public getOrderById(id: string): Order | null {
    const cleanId = id.trim().toUpperCase();
    return this.orders.find((o) => o.id.toUpperCase() === cleanId) || null;
  }

  public getOrdersByEmail(email: string): Order[] {
    const cleanEmail = email.trim().toLowerCase();
    return this.orders.filter((o) => o.customer.email.toLowerCase() === cleanEmail);
  }

  public getAllOrders(): Order[] {
    return [...this.orders];
  }

  public updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentStatus?: OrderPaymentStatus
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      status,
      paymentStatus: paymentStatus || this.orders[index].paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    this.saveOrders();
    return this.orders[index];
  }

  public updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: OrderPaymentStatus
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    this.saveOrders();
    return this.orders[index];
  }

  public addAdminNote(
    orderId: string,
    author: string,
    note: string,
    isCustomerVisible: boolean = false
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const newNote: OrderAdminNote = {
      id: `NOTE-${Date.now()}`,
      author,
      note,
      createdAt: new Date().toISOString(),
      isCustomerVisible,
    };

    const currentNotes = this.orders[index].adminNotesList || [];
    this.orders[index] = {
      ...this.orders[index],
      adminNotesList: [newNote, ...currentNotes],
      updatedAt: new Date().toISOString(),
    };

    this.saveOrders();
    return this.orders[index];
  }

  public processRefund(
    orderId: string,
    amount: number,
    reason: string,
    restocked: boolean,
    author: string
  ): { success: boolean; order?: Order; error?: string } {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return { success: false, error: 'Order not found.' };

    const order = this.orders[index];
    const totalRefundedSoFar = (order.refunds || []).reduce((sum, r) => sum + r.amount, 0);
    const maxRefundable = order.total - totalRefundedSoFar;

    if (amount <= 0 || amount > maxRefundable + 0.01) {
      return { success: false, error: `Refund amount must be between $0.01 and $${maxRefundable.toFixed(2)}.` };
    }

    const refundRecord: OrderRefundRecord = {
      id: `REF-${Date.now().toString().slice(-6)}`,
      amount,
      reason,
      processedAt: new Date().toISOString(),
      processedBy: author || 'Operations Admin',
      restocked,
    };

    const updatedRefunds = [refundRecord, ...(order.refunds || [])];
    const isFullyRefunded = (totalRefundedSoFar + amount) >= (order.total - 0.01);

    this.orders[index] = {
      ...order,
      paymentStatus: isFullyRefunded ? 'refunded' : order.paymentStatus,
      status: isFullyRefunded ? 'cancelled' : order.status,
      refunds: updatedRefunds,
      adminNotesList: [
        {
          id: `NOTE-${Date.now()}`,
          author: author || 'Finance Lead',
          note: `Processed ${isFullyRefunded ? 'Full' : 'Partial'} refund of $${amount.toFixed(2)}: ${reason}`,
          createdAt: new Date().toISOString(),
        },
        ...(order.adminNotesList || []),
      ],
      updatedAt: new Date().toISOString(),
    };

    this.saveOrders();
    return { success: true, order: this.orders[index] };
  }

  public updateTracking(
    orderId: string,
    trackingNumber: string,
    carrier: string
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      trackingNumber,
      carrier,
      status: 'dispatched',
      updatedAt: new Date().toISOString(),
    };

    this.saveOrders();
    return this.orders[index];
  }

  public validateCheckout(
    customer: CustomerOrderDetails,
    deliveryInfo?: OrderDeliveryInfo,
    bookingInfo?: OrderBookingInfo,
    requiresShipping: boolean = false,
    requiresBooking: boolean = false
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!customer.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (customer.fullName.trim().length < 3) {
      errors.fullName = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(customer.email.trim())) {
      errors.email = 'Please provide a valid corporate or personal email';
    }

    const phoneRegex = /^[+]?[\d\s-]{7,15}$/;
    if (!customer.phone.trim()) {
      errors.phone = 'Contact phone number is required';
    } else if (!phoneRegex.test(customer.phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Please provide a valid phone number (e.g. +94 77 123 4567)';
    }

    if (requiresShipping) {
      if (!deliveryInfo?.address?.street.trim()) {
        errors.street = 'Street delivery address is required';
      }
      if (!deliveryInfo?.address?.city.trim()) {
        errors.city = 'Destination city is required';
      }
      if (!deliveryInfo?.address?.postalCode.trim()) {
        errors.postalCode = 'Postal code / ZIP is required';
      }
      if (!deliveryInfo?.address?.country.trim()) {
        errors.country = 'Destination country is required';
      }
    }

    if (requiresBooking) {
      if (!bookingInfo?.preferredDate) {
        errors.preferredDate = 'Please select a preferred service or event date';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export const orderService = new OrderService();
