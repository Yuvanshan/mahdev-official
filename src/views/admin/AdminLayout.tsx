import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Package,
  FolderTree,
  ShoppingBag,
  Calendar,
  Users,
  Boxes,
  Layers,
  Flag,
  Building,
  MessageSquare,
  FileCode,
  Tag,
  Globe,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
  Bell,
  Search,
  BarChart2,
  Database,
  Loader2,
} from 'lucide-react';
import { activeFirestoreDatabaseId } from '../../lib/firebase';
import { AdminSectionId } from '../../types/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { AdminLoginView } from './AdminLoginView';
import { AdminNotificationCenter } from '../../components/admin/AdminNotificationCenter';
import { SEOHead } from '../../components/layout/SEOHead';
import { InitialAppLoader } from '../../components/common/InitialAppLoader';
import { BrandLogo } from '../../components/layout/BrandLogo';

import { AdminDashboardView } from './AdminDashboardView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminDivisionsView } from './AdminDivisionsView';
import { AdminServicesView } from './AdminServicesView';
import { AdminProductsView } from './AdminProductsView';
import { AdminCategoriesView } from './AdminCategoriesView';
import { AdminPackagesView } from './AdminPackagesView';
import { AdminPortfolioView } from './AdminPortfolioView';
import { AdminGalleryView } from './AdminGalleryView';
import { AdminMilestonesView } from './AdminMilestonesView';
import { AdminCompaniesView } from './AdminCompaniesView';
import { AdminTestimonialsView } from './AdminTestimonialsView';
import { AdminPagesView } from './AdminPagesView';
import { AdminBannersView } from './AdminBannersView';
import { AdminCouponsView } from './AdminCouponsView';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminBookingsView } from './AdminBookingsView';
import { AdminCustomersView } from './AdminCustomersView';
import { AdminInventoryView } from './AdminInventoryView';
import { AdminMediaView } from './AdminMediaView';
import { AdminSeoView } from './AdminSeoView';
import { AdminSettingsView } from './AdminSettingsView';
import { AdminUsersView } from './AdminUsersView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminHomepageView } from './AdminHomepageView';
import { AdminGenericView } from './AdminGenericView';

const AdminSectionSkeleton: React.FC = () => (
  <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-pulse space-y-6">
    <div className="flex items-center justify-between pb-6 border-b border-slate-200">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 rounded-md" />
      </div>
      <div className="h-9 w-32 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-xs" />
      <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-xs" />
      <div className="h-32 bg-white rounded-xl border border-slate-200 shadow-xs" />
    </div>
    <div className="h-96 bg-white rounded-xl border border-slate-200 shadow-xs" />
  </div>
);

interface AdminLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface SidebarItem {
  id: AdminSectionId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart2, badge: 'Live' },
  { id: 'homepage', label: 'Homepage CMS', icon: Globe, badge: 'Live' },
  { id: 'divisions', label: 'Divisions', icon: Building2 },
  { id: 'services', label: 'Services', icon: Briefcase },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'packages', label: 'Packages', icon: Layers },
  { id: 'portfolio', label: 'Portfolio', icon: Layers },
  { id: 'gallery', label: 'Gallery', icon: Layers },
  { id: 'milestones', label: 'Milestones', icon: Flag },
  { id: 'companies', label: 'Companies', icon: Building },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'pages', label: 'Pages', icon: FileCode },
  { id: 'banners', label: 'Banners', icon: Tag },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: 'Live' },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'media', label: 'Media Assets', icon: Layers },
  { id: 'seo', label: 'SEO Engine', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'users', label: 'Users & Roles', icon: ShieldCheck },
  { id: 'audit-logs', label: 'Audit Logs', icon: History },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentPath, onNavigate }) => {
  const { admin, session, isAuthenticated, isLoading, logout } = useAdminAuth();
  const { isInitialLoading, isReady } = useFirestoreDataContext();
  const [activeSection, setActiveSection] = useState<AdminSectionId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Loading State (Admin Auth Token or Live Database Hydration)
  if (isLoading || (isInitialLoading && !isReady)) {
    return (
      <InitialAppLoader
        message="Executive Console"
        subMessage="Securing administrative session..."
      />
    );
  }

  // 2. Authentication Guard: If not authenticated, show Admin Login View
  if (!isAuthenticated || !admin) {
    return <AdminLoginView onNavigate={onNavigate} onSuccess={() => setActiveSection('dashboard')} />;
  }

  // Render appropriate view based on active section
  const renderActiveView = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <AdminDashboardView
            {...({
              onNavigateSection: (sec: any) => setActiveSection(sec as AdminSectionId),
              onNavigateSite: onNavigate,
            } as any)}
          />
        );
      case 'analytics':
        return (
          <AdminAnalyticsView
            {...({
              onNavigateSection: (sec: any) => setActiveSection(sec as AdminSectionId),
              onNavigateSite: onNavigate,
            } as any)}
          />
        );
      case 'homepage':
        return <AdminHomepageView />;
      case 'divisions':
        return <AdminDivisionsView />;
      case 'services':
        return <AdminServicesView />;
      case 'products':
        return <AdminProductsView />;
      case 'categories':
        return <AdminCategoriesView />;
      case 'packages':
        return <AdminPackagesView />;
      case 'portfolio':
        return <AdminPortfolioView />;
      case 'gallery':
        return <AdminGalleryView />;
      case 'milestones':
        return <AdminMilestonesView />;
      case 'companies':
        return <AdminCompaniesView />;
      case 'testimonials':
        return <AdminTestimonialsView />;
      case 'pages':
        return <AdminPagesView />;
      case 'banners':
        return <AdminBannersView />;
      case 'coupons':
        return <AdminCouponsView />;
      case 'orders':
        return <AdminOrdersView />;
      case 'bookings':
        return <AdminBookingsView />;
      case 'customers':
        return <AdminCustomersView />;
      case 'inventory':
        return <AdminInventoryView />;
      case 'media':
        return <AdminMediaView />;
      case 'seo':
        return <AdminSeoView />;
      case 'settings':
        return <AdminSettingsView />;
      case 'users':
        return <AdminUsersView />;
      case 'audit-logs':
        return <AdminAuditLogsView />;
      default:
        return (
          <AdminGenericView
            {...({
              sectionId: activeSection as any,
              onNavigateSection: (sec: any) => setActiveSection(sec),
            } as any)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex font-sans antialiased">
      <SEOHead
        title={`Admin: ${activeSection.toUpperCase()} | Mahdev Pvt Ltd Console`}
        description="Administrative Operations Console for Mahdev Pvt Ltd enterprise management."
        canonicalUrl="https://mahdev.lk/admin"
      />

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* SIDEBAR (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <BrandLogo size="sm" theme="dark" onClick={() => onNavigate('/')} />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
          <span className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            Ecosystem Controls
          </span>

          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-blue-400 border border-blue-900/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <img
              src={admin.avatarUrl}
              alt={admin.name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{admin.name}</div>
              <div className="text-[10px] text-blue-400 font-mono uppercase truncate">
                {admin.role.replace('_', ' ')}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => onNavigate('/')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer border border-slate-800"
              title="Return to Public Site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer border border-slate-800 hover:border-rose-800"
              title="End Administrative Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Administrative Workspace
              </span>
              <h1 className="font-display text-base font-bold text-slate-900 capitalize">
                {activeSection.replace('-', ' ')}
              </h1>
            </div>
          </div>

          {/* Top Bar Right Tools */}
          <div className="flex items-center gap-3">
            <AdminNotificationCenter onNavigate={(path) => {
              if (path.startsWith('/admin')) {
                const section = path.replace('/admin/', '') || 'dashboard';
                setActiveSection(section as AdminSectionId);
              } else {
                onNavigate(path);
              }
            }} />

            <button
              onClick={() => setActiveSection('settings')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/80 hover:bg-blue-100 text-blue-800 border border-blue-200/80 text-[11px] font-mono font-bold transition-colors cursor-pointer"
              title="Click to view Database Diagnostics in Settings"
            >
              <Database className="w-3 h-3 text-blue-600" />
              <span>DB: {activeFirestoreDatabaseId}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>TLS 1.3 SECURE</span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <button
              onClick={() => onNavigate('/')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden md:inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* WORKSPACE BODY */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};
