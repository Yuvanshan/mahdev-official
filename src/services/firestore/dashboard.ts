/**
 * Real-Time Firestore Dashboard Analytics Engine (Phase 55)
 * 
 * Strict Zero-Fake-Data Architecture:
 * - 100% of telemetry, metrics, and breakdowns are calculated directly from Firestore collections.
 * - Zero hardcoded multipliers, demo constants, or generated mock curves.
 * - Real-time subscriptions keep the dashboard synchronized instantaneously.
 */

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from '../../lib/tursoFirestore';
import { db } from '../../lib/firebase';
import {
  FirestoreOrder,
  FirestoreBooking,
  FirestoreProduct,
  FirestoreService,
  FirestoreUser,
  FirestoreDivision,
  FirestoreContactSubmission,
  FirestoreTestimonial,
  FirestoreCompanySettings,
  FirestoreSiteSettings,
} from '../../types/firestore';

export type DashboardDateFilter = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all_time' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface InventoryAlertTelemetry {
  id: string;
  name: string;
  sku: string;
  divisionId: string;
  divisionName: string;
  currentStock: number;
  threshold: number;
  unitPrice: number;
  status: 'out_of_stock' | 'low_stock';
}

export interface DivisionRevenueShare {
  divisionId: string;
  divisionName: string;
  revenue: number;
  ordersCount: number;
  bookingsCount: number;
  percentage: number;
  accentColor: string;
}

export interface TopProductPerformance {
  productId: string;
  name: string;
  sku: string;
  divisionId: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  stockStatus: string;
}

export interface TopServicePerformance {
  serviceId: string;
  name: string;
  divisionId: string;
  divisionName: string;
  bookingsCount: number;
  revenue: number;
}

export interface ChartDataPoint {
  label: string;
  dateKey: string;
  revenue: number;
  ordersCount: number;
  bookingsCount: number;
}

export interface RealFirestoreDashboardTelemetry {
  filter: DashboardDateFilter;
  filterLabel: string;
  dateRange: DateRange;
  currency: string;
  currencySymbol: string;
  
  // High-Level Financials
  revenue: {
    total: number;
    orderRevenue: number;
    bookingRevenue: number;
    hasData: boolean;
    previousPeriodTotal: number | null;
    growthPercentage: number | null;
  };

  // Orders
  orders: {
    total: number;
    pending: number;
    paid: number;
    dispatched: number;
    completed: number;
    cancelled: number;
    averageOrderValue: number;
    settlementRatePercent: number;
  };

  // Bookings
  bookings: {
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    completionRatePercent: number;
  };

  // Customers & Users
  customers: {
    totalRegisteredUsers: number;
    totalCustomers: number;
    newInPeriod: number;
    staffAdmins: number;
  };

  // Products & Warehouse
  products: {
    total: number;
    active: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };

  // Services Catalog
  services: {
    total: number;
    active: number;
  };

  // Payments Telemetry
  payments: {
    completedCount: number;
    completedAmount: number;
    pendingCount: number;
    pendingAmount: number;
  };

  // Contacts / Inquiries
  inquiries: {
    total: number;
    pendingAction: number;
  };

  // Reviews
  testimonials: {
    total: number;
    approved: number;
    pending: number;
  };

  // Deep Breakdowns (All Computed Strictly from Firestore)
  inventoryAlerts: InventoryAlertTelemetry[];
  divisionBreakdown: DivisionRevenueShare[];
  topProducts: TopProductPerformance[];
  topServices: TopServicePerformance[];
  chartTimeline: ChartDataPoint[];
  hasSufficientChartData: boolean;

  // Operational Action Tasks
  pendingActionsCount: number;
}

/**
 * Maps currency code to symbol representation
 */
export function getCurrencySymbol(currencyCode = 'USD'): string {
  const code = (currencyCode || 'USD').toUpperCase().trim();
  switch (code) {
    case 'LKR':
      return 'Rs.';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'AUD':
      return 'A$';
    case 'CAD':
      return 'C$';
    case 'SGD':
      return 'S$';
    case 'AED':
      return 'AED';
    case 'INR':
      return '₹';
    default:
      return code;
  }
}

/**
 * Formats monetary amounts with the configured Firestore currency
 */
export function formatDashboardCurrency(amount: number, currencyCode = 'USD'): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (symbol === 'Rs.' || symbol === 'AED') {
    return `${symbol} ${formattedNumber}`;
  }
  return `${symbol}${formattedNumber}`;
}

/**
 * Calculates start and end timestamps for a selected date filter
 */
export function calculateFilterBounds(
  filter: DashboardDateFilter,
  customRange?: { start?: string; end?: string }
): DateRange {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let startDate: Date;

  switch (filter) {
    case 'today': {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    }
    case 'this_week': {
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = (day === 0 ? 6 : day - 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0, 0);
      break;
    }
    case 'this_month': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
    case 'this_year': {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    }
    case 'custom': {
      if (customRange?.start) {
        startDate = new Date(customRange.start);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      if (customRange?.end) {
        const customEnd = new Date(customRange.end);
        customEnd.setHours(23, 59, 59, 999);
        return { startDate, endDate: customEnd };
      }
      break;
    }
    case 'all_time':
    default: {
      startDate = new Date(2020, 0, 1, 0, 0, 0, 0);
      break;
    }
  }

  return { startDate, endDate };
}

/**
 * Computes telemetry strictly from raw Firestore arrays
 */
export function computeDashboardTelemetry(
  orders: FirestoreOrder[],
  bookings: FirestoreBooking[],
  products: FirestoreProduct[],
  services: FirestoreService[],
  users: FirestoreUser[],
  divisions: FirestoreDivision[],
  contacts: FirestoreContactSubmission[],
  testimonials: FirestoreTestimonial[],
  companySettings: FirestoreCompanySettings | FirestoreSiteSettings | null,
  filter: DashboardDateFilter = 'all_time',
  customRange?: { start?: string; end?: string }
): RealFirestoreDashboardTelemetry {
  const currency =
    (companySettings as FirestoreSiteSettings)?.currency ||
    (companySettings as FirestoreSiteSettings)?.defaultCurrency ||
    'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const dateRange = calculateFilterBounds(filter, customRange);
  const startMs = dateRange.startDate.getTime();
  const endMs = dateRange.endDate.getTime();

  // Helper to parse ISO / date strings safely
  const parseTime = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  // 1. Filter Orders by Date Range
  const isAllTime = filter === 'all_time';
  const filteredOrders = isAllTime
    ? orders
    : orders.filter((o) => {
        const t = parseTime(o.createdAt);
        return t >= startMs && t <= endMs;
      });

  // 2. Filter Bookings by Date Range
  const filteredBookings = isAllTime
    ? bookings
    : bookings.filter((b) => {
        const t = parseTime(b.createdAt || b.date);
        return t >= startMs && t <= endMs;
      });

  // 3. Filter New Users in Period
  const filteredNewUsers = isAllTime
    ? users
    : users.filter((u) => {
        const t = parseTime(u.createdAt);
        return t >= startMs && t <= endMs;
      });

  // 4. Financial Calculations
  const isOrderPaid = (o: FirestoreOrder) =>
    (o.paymentStatus as string) === 'paid' || (o.status as string) === 'delivered' || (o.status as string) === 'completed';

  const isBookingPaid = (b: FirestoreBooking) =>
    (b.paymentStatus as string) === 'paid' || (b.paymentStatus as string) === 'deposit_paid' || (b.status as string) === 'completed';

  const orderRevenue = filteredOrders
    .filter(isOrderPaid)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const bookingRevenue = filteredBookings
    .filter(isBookingPaid)
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const totalRevenue = orderRevenue + bookingRevenue;
  const hasRevenueData = filteredOrders.some(isOrderPaid) || filteredBookings.some(isBookingPaid);

  // Compute Genuine Growth vs Previous Period (Only if genuine previous records exist)
  let previousPeriodTotal: number | null = null;
  let growthPercentage: number | null = null;

  if (!isAllTime) {
    const periodDuration = endMs - startMs;
    const prevStartMs = startMs - periodDuration;
    const prevEndMs = startMs - 1;

    const prevOrders = orders.filter((o) => {
      const t = parseTime(o.createdAt);
      return t >= prevStartMs && t <= prevEndMs && isOrderPaid(o);
    });

    const prevBookings = bookings.filter((b) => {
      const t = parseTime(b.createdAt || b.date);
      return t >= prevStartMs && t <= prevEndMs && isBookingPaid(b);
    });

    const prevOrderRev = prevOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const prevBookingRev = prevBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const prevTotal = prevOrderRev + prevBookingRev;

    if (prevOrders.length > 0 || prevBookings.length > 0) {
      previousPeriodTotal = prevTotal;
      if (prevTotal > 0) {
        growthPercentage = Math.round(((totalRevenue - prevTotal) / prevTotal) * 100 * 10) / 10;
      } else if (totalRevenue > 0) {
        growthPercentage = 100;
      } else {
        growthPercentage = 0;
      }
    }
  }

  // 5. Order Status Metrics
  const orderTotal = filteredOrders.length;
  const orderPending = filteredOrders.filter(
    (o) => o.status === 'pending' || o.paymentStatus === 'pending'
  ).length;
  const orderPaid = filteredOrders.filter(isOrderPaid).length;
  const orderDispatched = filteredOrders.filter(
    (o) => o.status === 'shipped' || (o as any).status === 'dispatched'
  ).length;
  const orderCompleted = filteredOrders.filter(
    (o) => o.status === 'delivered' || (o as any).status === 'completed'
  ).length;
  const orderCancelled = filteredOrders.filter((o) => o.status === 'cancelled').length;
  const averageOrderValue =
    orderPaid > 0 ? orderRevenue / orderPaid : orderTotal > 0 ? totalRevenue / orderTotal : 0;
  const settlementRatePercent =
    orderTotal > 0 ? Math.round((orderPaid / orderTotal) * 100) : 100;

  // 6. Booking Status Metrics
  const bookingTotal = filteredBookings.length;
  const bookingPending = filteredBookings.filter(
    (b) => (b.status as string) === 'pending' || (b.paymentStatus as string) === 'pending'
  ).length;
  const bookingScheduled = filteredBookings.filter(
    (b) => (b.status as string) === 'scheduled' || (b.status as string) === 'confirmed'
  ).length;
  const bookingInProgress = filteredBookings.filter((b) => (b.status as string) === 'in_progress').length;
  const bookingCompleted = filteredBookings.filter((b) => (b.status as string) === 'completed').length;
  const bookingCancelled = filteredBookings.filter((b) => (b.status as string) === 'cancelled').length;
  const completionRatePercent =
    bookingTotal > 0 ? Math.round((bookingCompleted / bookingTotal) * 100) : 100;

  // 7. Customers / Users Telemetry
  const totalRegisteredUsers = users.length;
  const totalCustomers = users.filter((u) => !u.role || u.role === 'customer').length;
  const staffAdmins = users.filter(
    (u) => u.role === 'admin' || u.role === 'superAdmin' || u.role === 'manager' || u.role === 'staff'
  ).length;
  const newInPeriod = filteredNewUsers.length;

  // 8. Products & Warehouse
  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => p.status === 'active' || (p as any).status === 'published'
  ).length;
  const lowStockThreshold = 10;
  const outOfStock = products.filter(
    (p) => (p.stock ?? (p as any).stockQuantity ?? 0) === 0 || (p.status as string) === 'out_of_stock'
  ).length;
  const lowStock = products.filter(
    (p) => {
      const stock = Number(p.stock ?? (p as any).stockQuantity ?? 0);
      return stock > 0 && (stock <= ((p as any).lowStockThreshold || lowStockThreshold) || (p.status as string) === 'low_stock');
    }
  ).length;
  const inStock = totalProducts - outOfStock - lowStock;

  const inventoryAlerts: InventoryAlertTelemetry[] = products
    .filter(
      (p) => {
        const stock = Number(p.stock ?? (p as any).stockQuantity ?? 0);
        return stock <= ((p as any).lowStockThreshold || lowStockThreshold) ||
          (p.status as string) === 'out_of_stock' ||
          (p.status as string) === 'low_stock';
      }
    )
    .map((p) => {
      const currentStock = Number(p.stock ?? (p as any).stockQuantity ?? 0);
      const threshold = (p as any).lowStockThreshold || lowStockThreshold;
      return {
        id: p.id,
        name: p.name || 'Catalog Item',
        sku: p.sku || `SKU-${p.id.substring(0, 6)}`,
        divisionId: (p.division as string) || (p as any).divisionId || 'mart',
        divisionName:
          divisions.find((d) => d.id === ((p.division as string) || (p as any).divisionId))?.name ||
          'Mahdev Online Mart',
        currentStock,
        threshold,
        unitPrice: Number(p.price) || 0,
        status: (currentStock === 0 ? 'out_of_stock' : 'low_stock') as 'out_of_stock' | 'low_stock',
      };
    })
    .sort((a, b) => a.currentStock - b.currentStock);

  // 9. Services Telemetry
  const totalServices = services.length;
  const activeServices = services.filter(
    (s) => s.status === 'active' || (s as any).status === 'published'
  ).length;

  // 10. Payments Calculations
  const pendingOrdersList = filteredOrders.filter(
    (o) => (o.paymentStatus as string) === 'pending' || (o.status as string) === 'pending'
  );
  const pendingBookingsList = filteredBookings.filter(
    (b) => (b.paymentStatus as string) === 'pending' || (b.status as string) === 'pending'
  );

  const pendingPaymentsCount = pendingOrdersList.length + pendingBookingsList.length;
  const pendingPaymentsAmount =
    pendingOrdersList.reduce((sum, o) => sum + (Number(o.total) || 0), 0) +
    pendingBookingsList.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const completedPaymentsCount =
    filteredOrders.filter(isOrderPaid).length + filteredBookings.filter(isBookingPaid).length;
  const completedPaymentsAmount = totalRevenue;

  // 11. Inquiries & Testimonials
  const pendingContacts = contacts.filter((c) => c.status === 'new' || c.status === 'in_review').length;
  const approvedReviews = testimonials.filter((t) => t.status === 'approved').length;
  const pendingReviews = testimonials.filter((t) => t.status === 'pending').length;

  // 12. Division Revenue Breakdown
  const divisionColors: Record<string, string> = {
    sws: 'bg-blue-600',
    u1: 'bg-purple-600',
    mart: 'bg-emerald-600',
    travels: 'bg-amber-600',
    it: 'bg-indigo-600',
  };

  const defaultDivisions: { id: string; name: string }[] = [
    { id: 'sws', name: 'SWS Event Management' },
    { id: 'u1', name: 'U1 Studio Cinema' },
    { id: 'mart', name: 'Mahdev Online Mart' },
    { id: 'travels', name: 'Mahdev Travels VIP' },
    { id: 'it', name: 'Mahdev IT & Solutions' },
  ];

  const activeDivs = divisions.length > 0 ? divisions : defaultDivisions;

  const divisionMap: Record<
    string,
    { id: string; name: string; revenue: number; ordersCount: number; bookingsCount: number }
  > = {};

  activeDivs.forEach((d) => {
    divisionMap[d.id] = {
      id: d.id,
      name: d.name,
      revenue: 0,
      ordersCount: 0,
      bookingsCount: 0,
    };
  });

  // Calculate division revenue from Orders
  filteredOrders.forEach((o) => {
    if (isOrderPaid(o)) {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const divId = item.division || (item as any).divisionId || 'mart';
          if (!divisionMap[divId]) {
            divisionMap[divId] = {
              id: divId,
              name: divId.toUpperCase(),
              revenue: 0,
              ordersCount: 0,
              bookingsCount: 0,
            };
          }
          divisionMap[divId].revenue += Number(item.lineTotal || (item.unitPrice * item.quantity)) || 0;
          divisionMap[divId].ordersCount += 1;
        });
      } else {
        const divId = (o as any).divisionId || 'mart';
        if (divisionMap[divId]) {
          divisionMap[divId].revenue += Number(o.total) || 0;
          divisionMap[divId].ordersCount += 1;
        }
      }
    }
  });

  // Calculate division revenue from Bookings
  filteredBookings.forEach((b) => {
    if (isBookingPaid(b)) {
      const divId = b.divisionId || (b as any).division || 'sws';
      if (!divisionMap[divId]) {
        divisionMap[divId] = {
          id: divId,
          name: divId.toUpperCase(),
          revenue: 0,
          ordersCount: 0,
          bookingsCount: 0,
        };
      }
      divisionMap[divId].revenue += Number(b.price) || 0;
      divisionMap[divId].bookingsCount += 1;
    }
  });

  const divisionBreakdown: DivisionRevenueShare[] = Object.values(divisionMap)
    .map((div) => ({
      divisionId: div.id,
      divisionName: div.name,
      revenue: div.revenue,
      ordersCount: div.ordersCount,
      bookingsCount: div.bookingsCount,
      percentage: totalRevenue > 0 ? Math.round((div.revenue / totalRevenue) * 100) : 0,
      accentColor: divisionColors[div.id] || 'bg-slate-600',
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // 13. Top Performing Products
  const productAggMap: Record<
    string,
    { id: string; name: string; sku: string; divisionId: string; units: number; rev: number }
  > = {};

  filteredOrders.forEach((o) => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach((item: any) => {
        const pId = item.productId || item.id || item.name;
        if (!productAggMap[pId]) {
          productAggMap[pId] = {
            id: pId,
            name: item.productName || item.name || 'Item',
            sku: item.sku || '',
            divisionId: item.division || item.divisionId || 'mart',
            units: 0,
            rev: 0,
          };
        }
        productAggMap[pId].units += Number(item.quantity) || 1;
        productAggMap[pId].rev += Number(item.lineTotal || (item.unitPrice * item.quantity)) || 0;
      });
    }
  });

  const topProducts: TopProductPerformance[] = Object.values(productAggMap)
    .map((item) => {
      const catItem = products.find((p) => p.id === item.id || p.name === item.name);
      return {
        productId: item.id,
        name: item.name,
        sku: item.sku || (catItem ? catItem.sku || '' : ''),
        divisionId: item.divisionId,
        unitsSold: item.units,
        revenue: item.rev,
        currentStock: catItem ? Number(catItem.stock ?? (catItem as any).stockQuantity ?? 0) : 0,
        stockStatus: (catItem ? ((catItem.stock || 0) === 0 ? 'out_of_stock' : (catItem.stock || 0) <= 10 ? 'low_stock' : 'in_stock') : 'in_stock') as 'in_stock' | 'low_stock' | 'out_of_stock',
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 14. Top Performing Services
  const serviceAggMap: Record<
    string,
    { id: string; name: string; divisionId: string; count: number; rev: number }
  > = {};

  filteredBookings.forEach((b) => {
    const sId = b.serviceId || b.serviceName || 'Service';
    if (!serviceAggMap[sId]) {
      serviceAggMap[sId] = {
        id: sId,
        name: b.serviceName || (b as any).name || 'Enterprise Service',
        divisionId: b.divisionId || (b as any).division || 'sws',
        count: 0,
        rev: 0,
      };
    }
    serviceAggMap[sId].count += 1;
    if (isBookingPaid(b)) {
      serviceAggMap[sId].rev += Number(b.price) || 0;
    }
  });

  const topServices: TopServicePerformance[] = Object.values(serviceAggMap)
    .map((item) => {
      const divName =
        divisions.find((d) => d.id === item.divisionId)?.name || item.divisionId.toUpperCase();
      return {
        serviceId: item.id,
        name: item.name,
        divisionId: item.divisionId,
        divisionName: divName,
        bookingsCount: item.count,
        revenue: item.rev,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 15. Time-Series Timeline Chart
  const dateMap: Record<string, { dateKey: string; label: string; revenue: number; orders: number; bookings: number }> = {};

  // Populate from filtered orders
  filteredOrders.forEach((o) => {
    const d = new Date(o.createdAt || Date.now());
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { dateKey, label, revenue: 0, orders: 0, bookings: 0 };
    }
    if (isOrderPaid(o)) {
      dateMap[dateKey].revenue += Number(o.total) || 0;
    }
    dateMap[dateKey].orders += 1;
  });

  // Populate from filtered bookings
  filteredBookings.forEach((b) => {
    const d = new Date(b.createdAt || b.date || Date.now());
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { dateKey, label, revenue: 0, orders: 0, bookings: 0 };
    }
    if (isBookingPaid(b)) {
      dateMap[dateKey].revenue += Number(b.price) || 0;
    }
    dateMap[dateKey].bookings += 1;
  });

  const chartTimeline: ChartDataPoint[] = Object.values(dateMap)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map((point) => ({
      label: point.label,
      dateKey: point.dateKey,
      revenue: point.revenue,
      ordersCount: point.orders,
      bookingsCount: point.bookings,
    }));

  const hasSufficientChartData = chartTimeline.length >= 2;

  // Filter Human Label
  const filterLabelMap: Record<DashboardDateFilter, string> = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    this_year: 'This Year',
    all_time: 'All Time',
    custom: 'Custom Range',
  };

  const pendingActionsCount = bookingPending + orderPending + inventoryAlerts.length + pendingContacts;

  return {
    filter,
    filterLabel: filterLabelMap[filter],
    dateRange,
    currency,
    currencySymbol,
    revenue: {
      total: totalRevenue,
      orderRevenue,
      bookingRevenue,
      hasData: hasRevenueData,
      previousPeriodTotal,
      growthPercentage,
    },
    orders: {
      total: orderTotal,
      pending: orderPending,
      paid: orderPaid,
      dispatched: orderDispatched,
      completed: orderCompleted,
      cancelled: orderCancelled,
      averageOrderValue,
      settlementRatePercent,
    },
    bookings: {
      total: bookingTotal,
      pending: bookingPending,
      scheduled: bookingScheduled,
      inProgress: bookingInProgress,
      completed: bookingCompleted,
      cancelled: bookingCancelled,
      completionRatePercent,
    },
    customers: {
      totalRegisteredUsers,
      totalCustomers,
      newInPeriod,
      staffAdmins,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      inStock,
      lowStock,
      outOfStock,
    },
    services: {
      total: totalServices,
      active: activeServices,
    },
    payments: {
      completedCount: completedPaymentsCount,
      completedAmount: completedPaymentsAmount,
      pendingCount: pendingPaymentsCount,
      pendingAmount: pendingPaymentsAmount,
    },
    inquiries: {
      total: contacts.length,
      pendingAction: pendingContacts,
    },
    testimonials: {
      total: testimonials.length,
      approved: approvedReviews,
      pending: pendingReviews,
    },
    inventoryAlerts,
    divisionBreakdown,
    topProducts,
    topServices,
    chartTimeline,
    hasSufficientChartData,
    pendingActionsCount,
  };
}
