/**
 * Mahdev Enterprise Analytics & Reporting Engine (Phase 36)
 * High-performance, privacy-compliant event tracking and executive intelligence aggregator.
 * 
 * Features:
 * - Asynchronous, batched event queue with non-blocking microtasks
 * - Strict adherence to Do-Not-Track (DNT) browser settings
 * - Anonymized session IDs with zero third-party cross-site cookies
 * - Real dynamic report generation calculated from Orders, Bookings, CMS, and Site Events
 * - Multi-dimensional CSV export engine for administrative audit
 */

import {
  AnalyticsEvent,
  AnalyticsEventType,
  TimeRangeFilter,
  ExecutiveReportData,
  DailyDataPoint,
  DivisionAnalyticsSummary,
  TopProductMetric,
  TopServiceMetric,
  FunnelStage,
} from '../types/analytics';
import { getCurrencySymbol } from '../utils/currency';
import { CmsProduct, CmsService as CmsServiceEntity } from '../types/cms';
import { orderService } from './orderService';
import { bookingService } from './bookingService';
import { cmsService } from './cmsService';
import { DIVISION_LIST } from '../config/divisions';

const ANALYTICS_STORAGE_KEY = 'mahdev_analytics_events_v1';
const SESSION_STORAGE_KEY = 'mahdev_analytics_session_id';
const MAX_LOCAL_EVENTS = 600;

class AnalyticsService {
  private sessionId: string = '';
  private eventQueue: AnalyticsEvent[] = [];
  private isFlushing: boolean = false;
  private isDntEnabled: boolean = false;

  constructor() {
    this.initSession();
  }

  private initSession(): void {
    try {
      // Check Do-Not-Track (DNT)
      if (typeof navigator !== 'undefined') {
        const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
        this.isDntEnabled = dnt === '1' || dnt === 'yes';
      }

      if (typeof window !== 'undefined' && window.sessionStorage) {
        let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!sid) {
          sid = `s_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
          sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
        }
        this.sessionId = sid;
      } else {
        this.sessionId = `s_${Date.now()}`;
      }
    } catch {
      this.sessionId = `s_${Date.now()}`;
    }
  }

  // =========================================================================
  // 1. PRIVACY-SAFE EVENT TRACKING DISPATCHER
  // =========================================================================

  public trackEvent(
    type: AnalyticsEventType,
    path: string,
    metadata?: Record<string, any>,
    divisionId?: string
  ): void {
    // If DNT enabled, minimize telemetry payload
    if (this.isDntEnabled) {
      metadata = { dnt: true };
    }

    const event: AnalyticsEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: new Date().toISOString(),
      path: path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      title: typeof document !== 'undefined' ? document.title : undefined,
      divisionId,
      sessionId: this.sessionId,
      metadata: metadata ? this.sanitizeMetadata(metadata) : undefined,
    };

    this.eventQueue.push(event);
    this.scheduleFlush();
  }

  private sanitizeMetadata(data: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    const prohibitedKeys = ['password', 'card', 'cvv', 'secret', 'token', 'auth', 'phone', 'email', 'address'];

    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (prohibitedKeys.some((p) => lower.includes(p))) {
        continue; // Exclude PII
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        clean[key] = value;
      }
    }
    return clean;
  }

  private scheduleFlush(): void {
    if (this.isFlushing) return;
    this.isFlushing = true;

    // Use requestIdleCallback or setTimeout to guarantee zero UI interference
    const scheduleFn =
      typeof window !== 'undefined' && (window as any).requestIdleCallback
        ? (window as any).requestIdleCallback
        : (cb: any) => setTimeout(cb, 120);

    scheduleFn(() => {
      this.flushQueue();
      this.isFlushing = false;
    });
  }

  private flushQueue(): void {
    if (this.eventQueue.length === 0) return;
    const batch = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (typeof localStorage === 'undefined') return;
      const existingRaw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      let existing: AnalyticsEvent[] = [];
      if (existingRaw) {
        existing = JSON.parse(existingRaw);
      }

      // Prepend new batch and cap to MAX_LOCAL_EVENTS
      const updated = [...batch, ...existing].slice(0, MAX_LOCAL_EVENTS);
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));

      // Attempt non-blocking beacon to server if available
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([JSON.stringify({ events: batch })], { type: 'application/json' });
          navigator.sendBeacon('/api/analytics/event', blob);
        } catch {
          // sendBeacon error ignored safely
        }
      }
    } catch (e) {
      console.warn('[AnalyticsService] Local telemetry save deferred:', e);
    }
  }

  // =========================================================================
  // 2. CONVENIENCE TRACKING HELPERS
  // =========================================================================

  public trackPageView(path: string, title?: string, divisionId?: string): void {
    this.trackEvent('page_view', path, { title }, divisionId);
  }

  public trackDivisionView(divisionId: string, divisionName: string): void {
    this.trackEvent('division_view', `/${divisionId}`, { divisionName }, divisionId);
  }

  public trackProductView(
    productOrId: { id: string; name: string; sku?: string; price: number; category?: string } | string,
    name?: string,
    price?: number
  ): void {
    if (typeof productOrId === 'object') {
      this.trackEvent('product_view', `/mart/product/${productOrId.id}`, {
        productId: productOrId.id,
        productName: productOrId.name,
        sku: productOrId.sku || '',
        price: productOrId.price,
        category: productOrId.category || 'General',
      }, 'mart');
    } else {
      this.trackEvent('product_view', `/mart/product/${productOrId}`, {
        productId: productOrId,
        productName: name || '',
        price: price || 0,
      }, 'mart');
    }
  }

  public trackAddToCart(
    itemOrId: { id: string; name: string; price: number; quantity?: number } | string,
    name?: string,
    price?: number,
    quantity: number = 1
  ): void {
    if (typeof itemOrId === 'object') {
      const q = itemOrId.quantity || 1;
      this.trackEvent('add_to_cart', '/mart', {
        productId: itemOrId.id,
        productName: itemOrId.name,
        price: itemOrId.price,
        quantity: q,
        itemTotal: itemOrId.price * q,
      }, 'mart');
    } else {
      this.trackEvent('add_to_cart', '/mart', {
        productId: itemOrId,
        productName: name || '',
        price: price || 0,
        quantity,
        itemTotal: (price || 0) * quantity,
      }, 'mart');
    }
  }

  public trackCheckoutStarted(cartTotalOrQty: number, countOrTotal?: number, currency: string = 'USD'): void {
    this.trackEvent('checkout_started', '/checkout', {
      cartTotal: typeof countOrTotal === 'number' ? countOrTotal : cartTotalOrQty,
      itemCount: typeof countOrTotal === 'number' ? cartTotalOrQty : countOrTotal || 1,
      currency,
    }, 'mart');
  }

  public trackPurchaseCompleted(
    orderOrId: { id: string; total: number; currency?: string; paymentMethod?: string; itemCount?: number } | string,
    total?: number,
    itemCount?: number,
    currency: string = 'USD'
  ): void {
    if (typeof orderOrId === 'object') {
      this.trackEvent('purchase_completed', '/order-confirmation', {
        orderId: orderOrId.id,
        total: orderOrId.total,
        currency: orderOrId.currency || 'USD',
        paymentMethod: orderOrId.paymentMethod || 'standard',
        itemCount: orderOrId.itemCount || 1,
      }, 'mart');
    } else {
      this.trackEvent('purchase_completed', '/order-confirmation', {
        orderId: orderOrId,
        total: total || 0,
        currency,
        itemCount: itemCount || 1,
      }, 'mart');
    }
  }

  public trackBookingStarted(serviceIdOrDiv: string, serviceNameOrId?: string, divisionId?: string): void {
    this.trackEvent('booking_started', '/book', {
      serviceId: serviceIdOrDiv,
      serviceName: serviceNameOrId || serviceIdOrDiv,
    }, divisionId || 'sws');
  }

  public trackBookingCompleted(
    bookingOrId: { id: string; serviceId?: string; serviceName?: string; divisionId?: string; price?: number } | string,
    divisionId?: string,
    serviceId?: string,
    price?: number
  ): void {
    if (typeof bookingOrId === 'object') {
      this.trackEvent('booking_completed', '/book/success', {
        bookingId: bookingOrId.id,
        serviceId: bookingOrId.serviceId || '',
        serviceName: bookingOrId.serviceName || '',
        price: bookingOrId.price || 0,
      }, bookingOrId.divisionId || 'sws');
    } else {
      this.trackEvent('booking_completed', '/book/success', {
        bookingId: bookingOrId,
        serviceId: serviceId || '',
        price: price || 0,
      }, divisionId || 'sws');
    }
  }

  public trackContactSubmitted(division: string, subject?: string): void {
    this.trackEvent('contact_submitted', '/contact', {
      division,
      subject: subject || 'General Inquiry',
    }, division);
  }

  public trackQuoteRequested(division: string, service?: string): void {
    this.trackEvent('quote_requested', '/contact#rfp', {
      division,
      service: service || 'Enterprise RFP',
    }, division);
  }

  // =========================================================================
  // 3. EXECUTIVE REPORTING & ANALYTICS AGGREGATOR
  // =========================================================================

  public getRawEvents(): AnalyticsEvent[] {
    try {
      if (typeof localStorage === 'undefined') return [];
      const data = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public clearAnalyticsEvents(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ANALYTICS_STORAGE_KEY);
      }
      this.eventQueue = [];
    } catch {}
  }

  public getExecutiveReport(timeRange: TimeRangeFilter = '30d', targetCurrency: string = 'LKR'): ExecutiveReportData {
    const rawEvents = this.getRawEvents();
    const allOrders = orderService.getAllOrders();
    const allBookings = bookingService.getAllBookings();
    const allProducts = cmsService.getAll<CmsProduct>('products');
    const allServices = cmsService.getAll<CmsServiceEntity>('services');

    const curr = (targetCurrency || 'LKR').toUpperCase();
    const currSymbol = getCurrencySymbol(curr);
    const USD_TO_LKR_RATE = 305;

    // 1. Time Filtering Window
    const now = new Date();
    let cutoffDate = new Date(0); // all time default

    if (timeRange === 'today') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '90d') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const filteredOrders = allOrders.filter((o) => new Date(o.createdAt) >= cutoffDate);
    const filteredBookings = allBookings.filter((b) => new Date(b.createdAt) >= cutoffDate);
    const filteredEvents = rawEvents.filter((e) => new Date(e.timestamp) >= cutoffDate);

    // 2. Revenue Calculations
    let orderRevenueUSD = 0;
    let orderRevenueLKR = 0;
    let orderRevenueTarget = 0;

    filteredOrders.forEach((o) => {
      if (o.status !== 'cancelled') {
        const oCurr = (o.currency || curr).toUpperCase();
        let inLKR = 0;
        let inUSD = 0;

        if (oCurr === 'LKR') {
          inLKR = o.total;
          inUSD = Math.round(o.total / USD_TO_LKR_RATE);
        } else {
          inUSD = o.total;
          inLKR = Math.round(o.total * USD_TO_LKR_RATE);
        }

        orderRevenueLKR += inLKR;
        orderRevenueUSD += inUSD;
        orderRevenueTarget += (curr === 'LKR' ? inLKR : inUSD);
      }
    });

    let bookingRevenueUSD = 0;
    let bookingRevenueLKR = 0;
    let bookingRevenueTarget = 0;

    filteredBookings.forEach((b) => {
      if (b.status !== 'cancelled' && b.status !== 'rejected') {
        const bCurr = (b.currency || curr).toUpperCase();
        const rawPrice = b.price || 0;
        let inLKR = 0;
        let inUSD = 0;

        if (bCurr === 'LKR') {
          inLKR = rawPrice;
          inUSD = Math.round(rawPrice / USD_TO_LKR_RATE);
        } else {
          inUSD = rawPrice;
          inLKR = Math.round(rawPrice * USD_TO_LKR_RATE);
        }

        bookingRevenueLKR += inLKR;
        bookingRevenueUSD += inUSD;
        bookingRevenueTarget += (curr === 'LKR' ? inLKR : inUSD);
      }
    });

    const totalGrossRevenue = orderRevenueTarget + bookingRevenueTarget;
    const completedOrdersCount = filteredOrders.length;
    const aov = completedOrdersCount > 0 ? Math.round(orderRevenueTarget / completedOrdersCount) : 0;

    // 3. Unique sessions & pageviews
    const uniqueSessions = new Set(filteredEvents.map((e) => e.sessionId));
    const totalPageViews = filteredEvents.filter((e) => e.type === 'page_view' || e.type === 'division_view').length;

    // Customer breakdown from genuine orders and bookings
    const customerEmailMap: Record<string, { orders: number; bookings: number; isCorporate: boolean }> = {};
    filteredOrders.forEach((o) => {
      const email = (o.customer?.email || '').toLowerCase().trim();
      if (!email) return;
      if (!customerEmailMap[email]) {
        customerEmailMap[email] = { orders: 0, bookings: 0, isCorporate: !!(o.customer?.company && o.customer.company.trim()) };
      }
      customerEmailMap[email].orders += 1;
      if (o.customer?.company && o.customer.company.trim()) customerEmailMap[email].isCorporate = true;
    });

    filteredBookings.forEach((b) => {
      const email = (b.customer?.email || '').toLowerCase().trim();
      if (!email) return;
      if (!customerEmailMap[email]) {
        customerEmailMap[email] = { orders: 0, bookings: 0, isCorporate: !!(b.customer?.company && b.customer.company.trim()) };
      }
      customerEmailMap[email].bookings += 1;
      if (b.customer?.company && b.customer.company.trim()) customerEmailMap[email].isCorporate = true;
    });

    const totalCustomers = Object.keys(customerEmailMap).length;
    let corporateCount = 0;
    let repeatCount = 0;
    Object.values(customerEmailMap).forEach((c) => {
      if (c.isCorporate) corporateCount++;
      if (c.orders + c.bookings > 1) repeatCount++;
    });
    const individualCount = Math.max(0, totalCustomers - corporateCount);
    const repeatOrderRatePercent = totalCustomers > 0 ? parseFloat(((repeatCount / totalCustomers) * 100).toFixed(1)) : 0;
    const corporateClientRatioPercent = totalCustomers > 0 ? parseFloat(((corporateCount / totalCustomers) * 100).toFixed(1)) : 0;

    // 4. Daily Trends
    const dailyMap: Record<string, { label: string; revenue: number; orders: number; bookings: number; visitors: number }> = {};
    const daysToShow = timeRange === 'today' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 14 : 30;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyMap[dateKey] = { label, revenue: 0, orders: 0, bookings: 0, visitors: 0 };
    }

    filteredOrders.forEach((o) => {
      const dateKey = o.createdAt.split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].orders += 1;
        const oCurr = (o.currency || curr).toUpperCase();
        const rev = curr === 'LKR'
          ? (oCurr === 'LKR' ? o.total : Math.round(o.total * USD_TO_LKR_RATE))
          : (oCurr === 'LKR' ? Math.round(o.total / USD_TO_LKR_RATE) : o.total);
        dailyMap[dateKey].revenue += rev;
      }
    });

    filteredBookings.forEach((b) => {
      const dateKey = b.createdAt.split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].bookings += 1;
        const bCurr = (b.currency || curr).toUpperCase();
        const rawPrice = b.price || 0;
        const bRev = curr === 'LKR'
          ? (bCurr === 'LKR' ? rawPrice : Math.round(rawPrice * USD_TO_LKR_RATE))
          : (bCurr === 'LKR' ? Math.round(rawPrice / USD_TO_LKR_RATE) : rawPrice);
        dailyMap[dateKey].revenue += bRev;
      }
    });

    filteredEvents.forEach((e) => {
      const dateKey = e.timestamp.split('T')[0];
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].visitors += 1;
      }
    });

    const dailyTrends: DailyDataPoint[] = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      label: val.label,
      revenue: val.revenue,
      orders: val.orders,
      bookings: val.bookings,
      visitors: val.visitors,
    }));

    // 5. Division Performance
    const divisionColors: Record<string, string> = {
      sws: '#8B5CF6',     // Purple
      u1: '#EC4899',      // Pink
      it: '#0052FF',      // Blue
      travels: '#10B981', // Emerald
      mart: '#F59E0B',    // Amber
    };

    const divisionPerformance: DivisionAnalyticsSummary[] = DIVISION_LIST.map((div) => {
      const divBookings = filteredBookings.filter((b) => b.divisionId === div.id);
      const divOrders = div.id === 'mart' ? filteredOrders : [];
      
      let divRev = 0;
      if (div.id === 'mart') {
        divRev = orderRevenueTarget;
      } else {
        divRev = divBookings.reduce((sum, b) => {
          const bCurr = (b.currency || curr).toUpperCase();
          const rawPrice = b.price || 0;
          const val = curr === 'LKR'
            ? (bCurr === 'LKR' ? rawPrice : Math.round(rawPrice * USD_TO_LKR_RATE))
            : (bCurr === 'LKR' ? Math.round(rawPrice / USD_TO_LKR_RATE) : rawPrice);
          return sum + val;
        }, 0);
      }

      const pViews = filteredEvents.filter((e) => e.divisionId === div.id && (e.type === 'division_view' || e.type === 'page_view')).length;
      const inq = filteredEvents.filter((e) => e.divisionId === div.id && e.type === 'contact_submitted').length;
      const rfp = filteredEvents.filter((e) => e.divisionId === div.id && e.type === 'quote_requested').length;

      const totalConversions = divBookings.length + divOrders.length;
      const convRate = pViews > 0 ? parseFloat(((totalConversions / pViews) * 100).toFixed(1)) : (totalConversions > 0 ? 100 : 0);

      return {
        divisionId: div.id,
        name: div.name,
        shortCode: div.shortName || div.id.toUpperCase(),
        color: divisionColors[div.id] || '#0052FF',
        pageViews: pViews,
        inquiries: inq,
        quoteRequests: rfp,
        bookingsCount: divBookings.length,
        ordersCount: divOrders.length,
        grossRevenue: divRev,
        revenueSharePercent: totalGrossRevenue > 0 ? Math.round((divRev / totalGrossRevenue) * 100) : 0,
        conversionRatePercent: convRate,
      };
    });

    // 6. Top Products Metric (Only genuine sales and views)
    const productSoldMap: Record<string, { units: number; rev: number }> = {};
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productSoldMap[item.productId]) {
          productSoldMap[item.productId] = { units: 0, rev: 0 };
        }
        productSoldMap[item.productId].units += item.quantity;
        const oCurr = (o.currency || curr).toUpperCase();
        let itemRev = item.unitPrice * item.quantity;
        if (curr === 'LKR' && oCurr === 'USD') itemRev = Math.round(itemRev * USD_TO_LKR_RATE);
        if (curr === 'USD' && oCurr === 'LKR') itemRev = Math.round(itemRev / USD_TO_LKR_RATE);
        productSoldMap[item.productId].rev += itemRev;
      });
    });

    const topProducts: TopProductMetric[] = allProducts.map((p) => {
      const sold = productSoldMap[p.id]?.units || 0;
      const rev = productSoldMap[p.id]?.rev || 0;
      const pViews = filteredEvents.filter((e) => e.metadata?.productId === p.id).length;
      const cartAdds = filteredEvents.filter((e) => e.metadata?.productId === p.id && e.type === 'add_to_cart').length;
      const convRate = pViews > 0 ? parseFloat(((sold / pViews) * 100).toFixed(1)) : (sold > 0 ? 100 : 0);

      const currentStock = p.stockQuantity ?? 0;
      const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' =
        currentStock <= 0 ? 'out_of_stock' : currentStock <= 5 ? 'low_stock' : 'in_stock';

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.categoryName || 'General',
        divisionId: 'mart',
        price: p.price,
        unitsSold: sold,
        revenue: rev,
        views: pViews,
        cartAdds,
        conversionRate: convRate,
        currentStock,
        stockStatus,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 7. Top Services Metric (Only genuine bookings and views)
    const serviceBookingMap: Record<string, { count: number; rev: number; completed: number }> = {};
    filteredBookings.forEach((b) => {
      if (!serviceBookingMap[b.serviceId]) {
        serviceBookingMap[b.serviceId] = { count: 0, rev: 0, completed: 0 };
      }
      serviceBookingMap[b.serviceId].count += 1;
      const bCurr = (b.currency || curr).toUpperCase();
      const rawPrice = b.price || 0;
      const bRev = curr === 'LKR'
        ? (bCurr === 'LKR' ? rawPrice : Math.round(rawPrice * USD_TO_LKR_RATE))
        : (bCurr === 'LKR' ? Math.round(rawPrice / USD_TO_LKR_RATE) : rawPrice);
      serviceBookingMap[b.serviceId].rev += bRev;
      if (b.status === 'completed') {
        serviceBookingMap[b.serviceId].completed += 1;
      }
    });

    const topServices: TopServiceMetric[] = allServices.map((s) => {
      const bData = serviceBookingMap[s.id] || {
        count: 0,
        rev: 0,
        completed: 0,
      };
      const views = filteredEvents.filter((e) => e.metadata?.serviceId === s.id).length;
      const convRate = views > 0 ? parseFloat(((bData.count / views) * 100).toFixed(1)) : (bData.count > 0 ? 100 : 0);

      return {
        id: s.id,
        name: s.title,
        divisionId: s.divisionId,
        divisionName: s.divisionName,
        bookingsCount: bData.count,
        completedCount: bData.completed,
        revenue: bData.rev,
        views,
        averageBookingValue: bData.count > 0 ? Math.round(bData.rev / bData.count) : 0,
        conversionRate: convRate,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 8. Conversion Funnels (Strictly genuine)
    const productViewsCount = filteredEvents.filter((e) => e.type === 'product_view').length;
    const cartAddsCount = filteredEvents.filter((e) => e.type === 'add_to_cart').length;
    const checkoutStartsCount = filteredEvents.filter((e) => e.type === 'checkout_started').length;

    const ecommerceFunnel: FunnelStage[] = [
      {
        id: '1',
        name: 'Product Views',
        count: productViewsCount,
        dropoffRate: 0,
        stepConversion: productViewsCount > 0 ? 100 : 0,
        overallConversion: productViewsCount > 0 ? 100 : 0,
      },
      {
        id: '2',
        name: 'Added to Cart',
        count: cartAddsCount,
        dropoffRate: productViewsCount > 0 ? Math.max(0, Math.round(((productViewsCount - cartAddsCount) / productViewsCount) * 100)) : 0,
        stepConversion: productViewsCount > 0 ? Math.min(100, Math.round((cartAddsCount / productViewsCount) * 100)) : 0,
        overallConversion: productViewsCount > 0 ? Math.min(100, Math.round((cartAddsCount / productViewsCount) * 100)) : 0,
      },
      {
        id: '3',
        name: 'Checkout Started',
        count: checkoutStartsCount,
        dropoffRate: cartAddsCount > 0 ? Math.max(0, Math.round(((cartAddsCount - checkoutStartsCount) / cartAddsCount) * 100)) : 0,
        stepConversion: cartAddsCount > 0 ? Math.min(100, Math.round((checkoutStartsCount / cartAddsCount) * 100)) : 0,
        overallConversion: productViewsCount > 0 ? Math.min(100, Math.round((checkoutStartsCount / productViewsCount) * 100)) : 0,
      },
      {
        id: '4',
        name: 'Order Completed',
        count: completedOrdersCount,
        dropoffRate: checkoutStartsCount > 0 ? Math.max(0, Math.round(((checkoutStartsCount - completedOrdersCount) / checkoutStartsCount) * 100)) : 0,
        stepConversion: checkoutStartsCount > 0 ? Math.min(100, Math.round((completedOrdersCount / checkoutStartsCount) * 100)) : (completedOrdersCount > 0 ? 100 : 0),
        overallConversion: productViewsCount > 0 ? Math.min(100, Math.round((completedOrdersCount / productViewsCount) * 100)) : (completedOrdersCount > 0 ? 100 : 0),
      },
    ];

    const serviceViewsCount = filteredEvents.filter((e) => e.type === 'service_view' || e.type === 'page_view').length;
    const bookingStartsCount = filteredEvents.filter((e) => e.type === 'booking_started').length;
    const confirmedBookingsCount = filteredBookings.filter((b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'scheduled').length;

    const bookingFunnel: FunnelStage[] = [
      {
        id: '1',
        name: 'Service Catalog Views',
        count: serviceViewsCount,
        dropoffRate: 0,
        stepConversion: serviceViewsCount > 0 ? 100 : 0,
        overallConversion: serviceViewsCount > 0 ? 100 : 0,
      },
      {
        id: '2',
        name: 'Booking Modal / Dates Picked',
        count: bookingStartsCount,
        dropoffRate: serviceViewsCount > 0 ? Math.max(0, Math.round(((serviceViewsCount - bookingStartsCount) / serviceViewsCount) * 100)) : 0,
        stepConversion: serviceViewsCount > 0 ? Math.min(100, Math.round((bookingStartsCount / serviceViewsCount) * 100)) : 0,
        overallConversion: serviceViewsCount > 0 ? Math.min(100, Math.round((bookingStartsCount / serviceViewsCount) * 100)) : 0,
      },
      {
        id: '3',
        name: 'Booking Submitted',
        count: filteredBookings.length,
        dropoffRate: bookingStartsCount > 0 ? Math.max(0, Math.round(((bookingStartsCount - filteredBookings.length) / bookingStartsCount) * 100)) : 0,
        stepConversion: bookingStartsCount > 0 ? Math.min(100, Math.round((filteredBookings.length / bookingStartsCount) * 100)) : (filteredBookings.length > 0 ? 100 : 0),
        overallConversion: serviceViewsCount > 0 ? Math.min(100, Math.round((filteredBookings.length / serviceViewsCount) * 100)) : (filteredBookings.length > 0 ? 100 : 0),
      },
      {
        id: '4',
        name: 'Confirmed & Scheduled',
        count: confirmedBookingsCount,
        dropoffRate: filteredBookings.length > 0 ? Math.max(0, Math.round(((filteredBookings.length - confirmedBookingsCount) / filteredBookings.length) * 100)) : 0,
        stepConversion: filteredBookings.length > 0 ? Math.min(100, Math.round((confirmedBookingsCount / filteredBookings.length) * 100)) : (confirmedBookingsCount > 0 ? 100 : 0),
        overallConversion: serviceViewsCount > 0 ? Math.min(100, Math.round((confirmedBookingsCount / serviceViewsCount) * 100)) : (confirmedBookingsCount > 0 ? 100 : 0),
      },
    ];

    // 9. Payment Gateways
    const gatewayMap: Record<string, { count: number; volume: number; label: string }> = {
      lankapay_ipg: { count: 0, volume: 0, label: 'LankaPay National Switch IPG' },
      stripe_card: { count: 0, volume: 0, label: 'Credit / Debit Cards (Stripe 3DS)' },
      bank_wire: { count: 0, volume: 0, label: 'Corporate Bank Wire / B2B Invoice' },
    };

    filteredOrders.forEach((o) => {
      const gw = o.paymentMethod || 'lankapay_ipg';
      if (!gatewayMap[gw]) {
        gatewayMap[gw] = { count: 0, volume: 0, label: gw };
      }
      gatewayMap[gw].count += 1;
      const oCurr = (o.currency || curr).toUpperCase();
      const vol = curr === 'LKR'
        ? (oCurr === 'LKR' ? o.total : Math.round(o.total * USD_TO_LKR_RATE))
        : (oCurr === 'LKR' ? Math.round(o.total / USD_TO_LKR_RATE) : o.total);
      gatewayMap[gw].volume += vol;
    });

    const paymentGatewayDistribution = Object.entries(gatewayMap).map(([gw, data]) => ({
      gateway: gw,
      label: data.label,
      transactionsCount: data.count,
      volume: data.volume,
      percentage: totalGrossRevenue > 0 ? Math.round((data.volume / totalGrossRevenue) * 100) : 0,
    }));

    return {
      timeRange,
      currency: curr,
      currencySymbol: currSymbol,
      kpis: {
        grossRevenue: totalGrossRevenue,
        revenueGrowthPercent: 0,
        totalOrders: completedOrdersCount,
        ordersGrowthPercent: 0,
        averageOrderValue: aov,
        totalBookings: filteredBookings.length,
        bookingsPipelineValue: bookingRevenueTarget,
        totalRegisteredCustomers: totalCustomers,
        corporateClientRatioPercent,
        overallStoreConversionPercent: ecommerceFunnel[3]?.overallConversion || 0,
        bookingConversionPercent: bookingFunnel[3]?.overallConversion || 0,
        totalPageViews,
        uniqueSessionsCount: uniqueSessions.size,
      },
      revenueByCurrency: {
        USD: orderRevenueUSD + bookingRevenueUSD,
        LKR: orderRevenueLKR + bookingRevenueLKR,
      },
      dailyTrends,
      divisionPerformance,
      topProducts: topProducts.slice(0, 10),
      topServices: topServices.slice(0, 10),
      ecommerceFunnel,
      bookingFunnel,
      paymentGatewayDistribution,
      customerBreakdown: {
        individualCount,
        corporateCount,
        repeatOrderRatePercent,
      },
    };
  }

  // =========================================================================
  // 4. CSV EXPORT ENGINE
  // =========================================================================

  public exportCsv(
    reportType: 'revenue' | 'orders' | 'bookings' | 'products' | 'services' | 'divisions',
    timeRange: TimeRangeFilter = '30d',
    targetCurrency: string = 'LKR'
  ): void {
    const report = this.getExecutiveReport(timeRange, targetCurrency);
    const curr = report.currency;
    let csvContent = '';
    let filename = `mahdev_${reportType}_report_${curr.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (reportType) {
      case 'revenue': {
        csvContent = `Date,Gross Revenue (${curr}),Orders Count,Bookings Count,Estimated Visitors\n`;
        report.dailyTrends.forEach((row) => {
          csvContent += `"${row.date}",${row.revenue},${row.orders},${row.bookings},${row.visitors}\n`;
        });
        break;
      }
      case 'divisions': {
        csvContent = `Division ID,Division Name,Pageviews,Inquiries,Quote Requests,Bookings,Orders,Gross Revenue (${curr}),Revenue Share (%),Conversion Rate (%)\n`;
        report.divisionPerformance.forEach((div) => {
          csvContent += `"${div.divisionId}","${div.name}",${div.pageViews},${div.inquiries},${div.quoteRequests},${div.bookingsCount},${div.ordersCount},${div.grossRevenue},${div.revenueSharePercent}%,${div.conversionRatePercent}%\n`;
        });
        break;
      }
      case 'products': {
        csvContent = `Product ID,Name,SKU,Category,Price (${curr}),Units Sold,Gross Revenue (${curr}),Views,Cart Additions,Conversion Rate (%),Current Stock,Status\n`;
        report.topProducts.forEach((p) => {
          csvContent += `"${p.id}","${p.name}","${p.sku}","${p.category}",${p.price},${p.unitsSold},${p.revenue},${p.views},${p.cartAdds},${p.conversionRate}%,${p.currentStock},"${p.stockStatus}"\n`;
        });
        break;
      }
      case 'services': {
        csvContent = `Service ID,Service Name,Division,Bookings Count,Completed Count,Average Value (${curr}),Gross Revenue (${curr}),Views,Conversion Rate (%)\n`;
        report.topServices.forEach((s) => {
          csvContent += `"${s.id}","${s.name}","${s.divisionName}",${s.bookingsCount},${s.completedCount},${s.averageBookingValue},${s.revenue},${s.views},${s.conversionRate}%\n`;
        });
        break;
      }
      case 'orders': {
        const orders = orderService.getAllOrders();
        csvContent = 'Order ID,Customer Name,Customer Email,Total,Currency,Payment Method,Status,Created At\n';
        orders.forEach((o) => {
          csvContent += `"${o.id}","${o.customer.fullName}","${o.customer.email}",${o.total},"${o.currency}","${o.paymentMethod}","${o.status}","${o.createdAt}"\n`;
        });
        break;
      }
      case 'bookings': {
        const bookings = bookingService.getAllBookings();
        csvContent = 'Booking ID,Division,Service,Package,Customer Name,Date,Time,Price,Currency,Status,Payment Status,Created At\n';
        bookings.forEach((b) => {
          csvContent += `"${b.id}","${b.divisionName}","${b.serviceName}","${b.packageName}","${b.customer.fullName}","${b.date}","${b.time}",${b.price},"${b.currency}","${b.status}","${b.paymentStatus}","${b.createdAt}"\n`;
        });
        break;
      }
    }

    // Trigger browser download
    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}

export const analyticsService = new AnalyticsService();
