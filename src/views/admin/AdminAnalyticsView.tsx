import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Users,
  Eye,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  Building,
  Package,
  Briefcase,
  ShieldCheck,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  BarChart2,
  PieChart,
  Activity,
  FileSpreadsheet,
  Globe,
  CreditCard,
  Target,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { TimeRangeFilter, ExecutiveReportData } from '../../types/analytics';
import { Button } from '../../components/ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { firestoreOrdersService } from '../../services/firestore/orders';
import { firestoreBookingsService } from '../../services/firestore/bookings';
import { collection, getDocs, limit, orderBy, query, startAfter, type DocumentSnapshot } from '../../lib/tursoFirestore';
import { db } from '../../lib/firebase';
import { AnalyticsEvent } from '../../types/analytics';

interface AdminAnalyticsViewProps {
  onNavigateSection: (sectionId: string) => void;
  onNavigateSite: (path: string) => void;
}

type TabType = 'overview' | 'traffic' | 'revenue' | 'divisions' | 'products' | 'services' | 'funnels' | 'customers';

const ANALYTICS_EVENT_PAGE_SIZE = 10000;
const TRAFFIC_TABLE_PAGE_SIZE = 50;

function getTrafficRangeStart(timeRange: TimeRangeFilter): number {
  const now = new Date();
  if (timeRange === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (timeRange === '7d') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
  if (timeRange === '30d') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  if (timeRange === '90d') return now.getTime() - 90 * 24 * 60 * 60 * 1000;
  return 0;
}

function summarizeTrafficEvents(
  events: AnalyticsEvent[],
  getLabel: (event: AnalyticsEvent) => string
): Array<{ label: string; views: number }> {
  const counts = new Map<string, number>();
  events.forEach((event) => {
    const label = getLabel(event).trim() || 'Unknown';
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, views]) => ({ label, views }))
    .sort((left, right) => right.views - left.views || left.label.localeCompare(right.label));
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  onNavigateSection,
  onNavigateSite,
}) => {
  const { siteSettings, products, services, isInitialLoading } = useFirestoreDataContext();
  const currentCurrency = siteSettings?.currency || 'LKR';
  const currencySymbol = getCurrencySymbol(currentCurrency);

  const [orders, setOrders] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [eventCursor, setEventCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [isLoadingOlderEvents, setIsLoadingOlderEvents] = useState(false);
  const [olderEventsError, setOlderEventsError] = useState('');
  const [trafficSearch, setTrafficSearch] = useState('');
  const [trafficPage, setTrafficPage] = useState(1);
  const [analyticsLoadError, setAnalyticsLoadError] = useState('');
  const [loadingRecords, setLoadingRecords] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30d');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [report, setReport] = useState<ExecutiveReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<number | null>(null);

  const filteredTrafficEvents = useMemo(() => {
    const rangeStart = getTrafficRangeStart(timeRange);
    return analyticsEvents.filter((event) => {
      const timestamp = Date.parse(event.timestamp);
      return Number.isFinite(timestamp) && timestamp >= rangeStart;
    });
  }, [analyticsEvents, timeRange]);

  const trafficPageViews = useMemo(
    () => filteredTrafficEvents.filter((event) => event.type === 'page_view'),
    [filteredTrafficEvents]
  );

  const trafficEventTypes = useMemo(() => {
    const counts = new Map<string, number>();
    filteredTrafficEvents.forEach((event) => counts.set(event.type, (counts.get(event.type) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredTrafficEvents]);

  const trafficTopPages = useMemo(() => {
    return summarizeTrafficEvents(trafficPageViews, (event) => event.path);
  }, [trafficPageViews]);

  const trafficSources = useMemo(
    () => summarizeTrafficEvents(
      trafficPageViews,
      (event) => String(event.metadata?.referrerHost || 'Unknown')
    ),
    [trafficPageViews]
  );

  const trafficDevices = useMemo(
    () => summarizeTrafficEvents(
      trafficPageViews,
      (event) => String(event.metadata?.deviceType || 'Unknown')
    ),
    [trafficPageViews]
  );

  const trafficCampaigns = useMemo(
    () => summarizeTrafficEvents(
      trafficPageViews.filter((event) =>
        ['utm_source', 'utm_medium', 'utm_campaign'].some(
          (key) => typeof event.metadata?.[key] === 'string' && event.metadata[key].trim()
        )
      ),
      (event) => [
        event.metadata?.utm_source,
        event.metadata?.utm_medium,
        event.metadata?.utm_campaign,
      ].filter(Boolean).join(' / ')
    ),
    [trafficPageViews]
  );

  const filteredTrafficLog = useMemo(() => {
    const term = trafficSearch.trim().toLowerCase();
    if (!term) return filteredTrafficEvents;
    return filteredTrafficEvents.filter((event) => [
      event.type,
      event.path,
      event.title || '',
      event.metadata?.referrerHost || '',
      event.metadata?.deviceType || '',
      event.metadata?.utm_source || '',
      event.metadata?.utm_medium || '',
      event.metadata?.utm_campaign || '',
    ].some((value) => String(value).toLowerCase().includes(term)));
  }, [filteredTrafficEvents, trafficSearch]);

  const maxTrafficPages = Math.max(1, Math.ceil(filteredTrafficLog.length / TRAFFIC_TABLE_PAGE_SIZE));
  const currentTrafficPage = Math.min(trafficPage, maxTrafficPages);
  const pagedTrafficLog = filteredTrafficLog.slice(
    (currentTrafficPage - 1) * TRAFFIC_TABLE_PAGE_SIZE,
    currentTrafficPage * TRAFFIC_TABLE_PAGE_SIZE
  );

  useEffect(() => {
    let isMounted = true;
    setLoadingRecords(true);
    Promise.allSettled([
      firestoreOrdersService.getOrders({ limit: 500 }),
      firestoreBookingsService.getBookings({ limit: 500 }),
      getDocs(query(
        collection(db, 'analyticsEvents'),
        orderBy('timestamp', 'desc'),
        limit(ANALYTICS_EVENT_PAGE_SIZE)
      )),
    ])
      .then(([ordersResult, bookingsResult, eventsResult]) => {
        if (!isMounted) return;
        if (ordersResult.status === 'fulfilled') {
          const ordersRes = ordersResult.value;
          setOrders(Array.isArray(ordersRes) ? ordersRes : (ordersRes as any).orders || []);
        } else {
          console.error('Failed to load analytics orders:', ordersResult.reason);
        }
        if (bookingsResult.status === 'fulfilled') {
          const bookingsRes = bookingsResult.value;
          setBookings(Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes as any).bookings || []);
        } else {
          console.error('Failed to load analytics bookings:', bookingsResult.reason);
        }
        if (eventsResult.status === 'rejected') {
          console.error('Failed to load live analytics records:', eventsResult.reason);
          setAnalyticsLoadError(
            eventsResult.reason instanceof Error
              ? eventsResult.reason.message
              : 'Could not load persisted visitor analytics.'
          );
          return;
        }
        const eventsRes = eventsResult.value;
        const events = eventsRes.docs
          .map((entry) => ({ ...entry.data(), id: entry.id } as AnalyticsEvent))
          .filter((event) => event.type && event.timestamp && event.sessionId);
        setAnalyticsEvents(events);
        setEventCursor(eventsRes.docs.at(-1) || null);
        setHasMoreEvents(eventsRes.size === ANALYTICS_EVENT_PAGE_SIZE);
        analyticsService.setPersistedEvents(events);
      })
      .finally(() => {
        if (isMounted) setLoadingRecords(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchReport = useCallback(() => {
    setIsLoading(true);
    try {
      analyticsService.setPersistedEvents(analyticsEvents);
      const data = analyticsService.getExecutiveReport(
        timeRange,
        currentCurrency,
        orders,
        bookings,
        products,
        services
      );
      setReport(data);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, currentCurrency, orders, bookings, products, services, analyticsEvents]);

  const refreshAnalytics = useCallback(async () => {
    setIsLoading(true);
    setAnalyticsLoadError('');
    setOlderEventsError('');
    try {
      const snapshot = await getDocs(query(
        collection(db, 'analyticsEvents'),
        orderBy('timestamp', 'desc'),
        limit(ANALYTICS_EVENT_PAGE_SIZE)
      ));
      const events = snapshot.docs
        .map((entry) => ({ ...entry.data(), id: entry.id } as AnalyticsEvent))
        .filter((event) => event.type && event.timestamp && event.sessionId);
      setAnalyticsEvents(events);
      setEventCursor(snapshot.docs.at(-1) || null);
      setHasMoreEvents(snapshot.size === ANALYTICS_EVENT_PAGE_SIZE);
      analyticsService.setPersistedEvents(events);
      setReport(analyticsService.getExecutiveReport(
        timeRange,
        currentCurrency,
        orders,
        bookings,
        products,
        services
      ));
    } catch (err) {
      console.error('Failed to refresh visitor analytics:', err);
      setAnalyticsLoadError(err instanceof Error ? err.message : 'Could not refresh visitor analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, currentCurrency, orders, bookings, products, services]);

  const loadOlderEvents = useCallback(async () => {
    if (!eventCursor || !hasMoreEvents || isLoadingOlderEvents) return;
    setIsLoadingOlderEvents(true);
    setOlderEventsError('');
    try {
      const snapshot = await getDocs(query(
        collection(db, 'analyticsEvents'),
        orderBy('timestamp', 'desc'),
        startAfter(eventCursor),
        limit(ANALYTICS_EVENT_PAGE_SIZE)
      ));
      const olderEvents = snapshot.docs
        .map((entry) => ({ ...entry.data(), id: entry.id } as AnalyticsEvent))
        .filter((event) => event.type && event.timestamp && event.sessionId);
      setAnalyticsEvents((current) => {
        const knownIds = new Set(current.map((event) => event.id));
        const combined = [
          ...current,
          ...olderEvents.filter((event) => !knownIds.has(event.id)),
        ].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
        analyticsService.setPersistedEvents(combined);
        return combined;
      });
      setEventCursor(snapshot.docs.at(-1) || null);
      setHasMoreEvents(snapshot.size === ANALYTICS_EVENT_PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load older visitor analytics:', error);
      setOlderEventsError(error instanceof Error ? error.message : 'Could not load older analytics events.');
    } finally {
      setIsLoadingOlderEvents(false);
    }
  }, [eventCursor, hasMoreEvents, isLoadingOlderEvents]);

  const handleTrafficExport = (): void => {
    const escapeCsv = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const columns = ['Timestamp', 'Event', 'Path', 'Page Title', 'Referrer', 'Device', 'Campaign', 'Anonymous Session'];
    const rows = filteredTrafficLog.map((event) => [
      event.timestamp,
      event.type,
      event.path,
      event.title || '',
      event.metadata?.referrerHost || '',
      event.metadata?.deviceType || '',
      [
        event.metadata?.utm_source,
        event.metadata?.utm_medium,
        event.metadata?.utm_campaign,
      ].filter(Boolean).join(' / '),
      event.sessionId,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mahdev_website_traffic_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    setTrafficPage(1);
  }, [timeRange, trafficSearch]);

  const handleExport = (type: 'revenue' | 'orders' | 'bookings' | 'products' | 'services' | 'divisions') => {
    setIsExporting(true);
    analyticsService.exportCsv(type, timeRange, currentCurrency);
    setExportMenuOpen(false);
    setTimeout(() => setIsExporting(false), 500);
  };

  if ((isInitialLoading || isLoading || loadingRecords) && !report) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Shimmer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded-full" />
            <div className="h-7 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-80 bg-slate-200 rounded-md" />
          </div>
          <div className="h-10 w-48 bg-slate-200 rounded-xl" />
        </div>
        {/* KPI Cards Shimmer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="h-3 w-16 bg-slate-200 rounded-sm" />
              <div className="h-6 w-24 bg-slate-200 rounded-md" />
              <div className="h-3 w-20 bg-slate-200 rounded-sm" />
            </div>
          ))}
        </div>
        {/* Main Chart Shimmer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-80" />
      </div>
    );
  }

  if (!report) return null;

  const hasRealAnalytics =
    (orders && orders.length > 0) ||
    (bookings && bookings.length > 0) ||
    report.dailyTrends.some((point) => point.revenue > 0 || point.orders > 0 || point.bookings > 0 || point.visitors > 0) ||
    report.divisionPerformance.some((division) => division.pageViews > 0 || division.bookingsCount > 0 || division.ordersCount > 0 || division.grossRevenue > 0) ||
    report.topProducts.some((product) => product.unitsSold > 0 || product.views > 0 || product.cartAdds > 0) ||
    report.topServices.some((service) => service.bookingsCount > 0 || service.views > 0) ||
    report.ecommerceFunnel.some((stage) => stage.count > 0) ||
    report.bookingFunnel.some((stage) => stage.count > 0) ||
    report.paymentGatewayDistribution.some((gateway) => gateway.transactionsCount > 0 || gateway.volume > 0) ||
    report.kpis.totalPageViews > 0 ||
    analyticsEvents.length > 0;

  if (!hasRealAnalytics) {
    return (
      <div className="space-y-4">
        {analyticsLoadError && (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Visitor analytics could not be loaded: {analyticsLoadError}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <BarChart2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No analytics data yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Orders, bookings, and customer activity will appear here once the business starts generating real engagement.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              <Activity className="h-3.5 w-3.5 text-[#0052FF]" />
              Waiting for live operational data
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find max revenue for SVG chart scaling
  const maxRevenue = Math.max(...report.dailyTrends.map((d) => d.revenue), 100);
  const chartHeight = 160;
  const chartWidth = 600;

  return (
    <div className="space-y-8">
      {/* Header & Global Time Range Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#0052FF] border border-blue-200">
              Intelligence Hub
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analytics & Executive Reporting
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Holistic cross-division performance, financial velocity, conversion funnels, and customer metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'all', label: 'All Time' },
              ] as { id: TimeRangeFilter; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => void refreshAnalytics()}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0052FF]' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select Dimension
                </div>
                <button
                  onClick={() => handleExport('revenue')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Revenue & Daily Trends</span>
                </button>
                <button
                  onClick={() => handleExport('divisions')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5 text-[#0052FF]" />
                  <span>Divisions Performance Matrix</span>
                </button>
                <button
                  onClick={() => handleExport('products')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-amber-600" />
                  <span>Top Products & Inventory</span>
                </button>
                <button
                  onClick={() => handleExport('services')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  <span>Top Services & Bookings</span>
                </button>
                <button
                  onClick={() => handleExport('orders')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Raw Orders Master Data</span>
                </button>
                <button
                  onClick={() => handleExport('bookings')}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Raw Bookings Master Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top 6 KPI Pulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(report.kpis.grossRevenue, currentCurrency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {report.kpis.revenueGrowthPercent > 0 ? (
              <>
                <span className="flex items-center font-bold text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{report.kpis.revenueGrowthPercent}%
                </span>
                <span className="text-slate-400">vs prev cycle</span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Real-time ledger</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {currentCurrency === 'LKR'
              ? `USD $${report.revenueByCurrency.USD.toLocaleString()}`
              : `LKR Rs. ${report.revenueByCurrency.LKR.toLocaleString()}`}
          </div>
        </div>

        {/* Total Orders & AOV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mart Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#0052FF]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {report.kpis.totalOrders}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-slate-700">AOV: {formatCurrency(report.kpis.averageOrderValue, currentCurrency)}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {report.kpis.ordersGrowthPercent > 0 ? `+${report.kpis.ordersGrowthPercent}% velocity` : 'Verified orders'}
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {report.kpis.totalBookings}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-slate-700">Pipeline: {formatCurrency(report.kpis.bookingsPipelineValue, currentCurrency)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 4 service divisions
          </div>
        </div>

        {/* Customer Base */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {report.kpis.totalRegisteredCustomers}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-indigo-600">{report.kpis.corporateClientRatioPercent}% Corporate</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {report.customerBreakdown.repeatOrderRatePercent}% repeat rate
          </div>
        </div>

        {/* Store Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {report.kpis.overallStoreConversionPercent}%
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-slate-700">Booking: {report.kpis.bookingConversionPercent}%</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Healthy benchmark
          </div>
        </div>

        {/* Traffic & Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pageviews</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {report.kpis.totalPageViews.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-slate-700">{report.kpis.uniqueSessionsCount.toLocaleString()} Visitors</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Anonymous browser sessions
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      {analyticsLoadError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Visitor analytics could not be loaded: {analyticsLoadError}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Search and campaign performance">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Organic search traffic</h2>
          <p className="mt-1 text-xs text-slate-500">Search-engine referrals in the selected period</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-2xl font-bold tabular-nums text-slate-950">
              {report.traffic.organicSearchVisitors.toLocaleString()}
            </span>
            <span className="pb-1 text-xs text-slate-500">visitors</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {report.traffic.organicSearchVisits.toLocaleString()} page views from search engines
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Campaign performance</h2>
          <p className="mt-1 text-xs text-slate-500">Tagged campaign visits (UTM source / medium / campaign)</p>
          <div className="mt-4 space-y-3">
            {report.traffic.topCampaigns.length ? report.traffic.topCampaigns.map((campaign) => (
              <div key={campaign.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-slate-700">{campaign.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">{campaign.views.toLocaleString()}</span>
              </div>
            )) : <p className="text-xs text-slate-400">No tagged campaign visits yet.</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Website traffic details">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Most viewed pages</h2>
          <p className="mt-1 text-xs text-slate-500">Page views during the selected period</p>
          <div className="mt-4 space-y-3">
            {report.traffic.topPages.length ? report.traffic.topPages.map((page) => (
              <div key={page.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-slate-700">{page.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">{page.views.toLocaleString()}</span>
              </div>
            )) : <p className="text-xs text-slate-400">No tracked page views yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Visitor sources</h2>
          <p className="mt-1 text-xs text-slate-500">Referring sites and direct visits</p>
          <div className="mt-4 space-y-3">
            {report.traffic.topReferrers.length ? report.traffic.topReferrers.map((source) => (
              <div key={source.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-slate-700">{source.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">{source.views.toLocaleString()}</span>
              </div>
            )) : <p className="text-xs text-slate-400">No source data yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Devices</h2>
          <p className="mt-1 text-xs text-slate-500">Device type by page view</p>
          <div className="mt-4 space-y-3">
            {report.traffic.deviceBreakdown.length ? report.traffic.deviceBreakdown.map((device) => (
              <div key={device.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium capitalize text-slate-700">{device.label}</span>
                <span className="shrink-0 font-bold tabular-nums text-slate-900">{device.views.toLocaleString()}</span>
              </div>
            )) : <p className="text-xs text-slate-400">No device data yet.</p>}
          </div>
        </div>
      </section>
      {hasMoreEvents && (
        <p className="text-xs text-slate-500">
          Traffic reporting includes the {analyticsEvents.length.toLocaleString()} most recent events currently loaded. Open Website Traffic and load older records to extend the reporting history. Visitor counts represent anonymous browser sessions, not verified individuals.
        </p>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-px gap-2">
        {(
          [
            { id: 'overview', label: 'Executive Overview', icon: BarChart2 },
            { id: 'traffic', label: 'Website Traffic', icon: Globe },
            { id: 'revenue', label: 'Revenue & Finance', icon: DollarSign },
            { id: 'divisions', label: 'Divisions Matrix', icon: Building },
            { id: 'products', label: 'Popular Products', icon: Package },
            { id: 'services', label: 'Popular Services', icon: Briefcase },
            { id: 'funnels', label: 'Conversion Funnels', icon: Target },
            { id: 'customers', label: 'Customers & Privacy', icon: ShieldCheck },
          ] as { id: TabType; label: string; icon: React.ElementType }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all cursor-pointer border-b-2 ${
                isActive
                  ? 'border-[#0052FF] text-[#0052FF] bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#0052FF]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'traffic' && (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Website traffic summary">
            {[
              { label: 'Page views', value: trafficPageViews.length.toLocaleString() },
              {
                label: 'Unique visitors',
                value: new Set(trafficPageViews.map((event) => event.sessionId)).size.toLocaleString(),
              },
              { label: 'Tracked events', value: filteredTrafficEvents.length.toLocaleString() },
              { label: 'Search visits', value: report.traffic.organicSearchVisits.toLocaleString() },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{metric.value}</p>
              </div>
            ))}
          </section>

          {hasMoreEvents && (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900">
              {analyticsEvents.length.toLocaleString()} events are loaded so far. Load older records below to include them in these reports and the event log.
            </p>
          )}

          <section className="grid gap-4 xl:grid-cols-2" aria-label="Traffic breakdowns">
            {[
              { label: 'All pages', rows: trafficTopPages },
              { label: 'All visitor sources', rows: trafficSources },
              { label: 'All devices', rows: trafficDevices },
              { label: 'All tagged campaigns', rows: trafficCampaigns },
              {
                label: 'All event types',
                rows: trafficEventTypes.map(([eventType, views]) => ({
                  label: eventType.replace(/_/g, ' '),
                  views,
                })),
              },
            ].map(({ label, rows }) => (
              <div key={label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="text-sm font-bold text-slate-900">{label}</h2>
                  <p className="mt-1 text-xs text-slate-500">Selected period: {timeRange === 'all' ? 'All time loaded' : timeRange}</p>
                </div>
                <div className="max-h-72 overflow-auto">
                  {rows.length ? (
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-2 font-semibold">Name</th>
                          <th className="px-5 py-2 text-right font-semibold">Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                          <tr key={row.label}>
                            <td className="max-w-0 truncate px-5 py-2.5 font-medium text-slate-700" title={row.label}>
                              {row.label}
                            </td>
                            <td className="whitespace-nowrap px-5 py-2.5 text-right font-bold tabular-nums text-slate-900">
                              {row.views.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="px-5 py-8 text-center text-xs text-slate-400">No data for this period.</p>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Website event log</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredTrafficLog.length.toLocaleString()} matching events from {filteredTrafficEvents.length.toLocaleString()} loaded in the selected period.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  value={trafficSearch}
                  onChange={(event) => setTrafficSearch(event.target.value)}
                  placeholder="Search page, source, event..."
                  aria-label="Search website traffic events"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:w-64"
                />
                <Button type="button" variant="secondary" onClick={handleTrafficExport} disabled={!filteredTrafficLog.length}>
                  <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date & time</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Page</th>
                    <th className="px-4 py-3 font-semibold">Source</th>
                    <th className="px-4 py-3 font-semibold">Device</th>
                    <th className="px-4 py-3 font-semibold">Campaign</th>
                    <th className="px-4 py-3 font-semibold">Anonymous session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedTrafficLog.map((event) => {
                    const campaign = [
                      event.metadata?.utm_source,
                      event.metadata?.utm_medium,
                      event.metadata?.utm_campaign,
                    ].filter(Boolean).join(' / ');
                    return (
                      <tr key={event.id} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold capitalize text-slate-800">
                          {event.type.replace(/_/g, ' ')}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <div className="truncate font-medium text-slate-800" title={event.path}>{event.path}</div>
                          {event.title && <div className="mt-1 truncate text-slate-500" title={event.title}>{event.title}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{event.metadata?.referrerHost || '—'}</td>
                        <td className="px-4 py-3 capitalize text-slate-600">{event.metadata?.deviceType || '—'}</td>
                        <td className="max-w-48 px-4 py-3 text-slate-600">{campaign || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{event.sessionId}</td>
                      </tr>
                    );
                  })}
                  {!pagedTrafficLog.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No matching visitor events. Try another date range or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-slate-500">
                Page {currentTrafficPage} of {maxTrafficPages} · {TRAFFIC_TABLE_PAGE_SIZE} events per page
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTrafficPage((page) => Math.max(1, page - 1))}
                  disabled={currentTrafficPage <= 1}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTrafficPage((page) => Math.min(maxTrafficPages, page + 1))}
                  disabled={currentTrafficPage >= maxTrafficPages}
                >
                  Next
                </Button>
                {hasMoreEvents && (
                  <Button type="button" onClick={loadOlderEvents} disabled={isLoadingOlderEvents}>
                    {isLoadingOlderEvents ? 'Loading older records…' : 'Load older records'}
                  </Button>
                )}
              </div>
            </div>
            {olderEventsError && (
              <p role="alert" className="border-t border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-800">
                Could not load older visitor events: {olderEventsError}
              </p>
            )}
          </section>
          <p className="text-xs text-slate-500">
            Visitor identifiers are anonymous session IDs, not verified people. Search-engine visits are inferred from referrers; Google Search Console provides its own query and impression totals.
          </p>
        </div>
      )}

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Curve & Trends Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Velocity & Activity Trend</h3>
                <p className="text-xs text-slate-500">Gross revenue generation across timeline intervals</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0052FF]"></span>
                  <span className="text-slate-600 font-medium">Gross Revenue ({currencySymbol})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600 font-medium">Orders & Bookings</span>
                </div>
              </div>
            </div>

            {/* SVG Trend Graph */}
            <div className="relative w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0052FF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0052FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = chartHeight - pct * (chartHeight - 30) - 15;
                  return (
                    <g key={idx}>
                      <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="#F1F5F9" strokeWidth="1" />
                      <text x="0" y={y - 4} fill="#94A3B8" fontSize="9" fontFamily="monospace">
                        {currencySymbol} {Math.round(maxRevenue * pct).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* Revenue Filled Area & Line */}
                {(() => {
                  const points = report.dailyTrends.map((d, idx) => {
                    const step = chartWidth / Math.max(1, report.dailyTrends.length - 1);
                    const x = idx * step;
                    const y = chartHeight - (d.revenue / maxRevenue) * (chartHeight - 30) - 15;
                    return { x, y, data: d };
                  });

                  if (points.length === 0) return null;

                  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
                  const areaD = `${pathD} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`;

                  return (
                    <>
                      <path d={areaD} fill="url(#revGrad)" />
                      <path d={pathD} fill="none" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round" />
                      {points.map((pt, idx) => (
                        <g key={idx} className="cursor-pointer">
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={hoveredDataPoint === idx ? 5 : 3.5}
                            fill="#0052FF"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            onMouseEnter={() => setHoveredDataPoint(idx)}
                            onMouseLeave={() => setHoveredDataPoint(null)}
                          />
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              {/* X-Axis Labels */}
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                {report.dailyTrends.filter((_, idx) => idx % Math.ceil(report.dailyTrends.length / 7) === 0).map((d, i) => (
                  <span key={i}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Division Performance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {report.divisionPerformance.map((div) => (
              <div
                key={div.divisionId}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: div.color }}
                    >
                      {div.shortCode}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{div.revenueSharePercent}% rev</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{div.name}</h4>
                  <div className="text-lg font-bold text-slate-900 mt-2">
                    {formatCurrency(div.grossRevenue, currentCurrency)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Pageviews:</span>
                    <span className="font-semibold text-slate-800">{div.pageViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inquiries / RFP:</span>
                    <span className="font-semibold text-slate-800">{div.inquiries + div.quoteRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{div.divisionId === 'mart' ? 'Orders:' : 'Bookings:'}</span>
                    <span className="font-semibold text-emerald-600">
                      {div.divisionId === 'mart' ? div.ordersCount : div.bookingsCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion:</span>
                    <span className="font-bold text-[#0052FF]">{div.conversionRatePercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & FINANCIALS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Currency Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Dual-Currency Breakdown
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border transition-all ${
                  currentCurrency === 'LKR'
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-emerald-700 uppercase">Sri Lankan Rupee (LKR)</div>
                    {currentCurrency === 'LKR' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                        Active Currency
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    Rs. {report.revenueByCurrency.LKR.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">LankaPay National Switch & Local Settled</div>
                </div>

                <div className={`p-4 rounded-xl border transition-all ${
                  currentCurrency === 'USD'
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-700 uppercase">United States Dollars (USD)</div>
                    {currentCurrency === 'USD' && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-600 text-white rounded-full">
                        Active Currency
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    ${report.revenueByCurrency.USD.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">International & Card Transactions</div>
                </div>
              </div>
            </div>

            {/* Payment Gateways Performance */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Payment Method & Gateway Share
              </h3>
              <div className="space-y-4">
                {report.paymentGatewayDistribution.map((gw) => (
                  <div key={gw.gateway} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-800">
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#0052FF]" />
                        {gw.label}
                      </span>
                      <span>{formatCurrency(gw.volume, currentCurrency)} ({gw.percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0052FF] rounded-full transition-all"
                        style={{ width: `${Math.max(gw.percentage, 4)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Financials Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Historical Daily Revenue Log</h3>
              <span className="text-xs text-slate-500 font-medium">Aggregated per 24-hr UTC cycle</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Gross Revenue ({currentCurrency})</th>
                    <th className="p-3.5">Completed Orders</th>
                    <th className="p-3.5">Service Bookings</th>
                    <th className="p-3.5">Unique Visitors</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {report.dailyTrends.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-900">{d.label} ({d.date})</td>
                      <td className="p-3.5 font-bold text-emerald-600">{formatCurrency(d.revenue, currentCurrency)}</td>
                      <td className="p-3.5">{d.orders}</td>
                      <td className="p-3.5">{d.bookings}</td>
                      <td className="p-3.5">{d.visitors}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Reconciled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIVISIONS MATRIX */}
      {activeTab === 'divisions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">5-Division Performance Matrix</h3>
              <p className="text-xs text-slate-500">Cross-divisional comparison of traffic, lead generation, bookings, and revenue share</p>
            </div>
            <button
              onClick={() => handleExport('divisions')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Matrix</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Division</th>
                  <th className="p-4">Pageviews</th>
                  <th className="p-4">Direct Inquiries</th>
                  <th className="p-4">RFP Quotes</th>
                  <th className="p-4">Confirmed Transactions</th>
                  <th className="p-4">Gross Revenue ({currentCurrency})</th>
                  <th className="p-4">Revenue Share</th>
                  <th className="p-4">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.divisionPerformance.map((div) => (
                  <tr key={div.divisionId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: div.color }}
                        ></span>
                        <div>
                          <div className="font-bold text-slate-900">{div.name}</div>
                          <div className="text-[11px] text-slate-400 uppercase font-mono">{div.shortCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{div.pageViews.toLocaleString()}</td>
                    <td className="p-4">{div.inquiries}</td>
                    <td className="p-4">{div.quoteRequests}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      {div.divisionId === 'mart' ? `${div.ordersCount} orders` : `${div.bookingsCount} bookings`}
                    </td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(div.grossRevenue, currentCurrency)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${div.revenueSharePercent}%`, backgroundColor: div.color }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-900">{div.revenueSharePercent}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0052FF] border border-blue-100">
                        {div.conversionRatePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: POPULAR PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Popular Mart Products & Velocity</h3>
              <p className="text-xs text-slate-500">Ranked by gross sales volume, units sold, and cart conversion velocity</p>
            </div>
            <button
              onClick={() => handleExport('products')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Products</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Product Name & SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Unit Price ({currentCurrency})</th>
                  <th className="p-4">Units Sold</th>
                  <th className="p-4">Gross Revenue ({currentCurrency})</th>
                  <th className="p-4">Views / Cart Adds</th>
                  <th className="p-4">Conversion Rate</th>
                  <th className="p-4">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.topProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                    </td>
                    <td className="p-4">{p.category}</td>
                    <td className="p-4 font-semibold text-slate-800">{formatCurrency(p.price, currentCurrency)}</td>
                    <td className="p-4 font-bold text-slate-900">{p.unitsSold} units</td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(p.revenue, currentCurrency)}</td>
                    <td className="p-4 text-slate-600">{p.views} / {p.cartAdds}</td>
                    <td className="p-4">
                      <span className="font-bold text-[#0052FF]">{p.conversionRate}%</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stockStatus === 'low_stock'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {p.currentStock} in stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: POPULAR SERVICES */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Popular Services & Bookings Pipeline</h3>
              <p className="text-xs text-slate-500">Corporate & retail service demand across SWS, U1 Studio, IT Solutions, and Travels</p>
            </div>
            <button
              onClick={() => handleExport('services')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Services</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Service Name</th>
                  <th className="p-4">Division</th>
                  <th className="p-4">Bookings Count</th>
                  <th className="p-4">Completed Deliverables</th>
                  <th className="p-4">Average Value ({currentCurrency})</th>
                  <th className="p-4">Gross Revenue ({currentCurrency})</th>
                  <th className="p-4">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.topServices.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900">{s.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {s.divisionName}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{s.bookingsCount}</td>
                    <td className="p-4 font-semibold text-slate-700">{s.completedCount}</td>
                    <td className="p-4 font-semibold text-slate-800">{formatCurrency(s.averageBookingValue, currentCurrency)}</td>
                    <td className="p-4 font-bold text-emerald-600">{formatCurrency(s.revenue, currentCurrency)}</td>
                    <td className="p-4">
                      <span className="font-bold text-[#0052FF]">{s.conversionRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CONVERSION FUNNELS */}
      {activeTab === 'funnels' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* E-Commerce Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">E-Commerce Purchase Funnel</h3>
                <p className="text-xs text-slate-500">Mahdev Online Mart visitor path to completed payment</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Mart Funnel
              </span>
            </div>

            <div className="space-y-4">
              {report.ecommerceFunnel.map((stage, idx) => (
                <div key={stage.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700">
                        {idx + 1}
                      </span>
                      {stage.name}
                    </span>
                    <span>{stage.count.toLocaleString()} sessions</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.max(stage.overallConversion, 5)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Overall: <strong className="text-slate-800">{stage.overallConversion}%</strong></span>
                    {idx > 0 && (
                      <span className="text-rose-600 font-semibold">
                        -{stage.dropoffRate}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Booking Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Service Booking & RFP Funnel</h3>
                <p className="text-xs text-slate-500">Corporate & client path to scheduled service contracts</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0052FF] border border-blue-200">
                Services Funnel
              </span>
            </div>

            <div className="space-y-4">
              {report.bookingFunnel.map((stage, idx) => (
                <div key={stage.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-[#0052FF] font-bold">
                        {idx + 1}
                      </span>
                      {stage.name}
                    </span>
                    <span>{stage.count.toLocaleString()} sessions</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0052FF] rounded-full transition-all"
                      style={{ width: `${Math.max(stage.overallConversion, 5)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Overall: <strong className="text-slate-800">{stage.overallConversion}%</strong></span>
                    {idx > 0 && (
                      <span className="text-rose-600 font-semibold">
                        -{stage.dropoffRate}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CUSTOMERS & PRIVACY */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Segment Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Customer Profile Segments</h3>
            <p className="text-xs text-slate-500 mb-6">Registered client ratio and enterprise retainers</p>

            {(() => {
              const totalAccounts = report.customerBreakdown.corporateCount + report.customerBreakdown.individualCount;
              const corpPct = totalAccounts > 0 ? Math.round((report.customerBreakdown.corporateCount / totalAccounts) * 100) : 0;
              const indivPct = totalAccounts > 0 ? 100 - corpPct : 0;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center font-bold">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Corporate Enterprise Accounts</div>
                        <div className="text-xs text-slate-500">Companies & Institutional Brands</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">{report.customerBreakdown.corporateCount} Accounts</div>
                      <div className="text-xs text-indigo-600 font-semibold">{corpPct}% Share</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Individual & Retail Consumers</div>
                        <div className="text-xs text-slate-500">Mart Buyers & Private Bookings</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">{report.customerBreakdown.individualCount} Accounts</div>
                      <div className="text-xs text-emerald-600 font-semibold">{indivPct}% Share</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Privacy & Performance Compliance Audit Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Privacy & Telemetry Architecture</h3>
            <p className="text-xs text-slate-500 mb-6">Audited telemetry standards and data protection compliance</p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="text-emerald-900 block font-bold">Zero Third-Party Advertising Trackers</strong>
                  <span className="text-slate-600">All analytics are processed strictly through local first-party aggregation with zero external tracker scripts or data resale.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                <CheckCircle2 className="w-4 h-4 text-[#0052FF] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="text-blue-900 block font-bold">Strict PII Sanitization Guarantee</strong>
                  <span className="text-slate-600">Passwords, payment card numbers, contact telephone numbers, and street addresses are automatically filtered before telemetry collection.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="text-indigo-900 block font-bold">Do-Not-Track (DNT) Compliance</strong>
                  <span className="text-slate-600">Client-side telemetry respects the browser `DNT: 1` header, eliminating detailed event tracking when requested.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 bg-teal-50/60 rounded-xl border border-teal-200">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <strong className="text-teal-900 block font-bold">Zero Layout-Blocking Overhead</strong>
                  <span className="text-slate-600">Uses `requestIdleCallback` and `navigator.sendBeacon` for non-blocking execution with 0ms rendering latency impact.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
