import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AdminDashboardStats, InventoryAlertItem } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { orderService } from '../../services/orderService';
import { bookingService } from '../../services/bookingService';
import { cmsService } from '../../services/cmsService';
import { CmsProduct } from '../../types/cms';
import { Button } from '../../components/ui/Button';

interface AdminDashboardViewProps {
  onNavigateSection: (sectionId: string) => void;
  onNavigateSite: (path: string) => void;
}

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

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onNavigateSection,
  onNavigateSite,
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Popular items
  const [popularServices, setPopularServices] = useState<PopularServiceItem[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProductItem[]>([]);
  const [divisionRevenue, setDivisionRevenue] = useState<{ division: string; revenue: number; percentage: number; color: string }[]>([]);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await adminService.getDashboardStats();
    setStats(data);

    // Calculate real dynamic popular services from bookings
    const allBookings = bookingService.getAllBookings();
    const serviceMap: Record<string, { name: string; division: string; divisionId: string; count: number; rev: number }> = {};

    allBookings.forEach((b) => {
      if (!serviceMap[b.serviceId]) {
        serviceMap[b.serviceId] = {
          name: b.serviceName,
          division: b.divisionName,
          divisionId: b.divisionId,
          count: 0,
          rev: 0,
        };
      }
      serviceMap[b.serviceId].count += 1;
      serviceMap[b.serviceId].rev += b.price;
    });

    const sortedServices: PopularServiceItem[] = Object.entries(serviceMap)
      .map(([id, item]) => ({
        id,
        name: item.name,
        division: item.division,
        divisionId: item.divisionId,
        bookingsCount: item.count,
        revenue: item.rev,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setPopularServices(sortedServices);

    // Calculate real dynamic popular products from orders
    const allOrders = orderService.getAllOrders();
    const productMap: Record<string, { name: string; sku: string; units: number; rev: number }> = {};

    allOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            name: item.name,
            sku: item.sku,
            units: 0,
            rev: 0,
          };
        }
        productMap[item.productId].units += item.quantity;
        productMap[item.productId].rev += item.lineTotal;
      });
    });

    const catalog = cmsService.getAll<CmsProduct>('products');
    const sortedProducts: PopularProductItem[] = Object.entries(productMap)
      .map(([id, item]) => {
        const catItem = catalog.find((c) => c.id === id);
        return {
          id,
          name: item.name,
          sku: item.sku,
          unitsSold: item.units,
          revenue: item.rev,
          currentStock: catItem ? catItem.stockQuantity : 24,
          stockStatus: catItem ? catItem.stockStatus : 'in_stock',
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setPopularProducts(sortedProducts);

    // Division breakdown calculation
    const totalRev = data.revenue.total || 1;
    const martRev = allOrders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    const swsRev = allBookings.filter((b) => b.divisionId === 'sws' && (b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid')).reduce((s, b) => s + b.price, 0);
    const u1Rev = allBookings.filter((b) => b.divisionId === 'u1' && (b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid')).reduce((s, b) => s + b.price, 0);
    const trvRev = allBookings.filter((b) => b.divisionId === 'travels' && (b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid')).reduce((s, b) => s + b.price, 0);
    const itRev = allOrders.filter((o) => o.items.some((i) => i.divisionId === 'it')).reduce((s, o) => s + o.total, 0) +
      allBookings.filter((b) => b.divisionId === 'it' && (b.paymentStatus === 'paid' || b.paymentStatus === 'deposit_paid')).reduce((s, b) => s + b.price, 0);

    const divs = [
      { division: 'SWS Event Management', revenue: swsRev, percentage: Math.round((swsRev / totalRev) * 100), color: 'bg-blue-600' },
      { division: 'U1 Studio Cinema', revenue: u1Rev, percentage: Math.round((u1Rev / totalRev) * 100), color: 'bg-purple-600' },
      { division: 'Mahdev Online Mart', revenue: martRev, percentage: Math.round((martRev / totalRev) * 100), color: 'bg-emerald-600' },
      { division: 'Mahdev Travels VIP', revenue: trvRev, percentage: Math.round((trvRev / totalRev) * 100), color: 'bg-amber-600' },
      { division: 'Mahdev IT & Solutions', revenue: itRev, percentage: Math.round((itRev / totalRev) * 100), color: 'bg-indigo-600' },
    ].sort((a, b) => b.revenue - a.revenue);

    setDivisionRevenue(divs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Aggregating multi-division operational telemetry...</p>
        </div>
      </div>
    );
  }

  // Calculate AOV (Average Order Value)
  const averageOrderValue = stats.orders.total > 0 ? (stats.revenue.total / (stats.orders.total + stats.bookings.total)) : 0;
  const settlementRate = stats.orders.total > 0 ? Math.round((stats.orders.paid / stats.orders.total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Operations & Analytics Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business telemetry across SWS, U1, IT, Travels, and Online Mart.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Refresh Telemetry
          </Button>
          <Button
            variant="electric"
            size="sm"
            onClick={() => onNavigateSection('orders')}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            className="text-xs font-bold"
          >
            Fulfillment Queue
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid (High-Signal Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. REVENUE */}
        <div
          onClick={() => onNavigateSection('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross Enterprise Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-slate-900">
              ${stats.revenue.total.toFixed(2)} USD
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+{stats.revenue.growthPercent}% vs previous period</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Today: ${stats.revenue.today.toFixed(2)}</span>
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
              {stats.orders.total} Orders
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 font-medium">
              <span className="text-emerald-600 font-bold">{stats.orders.paid} Settled</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">{stats.orders.dispatched} Dispatched</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>AOV: ${averageOrderValue.toFixed(2)}</span>
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
              {stats.bookings.total} Bookings
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1 font-medium">
              <span className="text-purple-700 font-bold">{stats.bookings.scheduled} Scheduled</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{stats.bookings.completed} Delivered</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="text-amber-600 font-bold">Needs Approval: {stats.bookings.pendingApproval}</span>
            <span className="text-purple-600 font-bold group-hover:underline">Schedule →</span>
          </div>
        </div>

        {/* 4. INVENTORY ALERTS */}
        <div
          onClick={() => onNavigateSection('inventory')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Inventory Low-Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-mono text-2xl font-bold text-rose-900">
              {stats.inventoryAlerts.length} SKUs Alert
            </div>
            <div className="text-[11px] text-rose-700 mt-1 font-semibold">
              {stats.products.outOfStock} depleted, {stats.products.lowStock} below threshold
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-800 font-mono font-bold">
            <span>Warehouse Stock</span>
            <span className="group-hover:underline">Restock →</span>
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
            {stats.bookings.pendingApproval + stats.orders.pending + stats.inventoryAlerts.length} tasks requiring executive action
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Action 1: Booking Approvals */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-purple-950 text-xs block">
                {stats.bookings.pendingApproval} Booking Approvals
              </span>
              <p className="text-[11px] text-purple-800 mt-0.5">
                New service requests from clients awaiting production crew confirmation.
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
                {stats.orders.pending} Orders to Dispatch
              </span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Physical shipments awaiting carrier waybill number generation.
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
                {stats.inventoryAlerts.length} Low-Stock Alerts
              </span>
              <p className="text-[11px] text-rose-800 mt-0.5">
                Catalog commodities fallen below safety inventory counts.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('inventory')}
              className="shrink-0 text-xs h-7 px-2.5 text-rose-700 border-rose-300 hover:bg-rose-100"
            >
              Restock
            </Button>
          </div>
        </div>
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
              ${stats.revenue.total.toFixed(2)} Total
            </span>
          </div>

          <div className="space-y-3">
            {divisionRevenue.map((div, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{div.division}</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${div.revenue.toFixed(2)} <span className="text-slate-400 font-normal">({div.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${div.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(4, Math.min(100, div.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Payment Settlement Rate:</span>
            <span className="font-mono font-bold text-emerald-600">{settlementRate}% Settled</span>
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
                Products reaching critical safety replenishment limits.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateSection('inventory')}
              className="text-xs font-bold"
            >
              Full Inventory
            </Button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {stats.inventoryAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span>All warehouse SKUs above safety limits.</span>
              </div>
            ) : (
              stats.inventoryAlerts.slice(0, 4).map((item) => (
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
                    <span className="text-[9px] font-mono font-bold uppercase bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      {item.status.replace('_', ' ')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateSection('inventory')}
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
              All Services
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {popularServices.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No service bookings completed yet.</p>
            ) : (
              popularServices.map((svc, idx) => (
                <div key={svc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
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
                    <span className="font-mono font-bold text-slate-900 block">${svc.revenue.toFixed(2)}</span>
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
              All Orders
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            {popularProducts.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No product orders completed yet.</p>
            ) : (
              popularProducts.map((prod, idx) => (
                <div key={prod.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
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
                    <span className="font-mono font-bold text-slate-900 block">${prod.revenue.toFixed(2)}</span>
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
