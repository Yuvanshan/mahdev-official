import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileCompletionCard } from '../../components/account/ProfileCompletionCard';
import { ProgressRing } from '../../components/account/ProgressRing';
import { Avatar } from '../../components/account/Avatar';
import { getProfileCompletion, hasRealName } from '../../utils/profileCompletion';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';
import { orderService } from '../../services/orderService';
import { bookingService } from '../../services/bookingService';
import { Order } from '../../types/order';
import { Booking } from '../../types/booking';
import { PaymentTransaction } from '../../types/payment';
import { AccountOverviewTab } from './AccountOverviewTab';
import { AccountProfileTab } from './AccountProfileTab';
import { AccountOrdersTab } from './AccountOrdersTab';
import { AccountBookingsTab } from './AccountBookingsTab';
import { AccountPaymentsTab } from './AccountPaymentsTab';
import { AccountInvoicesTab } from './AccountInvoicesTab';
import { AccountNotificationsTab } from './AccountNotificationsTab';
import { AccountActivityTab } from './AccountActivityTab';
import {
  bookingAlerts,
  buildActivity,
  isAccountDataStale,
  loadAccountData,
  peekAccountData,
  type AccountData,
} from '../../services/customerAccountService';
import { notificationService } from '../../services/notificationService';
import { Button } from '../../components/ui/Button';
import { Bell } from 'lucide-react';
import { SEOHead } from '../../components/layout/SEOHead';

/** Tabs that show order, booking or payment history (the profile and alerts do not). */
const DATA_TABS = new Set(['overview', 'orders', 'bookings', 'payments', 'invoices', 'activity', 'notifications']);

/** "just now", "3 min ago", "2 h ago" */
function formatAge(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}

/** Small placeholder list, shown only the first time history is loaded. */
const HistoryPlaceholder: React.FC = () => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading your history">
    {[0, 1, 2].map((row) => (
      <div key={row} className="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4" style={{ animationDelay: `${row * 120}ms` }}>
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

interface AccountLayoutProps {
  currentTab?: 'overview' | 'profile' | 'orders' | 'bookings' | 'payments' | 'invoices' | 'notifications' | 'activity';
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
  // Bumped when alerts are marked read, so the Alerts badge recounts.
  const [, setAlertsReadTick] = useState(0);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  // Keeps the selected tab visible in the swipeable mobile tab strip.
  const activeMobileTabRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeMobileTabRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  }, [activeTab, isDataLoading, reduceMotion]);

  // Sync tab with route props
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  // The customer's own orders, bookings and payments (the server only returns theirs).
  // Cached history shows immediately; it is refreshed in the background once older
  // than two minutes, so moving around the site does not repeat the requests.
  const userId = user?.uid || user?.id;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [, setClock] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setClock((tick) => tick + 1), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const applyAccountData = (data: AccountData) => {
    setLoadedAt(data.loadedAt);
    setOrders(data.orders);
    setBookings(data.bookings);
    setTransactions(data.payments);
    setDataError(data.error);
  };
  const refreshAccountData = async (force: boolean) => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      applyAccountData(await loadAccountData(user, { force }));
    } finally {
      setIsRefreshing(false);
      setIsDataLoading(false);
    }
  };
  useEffect(() => {
    if (!user || !userId) {
      setIsDataLoading(false);
      return;
    }
    const cached = peekAccountData(userId);
    if (cached) {
      applyAccountData(cached);
      setIsDataLoading(false);
    } else {
      setIsDataLoading(true);
    }
    if (!cached || isAccountDataStale(userId)) void refreshAccountData(false);
    // Reload when the signed-in account changes, not on every profile edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  if (isLoading) {
    // Skeleton of the account page while the session and history load.
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading your account">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-slate-200/80" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="hidden h-96 rounded-3xl bg-slate-200/70 lg:col-span-3 lg:block" />
            <div className="space-y-4 lg:col-span-9">
              <div className="h-12 rounded-2xl bg-slate-200/70 lg:hidden" />
              <div className="h-40 rounded-3xl bg-slate-200/60" />
              <div className="h-56 rounded-3xl bg-slate-200/50" />
            </div>
          </div>
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
            <h2 className="font-display text-xl font-bold text-slate-900">Please sign in</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Sign in to see your orders, bookings and payments.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Button variant="electric" fullWidth size="sm" onClick={() => onNavigate('/login')} className="py-2.5 font-bold">
              Sign in
            </Button>
            <Button variant="outline" fullWidth size="sm" onClick={() => onNavigate('/register')} className="py-2.5 font-bold">
              Create an account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Session alerts plus unread booking updates from our team.
  const unreadNotifs =
    notificationService.getUnreadCount(user.email, 'customer') + bookingAlerts(bookings).filter((alert) => !alert.read).length;
  const completion = getProfileCompletion(user);
  const firstName = hasRealName(user) ? user.fullName.split(' ')[0] : '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'bookings', label: 'Bookings', icon: Calendar, count: bookings.length },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'profile', label: 'Profile', icon: User, alert: !completion.isComplete },
    { id: 'notifications', label: 'Alerts', icon: Bell, count: unreadNotifs },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: transactions.length },
    { id: 'invoices', label: 'Invoices', icon: FileText, count: orders.length },
  ];

  const badge = (item: (typeof NAV_ITEMS)[number], isActive: boolean) =>
    item.alert ? (
      <span className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" aria-label="Needs attention" />
    ) : item.count && !isDataLoading ? (
      <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
        {item.count}
      </span>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-12">
      <SEOHead
        title="My Account"
        description="Manage your Mahdev orders, bookings, invoices and profile."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/account`}
        noIndex
      />

      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        {/* Account header */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061033] via-[#0b1f5c] to-[#0052FF] p-5 text-white shadow-xl shadow-blue-900/15 sm:p-7"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5"
            animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative flex items-center gap-4">
            <Avatar
              name={user.fullName}
              email={user.email}
              src={user.avatarUrl}
              className="h-14 w-14 rounded-2xl ring-4 ring-white/15 sm:h-16 sm:w-16"
              textClassName="font-display text-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-200">{greeting}{firstName ? ',' : ''}</p>
              <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{firstName || 'Welcome'}</h1>
              <p className="truncate text-xs text-blue-100/80">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className="hidden items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 text-left text-white ring-1 ring-white/15 transition hover:bg-white/15 sm:flex"
            >
              <ProgressRing percent={completion.percent} size={48} stroke={5} />
              <span className="text-xs">
                <span className="block font-semibold">Profile</span>
                <span className="block text-blue-100/80">{completion.percent === 100 ? 'Complete' : 'Complete it'}</span>
              </span>
            </button>
            <span className="hidden text-right text-[11px] leading-tight text-blue-100/80 md:block" aria-live="polite">
              {isRefreshing ? 'Updating…' : loadedAt ? `Updated ${formatAge(loadedAt)}` : ''}
            </span>
            <button
              type="button"
              onClick={() => void refreshAccountData(true)}
              disabled={isRefreshing}
              className="rounded-xl p-2.5 text-blue-100 ring-1 ring-white/15 transition hover:bg-white/10 disabled:opacity-60"
              aria-label="Refresh orders and bookings"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2.5 text-blue-100 ring-1 ring-white/15 transition hover:bg-white/10 lg:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </motion.header>

        <ProfileCompletionCard completion={completion} onNavigate={onNavigate} />

        {/* Mobile and tablet: swipeable tab strip with a sliding pill. */}
        <nav
          aria-label="Account sections"
          className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  ref={isActive ? activeMobileTabRef : undefined}
                  onClick={() => handleTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600 active:bg-slate-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="account-tab-pill-mobile"
                      className="absolute inset-0 rounded-xl bg-[#0052FF] shadow-md shadow-blue-500/25"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                    {badge(item, isActive)}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden space-y-4 lg:sticky lg:top-28 lg:col-span-3 lg:block">
            <nav aria-label="Account sections" className="space-y-1 rounded-3xl border border-slate-200/90 bg-white p-3 shadow-xs">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="account-tab-pill-desktop"
                        className="absolute inset-0 rounded-xl bg-[#0052FF] shadow-md shadow-blue-500/20"
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="relative">{badge(item, isActive)}</span>
                  </button>
                );
              })}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            </nav>

            <div className="space-y-2 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-5 text-white shadow-sm">
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Need help?
              </p>
              <p className="text-xs leading-relaxed text-slate-300">Questions about a booking, order or invoice? Our team is on WhatsApp.</p>
              <a
                href="https://wa.me/94750928078"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:underline"
              >
                Chat on WhatsApp <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 lg:col-span-9">
            {dataError && (
              <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-800">
                {dataError}
              </div>
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {isDataLoading && DATA_TABS.has(activeTab) ? (
                  <HistoryPlaceholder />
                ) : (
                <>
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
                {activeTab === 'activity' && (
                  <AccountActivityTab entries={buildActivity(user, orders, bookings)} onNavigate={onNavigate} />
                )}
                {activeTab === 'orders' && <AccountOrdersTab orders={orders} onNavigate={onNavigate} />}
                {activeTab === 'bookings' && <AccountBookingsTab bookings={bookings} onNavigate={onNavigate} />}
                {activeTab === 'payments' && <AccountPaymentsTab transactions={transactions} onNavigate={onNavigate} />}
                {activeTab === 'invoices' && <AccountInvoicesTab user={user} orders={orders} bookings={bookings} onNavigate={onNavigate} />}
                </>
                )}
                {activeTab === 'profile' && <AccountProfileTab user={user} />}
                {activeTab === 'notifications' && (
                  <AccountNotificationsTab
                    userEmail={user.email}
                    bookings={bookings}
                    onNavigate={onNavigate}
                    onAlertsRead={() => setAlertsReadTick((tick) => tick + 1)}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
