import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Calendar,
  Users,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Building,
  Award,
  Layers,
  ArrowRight,
  Flame,
  Activity,
  Filter,
  BarChart3,
  CalendarRange,
  Zap,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { firestoreOrdersService } from '../../services/firestore/orders';
import { firestoreBookingsService } from '../../services/firestore/bookings';
import { firestoreProductsService } from '../../services/firestore/products';
import { firestoreUsersService } from '../../services/firestore/users';
import {
  FirestoreOrder,
  FirestoreBooking,
  FirestoreProduct,
  FirestoreUser,
} from '../../types/firestore';

interface AdminDashboardViewProps {
  onNavigateSection: (sectionId: string) => void;
  onNavigateSite: (path: string) => void;
}

type DateFilterType = 'today' | 'this_week' | 'this_month' | 'this_year' | 'all' | 'custom';

interface PopularServiceItem {
  id: string;
  name: string;
  division: string;
  divisionId: string;
  bookingsCount: number;
  revenue: number;
}

interface PopularProductItem {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  stockStatus: string;
}

interface DivisionRevenueItem {
  division: string;
  divisionId: string;
  revenue: number;
  percentage: number;
  color: string;
}

interface TimelineBucket {
  label: string;
  dateKey: string;
  revenue: number;
  orderCount: number;
  bookingCount: number;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateSection,
  onNavigateSite,
}) => {
  const { siteSettings, companySettings, divisions } = useFirestoreDataContext();

  // Firestore collection states
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [bookings, setBookings] = useState<FirestoreBooking[]>([]);
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [users, setUsers] = useState<FirestoreUser[]>([]);

  // Connection & Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Date Filtering State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Active Currency Formatting helper
  const currencyCode = siteSettings?.currency || siteSettings?.defaultCurrency || 'LKR';

  const formatCurrency = useCallback(
    (amount: number) => {
      const val = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);

      if (currencyCode === 'LKR' || currencyCode === 'Rs' || currencyCode === 'Rs.') {
        return `Rs. ${formatted}`;
      }
      if (currencyCode === 'USD') {
        return `$${formatted} USD`;
      }
      if (currencyCode === 'EUR') {
        return `€${formatted}`;
      }
      if (currencyCode === 'GBP') {
        return `£${formatted}`;
      }
      return `${currencyCode} ${formatted}`;
    },
    [currencyCode]
  );

  // Setup Real-time Firestore Subscriptions
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    let unsubOrders: (() => void) | undefined;
    let unsubBookings: (() => void) | undefined;
    let unsubProducts: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    try {
      unsubOrders = firestoreOrdersService.subscribeAllOrders(
        (data) => {
          if (isMounted) {
            setOrders(data);
            setIsLiveConnected(true);
            setIsLoading(false);
          }
        },
        (err) => {
          console.warn('[AdminDashboard] Orders subscription error:', err);
          if (isMounted) setFetchError('Failed to establish realtime connection to Orders collection.');
        }
      );

      unsubBookings = firestoreBookingsService.subscribeAllBookings(
        (data) => {
          if (isMounted) {
            setBookings(data);
            setIsLoading(false);
          }
        },
        (err) => {
          console.warn('[AdminDashboard] Bookings subscription error:', err);
        }
      );

      unsubProducts = firestoreProductsService.subscribeProducts(
        undefined,
        (data) => {
          if (isMounted) {
            setProducts(data);
            setIsLoading(false);
          }
        }
      );

      unsubUsers = firestoreUsersService.subscribeUsers(
        (data) => {
          if (isMounted) {
            setUsers(data);
            setIsLoading(false);
          }
        },
        (err) => {
          console.warn('[AdminDashboard] Users subscription error:', err);
        }
      );
    } catch (err: any) {
      console.error('[AdminDashboard] Subscriptions setup error:', err);
      if (isMounted) {
        setFetchError(err?.message || 'Error connecting to Firestore database collections.');
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
      if (unsubOrders) unsubOrders();
      if (unsubBookings) unsubBookings();
      if (unsubProducts) unsubProducts();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const [o, b, p, u] = await Promise.all([
        firestoreOrdersService.getOrders({ limit: 100 }),
        firestoreBookingsService.getBookings({ limit: 100 }),
        firestoreProductsService.getProducts(undefined, true),
        firestoreUsersService.getUsers(100),
      ]);
      setOrders(o);
      setBookings(b);
      setProducts(p);
      setUsers(u);
    } catch (err: any) {
      setFetchError('Unable to refresh telemetry data: ' + (err?.message || 'Network error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Date Range calculation
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    let start = 0;

    switch (dateFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        break;
      case 'this_week': {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        start = d.getTime();
        break;
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
        break;
      case 'custom':
        start = customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : 0;
        return {
          start,
          end: customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : end,
        };
      case 'all':
      default:
        start = 0;
        break;
    }

    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter Orders and Bookings strictly by Date Range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const t = new Date(o.createdAt || 0).getTime();
      return t >= dateRangeBounds.start && t <= dateRangeBounds.end;
    });
  }, [orders, dateRangeBounds]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const t = new Date(b.createdAt || 0).getTime();
      return t >= dateRangeBounds.start && t <= dateRangeBounds.end;
    });
  }, [bookings, dateRangeBounds]);

  // Core Financial & Operational Aggregations from Real Firestore Documents
  const metrics = useMemo(() => {
    // 1. Paid / Settled Transactions
    const paidOrders = filteredOrders.filter(
      (o) => o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'delivered'
    );
    const paidBookings = filteredBookings.filter(
      (b) =>
        b.paymentStatus === 'paid' ||
        b.paymentStatus === 'deposit_paid' ||
        b.status === 'completed'
    );

    const martRevenue = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const bookingRevenue = paidBookings.reduce((s, b) => s + (Number(b.price) || 0), 0);
    const periodRevenue = martRevenue + bookingRevenue;

    // All-time gross revenue
    const allPaidOrders = orders.filter(
      (o) => o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'delivered'
    );
    const allPaidBookings = bookings.filter(
      (b) =>
        b.paymentStatus === 'paid' ||
        b.paymentStatus === 'deposit_paid' ||
        b.status === 'completed'
    );
    const allTimeRevenue =
      allPaidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0) +
      allPaidBookings.reduce((s, b) => s + (Number(b.price) || 0), 0);

    // 2. Order Breakdown
    const pendingOrders = filteredOrders.filter(
      (o) =>
        o.paymentStatus === 'pending' ||
        o.paymentStatus === 'unpaid' ||
        o.status === 'pending' ||
        o.status === 'pending_payment'
    );
    const dispatchedOrders = filteredOrders.filter(
      (o) => o.status === 'shipped' || o.status === 'dispatched' || o.status === 'out_for_delivery'
    );
    const completedOrders = filteredOrders.filter(
      (o) => o.status === 'delivered' || o.status === 'completed'
    );
    const cancelledOrders = filteredOrders.filter(
      (o) => o.status === 'cancelled' || o.status === 'refunded'
    );

    // 3. Booking Breakdown
    const pendingApprovalBookings = filteredBookings.filter(
      (b) =>
        b.status === 'pending' ||
        b.paymentStatus === 'unpaid' ||
        b.paymentStatus === 'pending'
    );
    const scheduledBookings = filteredBookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'scheduled'
    );
    const inProgressBookings = filteredBookings.filter((b) => b.status === 'in_progress');
    const completedBookings = filteredBookings.filter((b) => b.status === 'completed');
    const cancelledBookings = filteredBookings.filter((b) => b.status === 'cancelled');

    // 4. Customers Breakdown (from real Firestore users collection)
    const corporateCustomers = users.filter(
      (u) => (u as any).accountType === 'corporate' || (u as any).corporateDetails != null
    ).length;
    const individualCustomers = users.length - corporateCustomers;

    // 5. Products & Inventory Breakdown (from real Firestore products collection)
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const inStockProducts = products.filter((p) => (p.stock || 0) > 10).length;
    const lowStockProducts = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
    const outOfStockProducts = products.filter((p) => (p.stock || 0) === 0).length;

    // 6. Pending Receivables
    const pendingReceivablesCount = pendingOrders.length + pendingApprovalBookings.length;
    const pendingReceivablesTotal =
      pendingOrders.reduce((s, o) => s + (Number(o.total) || 0), 0) +
      pendingApprovalBookings.reduce((s, b) => s + (Number(b.price) || 0), 0);

    // 7. AOV (Average Order Value)
    const totalSettledTransactions = paidOrders.length + paidBookings.length;
    const averageOrderValue = totalSettledTransactions > 0 ? periodRevenue / totalSettledTransactions : 0;

    // 8. Settlement Rate
    const totalTransactions = filteredOrders.length + filteredBookings.length;
    const settlementRate =
      totalTransactions > 0 ? Math.round((totalSettledTransactions / totalTransactions) * 100) : 0;

    return {
      periodRevenue,
      allTimeRevenue,
      martRevenue,
      bookingRevenue,
      totalOrders: filteredOrders.length,
      paidOrders: paidOrders.length,
      pendingOrders: pendingOrders.length,
      dispatchedOrders: dispatchedOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalBookings: filteredBookings.length,
      pendingApprovalBookings: pendingApprovalBookings.length,
      scheduledBookings: scheduledBookings.length,
      inProgressBookings: inProgressBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      totalCustomers: users.length,
      corporateCustomers,
      individualCustomers: Math.max(0, individualCustomers),
      totalProducts: products.length,
      activeProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReceivablesCount,
      pendingReceivablesTotal,
      averageOrderValue,
      settlementRate,
    };
  }, [filteredOrders, filteredBookings, orders, bookings, users, products]);

  // Division Revenue Breakdown (Computed from actual order items and bookings)
  const divisionRevenue = useMemo<DivisionRevenueItem[]>(() => {
    const revMap: Record<string, { name: string; rev: number; color: string }> = {
      sws: { name: 'SWS Event Management', rev: 0, color: 'bg-blue-600' },
      u1: { name: 'U1 Studio Cinema', rev: 0, color: 'bg-purple-600' },
      mart: { name: 'Mahdev Online Mart', rev: 0, color: 'bg-emerald-600' },
      travels: { name: 'Mahdev Travels VIP', rev: 0, color: 'bg-amber-600' },
      it: { name: 'Mahdev IT & Solutions', rev: 0, color: 'bg-indigo-600' },
    };

    // Add paid bookings to respective division
    filteredBookings.forEach((b) => {
      const isPaid = b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid' || b.status === 'completed';
      if (!isPaid) return;
      const divKey = (b.divisionId || 'sws').toLowerCase();
      if (revMap[divKey]) {
        revMap[divKey].rev += Number(b.price) || 0;
      } else {
        revMap[divKey] = {
          name: b.divisionName || divKey.toUpperCase(),
          rev: Number(b.price) || 0,
          color: 'bg-slate-600',
        };
      }
    });

    // Add paid orders
    filteredOrders.forEach((o) => {
      const isPaid = o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'delivered';
      if (!isPaid) return;

      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          const divKey = (item.divisionId || 'mart').toLowerCase();
          const itemRev = Number(item.lineTotal) || Number(item.price) * (item.quantity || 1) || 0;
          if (revMap[divKey]) {
            revMap[divKey].rev += itemRev;
          } else {
            revMap['mart'].rev += itemRev;
          }
        });
      } else {
        revMap['mart'].rev += Number(o.total) || 0;
      }
    });

    const totalPeriodRev = metrics.periodRevenue || 1;

    return Object.entries(revMap)
      .map(([id, item]) => ({
        division: item.name,
        divisionId: id,
        revenue: item.rev,
        percentage: metrics.periodRevenue > 0 ? Math.round((item.rev / totalPeriodRev) * 100) : 0,
        color: item.color,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings, filteredOrders, metrics.periodRevenue]);

  // Inventory Depletion Alerts (Filtered from real Firestore products)
  const inventoryAlerts = useMemo(() => {
    return products
      .filter((p) => (p.stock || 0) <= 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || p.id,
        divisionName: String(p.division || 'mart').toUpperCase(),
        currentStock: p.stock || 0,
        status: (p.stock || 0) === 0 ? 'out_of_stock' : 'low_stock',
        price: p.price || 0,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  // Popular Services (Aggregated from real Firestore bookings)
  const popularServices = useMemo<PopularServiceItem[]>(() => {
    const map: Record<string, { name: string; division: string; divisionId: string; count: number; rev: number }> = {};

    filteredBookings.forEach((b) => {
      const key = b.serviceId || b.serviceName || 'unknown';
      if (!map[key]) {
        map[key] = {
          name: b.serviceName || b.serviceId || 'Custom Service',
          division: b.divisionName || (b.divisionId ? b.divisionId.toUpperCase() : 'ENTERPRISE'),
          divisionId: b.divisionId || 'sws',
          count: 0,
          rev: 0,
        };
      }
      map[key].count += 1;
      map[key].rev += Number(b.price) || 0;
    });

    return Object.entries(map)
      .map(([id, item]) => ({
        id,
        name: item.name,
        division: item.division,
        divisionId: item.divisionId,
        bookingsCount: item.count,
        revenue: item.rev,
      }))
      .sort((a, b) => b.bookingsCount - a.bookingsCount || b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredBookings]);

  // Top Products (Aggregated from real Firestore order line items)
  const popularProducts = useMemo<PopularProductItem[]>(() => {
    const map: Record<string, { name: string; sku: string; units: number; rev: number }> = {};

    filteredOrders.forEach((o) => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const key = item.productId || item.name || item.sku || 'prod';
          if (!map[key]) {
            map[key] = {
              name: item.name || 'Catalog Product',
              sku: item.sku || key,
              units: 0,
              rev: 0,
            };
          }
          map[key].units += Number(item.quantity) || 1;
          map[key].rev += Number(item.lineTotal) || (Number(item.price) || 0) * (Number(item.quantity) || 1);
        });
      }
    });

    return Object.entries(map)
      .map(([id, item]) => {
        const prodDoc = products.find((p) => p.id === id || p.sku === item.sku);
        return {
          id,
          name: item.name,
          sku: item.sku,
          unitsSold: item.units,
          revenue: item.rev,
          currentStock: prodDoc ? prodDoc.stock || 0 : 0,
          stockStatus: prodDoc ? (prodDoc.stock === 0 ? 'out_of_stock' : prodDoc.stock <= 10 ? 'low_stock' : 'in_stock') : 'in_stock',
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders, products]);

  // Real Timeline Chart Buckets (Aggregated from real Firestore timestamps)
  const timelineBuckets = useMemo<TimelineBucket[]>(() => {
    const totalTransactions = filteredOrders.length + filteredBookings.length;
    if (totalTransactions === 0) return [];

    const bucketMap: Record<string, TimelineBucket> = {};

    const addToBucket = (dateStr: string, amount: number, isOrder: boolean) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      let key = '';
      let label = '';

      if (dateFilter === 'today') {
        const hour = d.getHours();
        key = `${hour}:00`;
        label = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      } else if (dateFilter === 'this_week' || dateFilter === 'this_month' || dateFilter === 'custom') {
        key = d.toISOString().split('T')[0];
        label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (!bucketMap[key]) {
        bucketMap[key] = {
          label,
          dateKey: key,
          revenue: 0,
          orderCount: 0,
          bookingCount: 0,
        };
      }

      bucketMap[key].revenue += amount;
      if (isOrder) bucketMap[key].orderCount += 1;
      else bucketMap[key].bookingCount += 1;
    };

    filteredOrders.forEach((o) => {
      const isPaid = o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'delivered';
      addToBucket(o.createdAt || new Date().toISOString(), isPaid ? Number(o.total) || 0 : 0, true);
    });

    filteredBookings.forEach((b) => {
      const isPaid = b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid' || b.status === 'completed';
      addToBucket(b.createdAt || new Date().toISOString(), isPaid ? Number(b.price) || 0 : 0, false);
    });

    return Object.values(bucketMap).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredOrders, filteredBookings, dateFilter]);

  // Max bucket revenue for chart scale
  const maxBucketRevenue = useMemo(() => {
    if (timelineBuckets.length === 0) return 1;
    return Math.max(...timelineBuckets.map((b) => b.revenue), 10);
  }, [timelineBuckets]);

  // SKELETON LOADING STATE (Rendered before Firestore records arrive)
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Top bar skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 bg-slate-200 rounded w-64" />
            <div className="h-3 bg-slate-100 rounded w-96" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-slate-200 rounded w-28" />
            <div className="h-8 bg-slate-200 rounded w-28" />
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="h-10 bg-slate-200 rounded-xl w-full max-w-xl" />

        {/* KPI Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-28" />
                <div className="w-8 h-8 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-7 bg-slate-200 rounded w-36" />
              <div className="h-3 bg-slate-100 rounded w-48" />
            </div>
          ))}
        </div>

        {/* Secondary Strip Skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-20" />
              <div className="h-5 bg-slate-200 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Action Queue Skeleton */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ERROR & RETRY STATE
  if (fetchError) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-2xs text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold text-slate-900">Firestore Connection Notice</h3>
          <p className="text-xs text-slate-600">{fetchError}</p>
        </div>
        <div className="pt-2">
          <Button
            variant="electric"
            size="sm"
            onClick={handleManualRefresh}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry Firestore Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Operations & Real-Time Business Telemetry
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Firestore Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real enterprise data sourced directly from Cloud Firestore collections (Orders, Bookings, Products, Users).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="text-xs font-bold"
          >
            Sync Telemetry
          </Button>
          <Button
            variant="electric"
            size="sm"
            onClick={() => onNavigateSection('orders')}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Fulfillment Queue ({metrics.pendingOrders})
          </Button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-1 shrink-0">
            <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
            <span>Period:</span>
          </div>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setDateFilter(filter.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                dateFilter === filter.id
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
            />
            <span className="text-slate-400 font-bold">→</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-700"
            />
          </div>
        )}
      </div>

      {/* Primary KPI Grid (High-Signal Firestore Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. REVENUE */}
        <div
          onClick={() => onNavigateSection('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Settled Revenue ({dateFilter.replace('_', ' ')})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-slate-900">
              {formatCurrency(metrics.periodRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>
                {metrics.settlementRate}% Settlement Rate ({metrics.paidOrders + metrics.paidBookings} paid records)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>All-Time: {formatCurrency(metrics.allTimeRevenue)}</span>
            <span className="text-blue-600 font-bold group-hover:underline">Orders & Bookings →</span>
          </div>
        </div>

        {/* 2. ORDERS & AOV */}
        <div
          onClick={() => onNavigateSection('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Commercial Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-slate-900">
              {metrics.totalOrders} {metrics.totalOrders === 1 ? 'Order' : 'Orders'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 font-medium">
              <span className="text-emerald-600 font-bold">{metrics.paidOrders} Settled</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">{metrics.dispatchedOrders} Dispatched</span>
              <span>•</span>
              <span className="text-amber-600 font-bold">{metrics.pendingOrders} Pending</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>AOV: {formatCurrency(metrics.averageOrderValue)}</span>
            <span className="text-blue-600 font-bold group-hover:underline">Manage Orders →</span>
          </div>
        </div>

        {/* 3. BOOKINGS */}
        <div
          onClick={() => onNavigateSection('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Service Reservations
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-slate-900">
              {metrics.totalBookings} {metrics.totalBookings === 1 ? 'Booking' : 'Bookings'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 font-medium">
              <span className="text-purple-700 font-bold">{metrics.scheduledBookings} Scheduled</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{metrics.completedBookings} Delivered</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="text-amber-600 font-bold">Needs Approval: {metrics.pendingApprovalBookings}</span>
            <span className="text-purple-600 font-bold group-hover:underline">Schedule →</span>
          </div>
        </div>

        {/* 4. INVENTORY ALERTS */}
        <div
          onClick={() => onNavigateSection('products')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Warehouse Catalog & SKUs
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-slate-900">
              {metrics.totalProducts} Total SKUs
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-semibold">
              {metrics.outOfStockProducts} depleted, {metrics.lowStockProducts} below threshold
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-800 font-mono font-bold">
            <span>{metrics.activeProducts} Active in Store</span>
            <span className="group-hover:underline">Inventory →</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip (Payments, Customers, & Catalog) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pending Receivables</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900">
            {formatCurrency(metrics.pendingReceivablesTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {metrics.pendingReceivablesCount} unpaid orders/bookings
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Registered Accounts</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900">
            {metrics.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {metrics.corporateCustomers} Corporate • {metrics.individualCustomers} Individual
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed Deliveries</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900">
            {metrics.completedOrders + metrics.completedBookings}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            {metrics.completedOrders} Orders • {metrics.completedBookings} Bookings
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Configured Currency</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-900">
            {currencyCode}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Tax Rate: {siteSettings?.taxRate || 0}%
          </div>
        </div>
      </div>

      {/* Operational Action Queue (Pending Work) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">
              Operational Action Queue (Pending Work)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {metrics.pendingApprovalBookings + metrics.pendingOrders + inventoryAlerts.length} live tasks requiring administrative action
          </span>
        </div>

        {metrics.pendingApprovalBookings === 0 && metrics.pendingOrders === 0 && inventoryAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>All operational queues are clear. No pending booking approvals, dispatch delays, or inventory depletions.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action 1: Booking Approvals */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-purple-950 text-xs block">
                  {metrics.pendingApprovalBookings} Booking Approvals
                </span>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  Client reservations awaiting production confirmation.
                </p>
              </div>
              <Button
                variant="electric"
                size="sm"
                onClick={() => onNavigateSection('bookings')}
                className="shrink-0 text-xs h-7 px-2.5"
              >
                Review
              </Button>
            </div>

            {/* Action 2: Courier Dispatches */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-blue-950 text-xs block">
                  {metrics.pendingOrders} Orders to Dispatch
                </span>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Physical mart shipments awaiting carrier fulfillment.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection('orders')}
                className="shrink-0 text-xs h-7 px-2.5 text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Dispatch
              </Button>
            </div>

            {/* Action 3: Inventory Restock */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-rose-950 text-xs block">
                  {inventoryAlerts.length} Low-Stock Alerts
                </span>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Products fallen below safety inventory replenishment limits.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection('products')}
                className="shrink-0 text-xs h-7 px-2.5 text-rose-700 border-rose-300 hover:bg-rose-100"
              >
                Restock
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Real Firestore Financial & Transaction Timeline Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Realtime Transactions & Revenue Timeline</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Computed strictly from verified Firestore order & booking timestamps in the active date filter.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900">
            Total in Range: {formatCurrency(metrics.periodRevenue)} ({filteredOrders.length + filteredBookings.length} transactions)
          </span>
        </div>

        {timelineBuckets.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-2 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="font-bold text-xs text-slate-700">No sufficient data yet.</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              No orders or bookings were recorded in Firestore for the selected period ({dateFilter.replace('_', ' ')}). New transactions will automatically plot here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto">
              {timelineBuckets.map((bucket, idx) => {
                const heightPercent = maxBucketRevenue > 0 ? Math.max(8, Math.round((bucket.revenue / maxBucketRevenue) * 100)) : 8;
                return (
                  <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {bucket.label}: {formatCurrency(bucket.revenue)} ({bucket.orderCount} orders, {bucket.bookingCount} bookings)
                    </div>

                    <div className="w-full flex items-end justify-center h-32 bg-slate-100 rounded-t-md overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 group-hover:from-blue-600 group-hover:to-cyan-400"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 truncate max-w-[48px]">
                      {bucket.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              <span>0.00</span>
              <span>Max: {formatCurrency(maxBucketRevenue)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Section: Division Revenue Breakdown + Critical Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Division Revenue Share (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Division Revenue Share</span>
            </h3>
            <span className="text-[11px] text-emerald-600 font-mono font-bold">
              {formatCurrency(metrics.periodRevenue)}
            </span>
          </div>

          {metrics.periodRevenue === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No division revenue recorded in this period.
            </div>
          ) : (
            <div className="space-y-3">
              {divisionRevenue.map((div, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{div.division}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(div.revenue)}{' '}
                      <span className="text-slate-400 font-normal">({div.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`${div.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(2, Math.min(100, div.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Payment Settlement Rate:</span>
            <span className="font-mono font-bold text-emerald-600">
              {metrics.settlementRate}% Settled
            </span>
          </div>
        </div>

        {/* Right: Critical Inventory Stock Depletions (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Warehouse Low-Stock Telemetry</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Products reaching critical safety replenishment limits in Firestore catalog.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('products')}
              className="text-xs font-bold"
            >
              Full Catalog ({products.length})
            </Button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {inventoryAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span>All warehouse SKUs are above safety replenishment limits.</span>
              </div>
            ) : (
              inventoryAlerts.slice(0, 4).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      SKU: {item.sku} • {item.divisionName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-700">
                      {item.currentStock} units
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        item.status === 'out_of_stock'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateSection('products')}
                      className="h-7 text-[11px] px-2 font-semibold"
                    >
                      Adjust
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Popular Services & Popular Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-purple-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Popular Services (Highest Demand)
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('bookings')}
              className="text-xs font-bold"
            >
              All Bookings ({bookings.length})
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {popularServices.length === 0 ? (
              <p className="text-center py-6 text-slate-400">
                No service bookings recorded for this period yet.
              </p>
            ) : (
              popularServices.map((svc, idx) => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 font-bold font-mono text-[11px] flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{svc.name}</span>
                      <span className="text-[10px] text-purple-700 font-medium">{svc.division}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      {formatCurrency(svc.revenue)}
                    </span>
                    <span className="text-[10px] text-slate-500">{svc.bookingsCount} reservations</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Top Products (Mahdev Online Mart)
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('orders')}
              className="text-xs font-bold"
            >
              All Orders ({orders.length})
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {popularProducts.length === 0 ? (
              <p className="text-center py-6 text-slate-400">
                No product orders recorded for this period yet.
              </p>
            ) : (
              popularProducts.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px] flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{prod.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {prod.sku}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">
                      {formatCurrency(prod.revenue)}
                    </span>
                    <span className="text-[10px] text-slate-500">{prod.unitsSold} units sold</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
