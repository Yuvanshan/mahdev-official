import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Calendar,
  CreditCard,
  FileText,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Building,
  AlertCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { PaymentTransaction } from '../../types/payment';
import { AccountOverviewTab } from './AccountOverviewTab';
import { AccountProfileTab } from './AccountProfileTab';
import { AccountOrdersTab } from './AccountOrdersTab';
import { AccountBookingsTab } from './AccountBookingsTab';
import { AccountPaymentsTab } from './AccountPaymentsTab';
import { AccountInvoicesTab } from './AccountInvoicesTab';
import { Button } from '../../components/ui/Button';
import { SEOHead } from '../../components/layout/SEOHead';

interface AccountLayoutProps {
  currentTab?: 'overview' | 'profile' | 'orders' | 'bookings' | 'payments' | 'invoices';
  onNavigate: (path: string) => void;
}

export const AccountLayout: React.FC<AccountLayoutProps> = ({
  currentTab = 'overview',
  onNavigate,
}) => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(currentTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Sync tab with route props
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // Load strictly isolated customer data
  useEffect(() => {
    if (user) {
      setIsDataLoading(true);

      // Strict Customer Authorization: Query ONLY records linked to this customer's email or ID
      const userOrders = orderService.getOrdersByEmail(user.email);
      const userBookings = bookingService.getBookingsByCustomerEmail(user.email);

      setOrders(userOrders);
      setBookings(userBookings);

      // Collect transaction logs for customer's own orders
      const loadTransactions = async () => {
        const txnsList: PaymentTransaction[] = [];
        for (const ord of userOrders) {
          const ordTxns = await paymentService.getOrderTransactions(ord.id);
          txnsList.push(...ordTxns);
        }
        setTransactions(txnsList);
        setIsDataLoading(false);
      };

      loadTransactions();
    } else {
      setIsDataLoading(false);
    }
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'overview') {
      onNavigate('/account');
    } else {
      onNavigate(`/account/${tab}`);
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate('/login');
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading your customer portal...</p>
        </div>
      </div>
    );
  }

  // Unauthorized State: Not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[80vh] bg-slate-50 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-xl font-bold text-slate-900">
              Authentication Required
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Please sign in to access your customer orders, booking schedule, and payment records.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button
              variant="electric"
              fullWidth
              size="sm"
              onClick={() => onNavigate('/login')}
              className="text-xs font-bold py-2.5"
            >
              Sign In to Your Account
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={() => onNavigate('/register')}
              className="text-xs font-bold py-2.5"
            >
              Create New Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/account' },
    { id: 'profile', label: 'Profile & Preferences', icon: User, path: '/account/profile' },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, count: orders.length, path: '/account/orders' },
    { id: 'bookings', label: 'My Bookings', icon: Calendar, count: bookings.length, path: '/account/bookings' },
    { id: 'payments', label: 'Payment History', icon: CreditCard, count: transactions.length, path: '/account/payments' },
    { id: 'invoices', label: 'Tax Invoices', icon: FileText, count: orders.length, path: '/account/invoices' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Customer Account Portal | Mahdev Pvt Ltd"
        description="Manage your Mahdev customer orders, event and photography bookings, invoices, and profile preferences in one unified portal."
        canonicalUrl="https://mahdev.lk/account"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Layout Grid: Sidebar Navigation + Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar Navigation (3.5 Cols) */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Customer Mini Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={user.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                />
                <div className="overflow-hidden">
                  <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                    {user.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <span className="inline-block text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.2 rounded-md mt-0.5 border border-blue-100">
                    {user.accountType === 'corporate' ? 'Corporate Client' : 'Individual Client'}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1 pt-2 border-t border-slate-100 text-xs">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0052FF] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Sign Out Button */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Concierge Help Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white text-xs space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Dedicated Concierge</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Need enterprise invoicing, contract terms, or special catering customization?
              </p>
              <a
                href="https://wa.me/94750928078"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:underline"
              >
                <span>Contact Client Desk (WhatsApp)</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </aside>

          {/* Main Content Area (8.5 Cols) */}
          <main className="lg:col-span-9">
            {activeTab === 'overview' && (
              <AccountOverviewTab
                user={user}
                orders={orders}
                bookings={bookings}
                transactions={transactions}
                onNavigate={onNavigate}
                onSelectTab={handleTabChange}
              />
            )}

            {activeTab === 'profile' && <AccountProfileTab user={user} />}

            {activeTab === 'orders' && (
              <AccountOrdersTab orders={orders} onNavigate={onNavigate} />
            )}

            {activeTab === 'bookings' && (
              <AccountBookingsTab bookings={bookings} onNavigate={onNavigate} />
            )}

            {activeTab === 'payments' && (
              <AccountPaymentsTab transactions={transactions} onNavigate={onNavigate} />
            )}

            {activeTab === 'invoices' && (
              <AccountInvoicesTab user={user} orders={orders} onNavigate={onNavigate} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
