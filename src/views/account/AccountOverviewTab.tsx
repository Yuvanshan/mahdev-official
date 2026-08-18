import React from 'react';
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  FileText,
  ArrowRight,
  ShieldCheck,
  Building,
  Sparkles,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  User,
  Plus,
} from 'lucide-react';
import { CustomerUser } from '../../types/customer';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { PaymentTransaction } from '../../types/payment';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

interface AccountOverviewTabProps {
  user: CustomerUser;
  orders: Order[];
  bookings: Booking[];
  transactions: PaymentTransaction[];
  onNavigate: (path: string) => void;
  onSelectTab: (tab: string) => void;
}

export const AccountOverviewTab: React.FC<AccountOverviewTabProps> = ({
  user,
  orders,
  bookings,
  transactions,
  onNavigate,
  onSelectTab,
}) => {
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingOrdersCount = orders.filter((o) => o.paymentStatus !== 'paid').length;
  const activeBookingsCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'in_progress'
  ).length;

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl font-bold text-white">
                  Welcome back, {user.fullName}
                </h2>
                {user.corporateTier && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {user.corporateTier}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                {user.company ? `${user.company} • ` : ''}
                {user.email} • ID: <span className="font-mono text-blue-300">{user.id}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              variant="electric"
              size="sm"
              onClick={() => onNavigate('/catalog')}
              leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Explore Catalog
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/book')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs text-white border-white/20 hover:bg-white/10"
            >
              Book Service
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectTab('orders')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-slate-900">{orders.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-600 font-bold">{paidOrdersCount} Settled</span>
            {pendingOrdersCount > 0 && (
              <span className="text-amber-600 font-bold">• {pendingOrdersCount} Pending</span>
            )}
          </div>
        </div>

        <div
          onClick={() => onSelectTab('bookings')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Service Bookings</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-slate-900">{bookings.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-purple-600 font-bold">{activeBookingsCount} Active / Scheduled</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('payments')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Spend</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">${totalSpent.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-slate-600">Across {orders.length} transaction orders</span>
          </div>
        </div>

        <div
          onClick={() => onSelectTab('invoices')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Available Invoices</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-slate-900">{orders.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-amber-700 font-semibold">Instant PDF receipts</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Recent Orders</h3>
            </div>
            <button
              onClick={() => onSelectTab('orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({orders.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No orders placed under this account yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/catalog')}
                className="text-xs mt-2"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  onClick={() => onNavigate(`/order/${order.id}`)}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-blue-600">
                        {order.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {order.totalQuantity} items • Placed on{' '}
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      ${order.total.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">
                      View Receipt →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <h3 className="font-display text-sm font-bold text-slate-900">Service Bookings</h3>
            </div>
            <button
              onClick={() => onSelectTab('bookings')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({bookings.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {bookings.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">No active bookings under this account.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/book')}
                className="text-xs mt-2"
              >
                Book a Service
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectTab('bookings')}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 group-hover:text-purple-600 truncate max-w-[180px]">
                        {b.serviceName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      📅 {b.date} • {b.divisionName}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-slate-900">
                      ${b.price.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{b.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
