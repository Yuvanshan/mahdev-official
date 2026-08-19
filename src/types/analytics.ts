/**
 * Analytics & Reporting Types (Phase 36)
 * Schema for Privacy-Safe Event Tracking and Executive Administrative Reports.
 */

export type AnalyticsEventType =
  | 'page_view'
  | 'division_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_started'
  | 'purchase_completed'
  | 'booking_started'
  | 'booking_completed'
  | 'contact_submitted'
  | 'quote_requested'
  | 'search_performed'
  | 'download_brochure'
  | 'custom';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string; // ISO 8601
  path: string;
  title?: string;
  divisionId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export type TimeRangeFilter = 'today' | '7d' | '30d' | '90d' | 'all';

export interface DailyDataPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  bookings: number;
  visitors: number;
}

export interface DivisionAnalyticsSummary {
  divisionId: string;
  name: string;
  shortCode: string;
  color: string;
  pageViews: number;
  inquiries: number;
  quoteRequests: number;
  bookingsCount: number;
  ordersCount: number;
  grossRevenue: number;
  revenueSharePercent: number;
  conversionRatePercent: number;
}

export interface TopProductMetric {
  id: string;
  name: string;
  sku: string;
  category: string;
  divisionId: string;
  price: number;
  unitsSold: number;
  revenue: number;
  views: number;
  cartAdds: number;
  conversionRate: number;
  currentStock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface TopServiceMetric {
  id: string;
  name: string;
  divisionId: string;
  divisionName: string;
  bookingsCount: number;
  completedCount: number;
  revenue: number;
  views: number;
  averageBookingValue: number;
  conversionRate: number;
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  dropoffRate: number;
  stepConversion: number;
  overallConversion: number;
}

export interface ExecutiveReportData {
  timeRange: TimeRangeFilter;
  kpis: {
    grossRevenue: number;
    revenueGrowthPercent: number;
    totalOrders: number;
    ordersGrowthPercent: number;
    averageOrderValue: number;
    totalBookings: number;
    bookingsPipelineValue: number;
    totalRegisteredCustomers: number;
    corporateClientRatioPercent: number;
    overallStoreConversionPercent: number;
    bookingConversionPercent: number;
    totalPageViews: number;
    uniqueSessionsCount: number;
  };
  revenueByCurrency: {
    USD: number;
    LKR: number;
  };
  dailyTrends: DailyDataPoint[];
  divisionPerformance: DivisionAnalyticsSummary[];
  topProducts: TopProductMetric[];
  topServices: TopServiceMetric[];
  ecommerceFunnel: FunnelStage[];
  bookingFunnel: FunnelStage[];
  paymentGatewayDistribution: Array<{
    gateway: string;
    label: string;
    transactionsCount: number;
    volume: number;
    percentage: number;
  }>;
  customerBreakdown: {
    individualCount: number;
    corporateCount: number;
    repeatOrderRatePercent: number;
  };
}
