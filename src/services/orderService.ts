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
import { notificationService } from './notificationService';
import { db, sanitizeForFirestore } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestoreOrdersService } from './firestore/orders';

const ORDERS_STORAGE_KEY = 'mahdev_orders_v1';

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Standard Island-Wide Courier',
    cost: 650.0,
    estimatedDelivery: '2-4 Business Days',
    description: 'Secure tracked domestic delivery across all 9 provinces in Sri Lanka.',
  },
  {
    id: 'express',
    name: 'Same-Day Express Metro (Colombo & Suburbs)',
    cost: 1200.0,
    estimatedDelivery: 'Same Day (Within 6 Hours)',
    description: 'Priority courier with live GPS dispatch dispatching from Mahdev Central Hub.',
  },
  {
    id: 'freight',
    name: 'DHL / FedEx International Air Courier',
    cost: 8500.0,
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

class OrderService {
  private orders: Order[] = [];
  private listeners: Set<() => void> = new Set();
  private syncInFlight: Set<string> = new Set();

  constructor() {
    this.loadOrders();
    this.initFirestoreSync();
  }

  private initFirestoreSync(): void {
    try {
      firestoreOrdersService.subscribeAllOrders((firestoreOrders) => {
        if (!Array.isArray(firestoreOrders)) return;
        
        // Map Firestore orders to local Order model
        const mappedOrders: Order[] = firestoreOrders.map((fo: any) => {
          return {
            id: fo.id,
            customer: fo.customer || {
              fullName: fo.customerName || 'Customer',
              email: fo.customerEmail || '',
              phone: fo.customerPhone || '',
              preferredContact: 'email',
            },
            items: Array.isArray(fo.items) ? fo.items : [],
            totalQuantity: fo.totalQuantity || (Array.isArray(fo.items) ? fo.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1),
            subtotal: fo.subtotal || fo.total || 0,
            productDiscounts: fo.productDiscounts || 0,
            couponDiscount: fo.couponDiscount || 0,
            appliedCouponCode: fo.appliedCouponCode,
            shippingFee: fo.shippingFee || 0,
            tax: fo.tax || 0,
            total: fo.total || 0,
            currency: fo.currency || 'USD',
            status: fo.status || fo.orderStatus || 'pending_payment',
            paymentStatus: fo.paymentStatus || 'payment_pending',
            paymentMethod: fo.paymentMethod || 'credit_card',
            transactionId: fo.transactionId,
            paymentGatewayReady: fo.paymentGatewayReady ?? true,
            deliveryInfo: fo.deliveryInfo,
            bookingInfo: fo.bookingInfo,
            customerNotes: fo.customerNotes,
            adminNotesList: fo.adminNotesList || [],
            refunds: fo.refunds || [],
            trackingNumber: fo.trackingNumber,
            carrier: fo.carrier,
            createdAt: fo.createdAt || new Date().toISOString(),
            updatedAt: fo.updatedAt || new Date().toISOString(),
          };
        });

        // Merge Firestore orders with existing orders, giving precedence to Firestore
        const orderMap = new Map<string, Order>();
        for (const local of this.orders) {
          orderMap.set(local.id, local);
        }
        for (const remote of mappedOrders) {
          orderMap.set(remote.id, remote);
        }

        const merged = Array.from(orderMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        this.orders = merged;
        this.saveOrders();
      });
    } catch (e) {
      console.warn('[OrderService] Firestore sync initialization error:', e);
    }
  }

  private loadOrders(): void {
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Permanently purge any hardcoded test or demo orders (never delete legitimate customer orders like ORD-2026-6104)
          const testOrderIds = new Set(['ORD-2026-8941', 'ORD-2026-7219', 'ORD-2026-5530']);
          const testEmails = ['colombomed.lk', 'singhania.in', 'ceylondigital.lk', 'kandytech.lk', 'innovate.sg', 'example.com'];
          const genuine = parsed.filter((o: any) => {
            if (!o || !o.id) return false;
            if (testOrderIds.has(o.id)) return false;
            if (typeof o.id === 'string' && (o.id.startsWith('TEST-') || o.id.startsWith('FAKE-') || o.id.startsWith('DEMO-'))) return false;
            const email = (o.customer?.email || '').toLowerCase();
            if (testEmails.some((domain) => email.includes(domain))) return false;
            return true;
          });
          this.orders = genuine;
          if (genuine.length !== parsed.length) {
            this.saveOrders();
          }
        } else {
          this.orders = [];
        }
      } else {
        this.orders = [];
      }
    } catch {
      this.orders = [];
    }
  }

  private saveOrders(): void {
    try {
      // Strip massive base64 images to prevent localStorage QuotaExceededError
      const safeOrders = this.orders.map((order) => ({
        ...order,
        items: (order.items || []).map((item) => ({
          ...item,
          imageUrl: item.imageUrl && item.imageUrl.startsWith('data:') ? '' : item.imageUrl,
        })),
      }));
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(safeOrders));
    } catch (e) {
      console.warn('[OrderService] Could not cache orders to localStorage (memory retained):', e);
    } finally {
      this.notify();
    }
  }

  public syncOrderToFirestore(order: Order): void {
    if (!order || !order.id) return;
    if (this.syncInFlight.has(order.id)) return;
    this.syncInFlight.add(order.id);

    try {
      const docRef = doc(db, 'orders', order.id);
      setDoc(
        docRef,
        sanitizeForFirestore({
          ...order,
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          updatedAt: order.updatedAt || new Date().toISOString(),
        }),
        { merge: true }
      )
        .catch((err) => {
          console.warn('[OrderService] Firestore order sync error:', err);
        })
        .finally(() => {
          setTimeout(() => {
            this.syncInFlight.delete(order.id);
          }, 1500);
        });
    } catch (e) {
      this.syncInFlight.delete(order.id);
      console.warn('[OrderService] Firestore order sync catch:', e);
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

    // Persist to Cloud Firestore orders collection
    try {
      const docRef = doc(db, 'orders', newOrder.id);
      setDoc(docRef, sanitizeForFirestore({
        ...newOrder,
        id: newOrder.id,
        items: newOrder.items,
        total: newOrder.total,
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod,
        currency: newOrder.currency,
        customer: newOrder.customer,
        deliveryInfo: newOrder.deliveryInfo,
        bookingInfo: newOrder.bookingInfo,
        createdAt: newOrder.createdAt,
        updatedAt: newOrder.updatedAt,
      }), { merge: true }).catch((err) => console.warn('[Firestore] Order write error:', err));
    } catch (e) {
      console.warn('[Firestore] Order sync error:', e);
    }

    // Trigger non-blocking customer confirmation email and admin alert
    notificationService.notifyOrderConfirmation(newOrder).catch(() => {});
    notificationService.notifyAdminNewOrder(newOrder).catch(() => {});

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
    this.syncOrderToFirestore(this.orders[index]);
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
    this.syncOrderToFirestore(this.orders[index]);
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
    this.syncOrderToFirestore(this.orders[index]);
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
    this.syncOrderToFirestore(this.orders[index]);
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
    this.syncOrderToFirestore(this.orders[index]);
    return this.orders[index];
  }

  public async deleteOrder(orderId: string): Promise<boolean> {
    const cleanId = orderId.trim();
    const index = this.orders.findIndex((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    if (index !== -1) {
      this.orders.splice(index, 1);
      this.saveOrders();
    }
    // Also remove from Firestore collection
    try {
      await deleteDoc(doc(db, 'orders', cleanId));
    } catch (err) {
      console.warn(`[OrderService] Firestore order delete error for ${cleanId}:`, err);
    }
    return true;
  }

  public async clearAllTestOrders(): Promise<{ removedCount: number }> {
    const initialCount = this.orders.length;
    const testOrderIds = new Set(['ORD-2026-8941', 'ORD-2026-7219', 'ORD-2026-5530']);
    const testEmails = ['colombomed.lk', 'singhania.in', 'ceylondigital.lk', 'kandytech.lk', 'innovate.sg', 'example.com'];

    const genuine = this.orders.filter((o) => {
      if (testOrderIds.has(o.id)) return false;
      if (typeof o.id === 'string' && (o.id.startsWith('TEST-') || o.id.startsWith('FAKE-') || o.id.startsWith('DEMO-'))) return false;
      const email = (o.customer?.email || '').toLowerCase();
      if (testEmails.some((domain) => email.includes(domain))) return false;
      return true;
    });

    const removed = this.orders.filter((o) => !genuine.includes(o));
    for (const o of removed) {
      try {
        await deleteDoc(doc(db, 'orders', o.id));
      } catch {}
    }

    this.orders = genuine;
    this.saveOrders();
    return { removedCount: initialCount - genuine.length };
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
      errors.phone = 'Please provide a valid phone number (e.g. 075 092 8078)';
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
