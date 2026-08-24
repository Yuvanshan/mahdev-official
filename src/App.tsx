import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { HomeView } from './views/HomeView';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DivisionId, LegalPolicyType } from './types';
import { DIVISIONS } from './config/divisions';
import { CustomCursor } from './components/motion/CustomCursor';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { FirestoreDataProvider, useFirestoreDataContext } from './context/FirestoreDataContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { AnnouncementBanner } from './components/layout/AnnouncementBanner';
import { AppBootLoader } from './components/ui/AppBootLoader';
import { testFirestoreConnection, initAppCheck } from './lib/firebase';
import { analyticsService } from './services/analyticsService';
import { catalogService } from './services/catalogService';
import { motion, AnimatePresence } from 'motion/react';

// Dynamic Code Splitting for Secondary Views with Resilient Export Fallbacks
const DivisionView = lazy(() => import('./views/DivisionView').then(m => ({ default: (m as any).default || m.DivisionView })));
const SWSView = lazy(() => import('./views/SWSView').then(m => ({ default: (m as any).default || m.SWSView })));
const U1View = lazy(() => import('./views/U1View').then(m => ({ default: (m as any).default || m.U1View })));
const ITView = lazy(() => import('./views/ITView').then(m => ({ default: (m as any).default || m.ITView })));
const TravelsView = lazy(() => import('./views/TravelsView').then(m => ({ default: (m as any).default || m.TravelsView })));
const MartView = lazy(() => import('./views/MartView').then(m => ({ default: (m as any).default || m.MartView })));
const CatalogView = lazy(() => import('./views/CatalogView').then(m => ({ default: (m as any).default || m.CatalogView })));
const BookingView = lazy(() => import('./views/BookingView').then(m => ({ default: (m as any).default || m.BookingView })));
const CheckoutView = lazy(() => import('./views/CheckoutView').then(m => ({ default: (m as any).default || m.CheckoutView })));
const OrderConfirmationView = lazy(() => import('./views/OrderConfirmationView').then(m => ({ default: (m as any).default || m.OrderConfirmationView })));
const OrderLookupView = lazy(() => import('./views/OrderLookupView').then(m => ({ default: (m as any).default || m.OrderLookupView })));
const AboutView = lazy(() => import('./views/AboutView').then(m => ({ default: (m as any).default || m.AboutView })));
const PortfolioView = lazy(() => import('./views/PortfolioView').then(m => ({ default: (m as any).default || m.PortfolioView })));
const ContactView = lazy(() => import('./views/ContactView').then(m => ({ default: (m as any).default || m.ContactView })));
const LegalPageView = lazy(() => import('./views/LegalPageView').then(m => ({ default: (m as any).default || m.LegalPageView })));
const NotFoundView = lazy(() => import('./views/NotFoundView').then(m => ({ default: (m as any).default || m.NotFoundView })));
const LoginView = lazy(() => import('./views/auth/LoginView').then(m => ({ default: (m as any).default || m.LoginView })));
const RegisterView = lazy(() => import('./views/auth/RegisterView').then(m => ({ default: (m as any).default || m.RegisterView })));
const ForgotPasswordView = lazy(() => import('./views/auth/ForgotPasswordView').then(m => ({ default: (m as any).default || m.ForgotPasswordView })));
const AccountLayout = lazy(() => import('./views/account/AccountLayout').then(m => ({ default: (m as any).default || m.AccountLayout })));
const AdminLayout = lazy(() => import('./views/admin/AdminLayout').then(m => ({ default: (m as any).default || m.AdminLayout })));
const MaintenanceView = lazy(() => import('./views/MaintenanceView').then(m => ({ default: (m as any).default || m.MaintenanceView })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4">
    <div className="relative w-10 h-10 mb-4">
      <div className="w-10 h-10 rounded-full border-2 border-blue-100 border-t-[#0052FF] animate-spin" />
    </div>
    <p className="text-xs font-mono text-slate-400">Loading experience...</p>
  </div>
);

function AppContent() {
  const { siteSettings, isInitialLoading, error, refreshAll, products, services, divisions } =
    useFirestoreDataContext();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Dynamic favicon and document title synchronization from Firestore
  useEffect(() => {
    if (siteSettings?.siteName) {
      if (!document.title.includes(siteSettings.siteName)) {
        document.title = `${siteSettings.siteName} | Enterprise Ecosystem`;
      }
    }

    if (siteSettings?.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = siteSettings.faviconUrl;

      let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (appleLink) {
        appleLink.href = siteSettings.faviconUrl;
      }
    }
  }, [siteSettings?.faviconUrl, siteSettings?.siteName]);

  // Verify Cloud Firestore connectivity and App Check on boot
  useEffect(() => {
    initAppCheck();
    testFirestoreConnection().then((res) => {
      console.info('[Firebase] Firestore Foundation Status:', res.message);
    });
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Clean navigation helper
  const navigate = (path: string) => {
    if (path.startsWith('/#')) {
      const hash = path.substring(1);
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Extract path and query params for redirection
  const [basePath, searchParamsString] = currentPath.split('?');
  const normalizedPath = basePath.toLowerCase().replace(/\/$/, '') || '/';
  const redirectParam = searchParamsString
    ? new URLSearchParams(searchParamsString).get('redirect') || undefined
    : undefined;

  const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');

  // Determine current division from path
  const divisionKey = (Object.keys(DIVISIONS) as DivisionId[]).find(
    (key) => DIVISIONS[key].route === normalizedPath
  );

  // Track page views and division views automatically
  useEffect(() => {
    analyticsService.trackPageView(normalizedPath, document.title, divisionKey);
    if (divisionKey) {
      analyticsService.trackDivisionView(divisionKey, DIVISIONS[divisionKey].name);
    }
  }, [normalizedPath, divisionKey]);

  // 1. Firestore Error Protection Screen
  if (error && !isAdminRoute) {
    return <AppBootLoader error={error} onRetry={refreshAll} />;
  }

  // 2. Maintenance Mode Screen: Live Firestore switch
  const isMaintenanceActive = Boolean(
    siteSettings?.maintenance?.enabled ??
      siteSettings?.maintenanceMode ??
      siteSettings?.enableMaintenanceMode
  );

  if (isMaintenanceActive && !isAdminRoute) {
    return <MaintenanceView onAdminLogin={() => navigate('/admin')} />;
  }

  // Admin routes handle their own layout & auth flow
  if (isAdminRoute) {
    return <AdminLayout currentPath={normalizedPath} onNavigate={navigate} />;
  }

  // Determine if it's a legal page
  const legalRoutes: Record<string, LegalPolicyType> = {
    '/privacy-policy': 'privacy',
    '/terms-and-conditions': 'terms',
    '/refund-policy': 'refund',
    '/shipping-policy': 'shipping',
    '/cookie-policy': 'cookie',
  };

  const legalPolicyType = legalRoutes[normalizedPath];

  // Render view based on route
  const renderCurrentView = () => {
    // Authentication Routes
    if (normalizedPath === '/login') {
      return <LoginView onNavigate={navigate} redirectPath={redirectParam || '/account'} />;
    }

    if (normalizedPath === '/register') {
      return <RegisterView onNavigate={navigate} />;
    }

    if (normalizedPath === '/forgot-password') {
      return <ForgotPasswordView onNavigate={navigate} />;
    }

    // Protected Customer Account Routes
    if (normalizedPath === '/account') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account">
          <AccountLayout currentTab="overview" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/profile') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/profile">
          <AccountLayout currentTab="profile" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/orders') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/orders">
          <AccountLayout currentTab="orders" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/bookings') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/bookings">
          <AccountLayout currentTab="bookings" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/payments') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/payments">
          <AccountLayout currentTab="payments" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/invoices') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/invoices">
          <AccountLayout currentTab="invoices" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/account/notifications') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/notifications">
          <AccountLayout currentTab="notifications" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    // Protected Direct /orders and /bookings shortcuts
    if (normalizedPath === '/orders') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/orders">
          <AccountLayout currentTab="orders" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/bookings') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/bookings">
          <AccountLayout currentTab="bookings" onNavigate={navigate} />
        </ProtectedRoute>
      );
    }

    if (normalizedPath === '/track-order') {
      return <OrderLookupView onNavigate={navigate} />;
    }

    if (normalizedPath === '/checkout') {
      return <CheckoutView onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/order/')) {
      const orderId = normalizedPath.replace('/order/', '').trim();
      return <OrderConfirmationView orderId={orderId} onNavigate={navigate} />;
    }

    if (normalizedPath === '/sws' || divisionKey === 'sws') {
      return <SWSView onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/sws/')) {
      const subSlug = normalizedPath.replace('/sws/', '').trim();
      const validSubsections = [
        'services',
        'packages',
        'gallery',
        'portfolio',
        'process',
        'quote',
        'booking',
        'contact',
      ];
      if (validSubsections.includes(subSlug)) {
        return <SWSView onNavigate={navigate} />;
      }

      // Check if matches a service under SWS
      const swsService = services.find(
        (s) => s.division === 'sws' && (s.slug === subSlug || s.id === subSlug)
      );
      if (swsService) {
        return <BookingView initialDivision="sws" initialServiceId={swsService.id} />;
      }

      return (
        <NotFoundView
          onNavigate={navigate}
          resourceType="service"
          attemptedSlug={`sws/${subSlug}`}
        />
      );
    }

    if (normalizedPath === '/u1' || divisionKey === 'u1') {
      return <U1View onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/u1/')) {
      const subSlug = normalizedPath.replace('/u1/', '').trim();
      const validSubsections = [
        'cinema',
        'media',
        'production',
        'services',
        'packages',
        'portfolio',
        'quote',
        'booking',
      ];
      if (validSubsections.includes(subSlug)) {
        return <U1View onNavigate={navigate} />;
      }

      const u1Service = services.find(
        (s) => s.division === 'u1' && (s.slug === subSlug || s.id === subSlug)
      );
      if (u1Service) {
        return <BookingView initialDivision="u1" initialServiceId={u1Service.id} />;
      }

      return (
        <NotFoundView
          onNavigate={navigate}
          resourceType="service"
          attemptedSlug={`u1/${subSlug}`}
        />
      );
    }

    if (normalizedPath === '/it' || divisionKey === 'it') {
      return <ITView onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/it/')) {
      const subSlug = normalizedPath.replace('/it/', '').trim();
      const itService = services.find(
        (s) => s.division === 'it' && (s.slug === subSlug || s.id === subSlug)
      );
      if (itService) {
        return <BookingView initialDivision="it" initialServiceId={itService.id} />;
      }

      return (
        <NotFoundView
          onNavigate={navigate}
          resourceType="service"
          attemptedSlug={`it/${subSlug}`}
        />
      );
    }

    if (normalizedPath === '/travels' || divisionKey === 'travels') {
      return <TravelsView onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/travels/')) {
      const subSlug = normalizedPath.replace('/travels/', '').trim();
      const travelsService = services.find(
        (s) => s.division === 'travels' && (s.slug === subSlug || s.id === subSlug)
      );
      if (travelsService) {
        return <BookingView initialDivision="travels" initialServiceId={travelsService.id} />;
      }

      return (
        <NotFoundView
          onNavigate={navigate}
          resourceType="service"
          attemptedSlug={`travels/${subSlug}`}
        />
      );
    }

    if (
      normalizedPath === '/mart' ||
      normalizedPath.startsWith('/mart/') ||
      divisionKey === 'mart'
    ) {
      if (normalizedPath.startsWith('/mart/') && normalizedPath !== '/mart') {
        const subSlug = normalizedPath.replace('/mart/', '').trim();
        const martProduct =
          products.find(
            (p) => p.division === 'mart' && (p.slug === subSlug || p.id === subSlug)
          ) ||
          catalogService.getProductBySlug(subSlug) ||
          catalogService.getProductById(subSlug);

        if (martProduct) {
          return (
            <CatalogView
              initialProductId={martProduct.id}
              initialDivision="mart"
              onNavigate={navigate}
            />
          );
        }

        return (
          <NotFoundView
            onNavigate={navigate}
            resourceType="product"
            attemptedSlug={`mart/${subSlug}`}
          />
        );
      }
      return <MartView onNavigate={navigate} />;
    }

    // Dynamic Direct Product Routes (/products/{slug} or /product/{slug})
    if (normalizedPath.startsWith('/products/') || normalizedPath.startsWith('/product/')) {
      const slug = normalizedPath.replace(/^\/(products|product)\//, '').trim();
      const foundProduct =
        products.find((p) => p.slug === slug || p.id === slug) ||
        catalogService.getProductBySlug(slug) ||
        catalogService.getProductById(slug);

      if (!foundProduct) {
        return (
          <NotFoundView
            onNavigate={navigate}
            resourceType="product"
            attemptedSlug={slug}
          />
        );
      }

      const productDivision =
        'division' in foundProduct
          ? (foundProduct.division as string)
          : (foundProduct as any).divisionId;

      return (
        <CatalogView
          initialProductId={foundProduct.id}
          initialDivision={typeof productDivision === 'string' ? productDivision : undefined}
          onNavigate={navigate}
        />
      );
    }

    // Dynamic Direct Service Routes (/services/{slug} or /service/{slug})
    if (normalizedPath.startsWith('/services/') || normalizedPath.startsWith('/service/')) {
      const slug = normalizedPath.replace(/^\/(services|service)\//, '').trim();
      const foundService = services.find((s) => s.slug === slug || s.id === slug);

      if (!foundService) {
        return (
          <NotFoundView
            onNavigate={navigate}
            resourceType="service"
            attemptedSlug={slug}
          />
        );
      }

      return (
        <BookingView
          initialDivision={
            typeof foundService.division === 'string' ? foundService.division : undefined
          }
          initialServiceId={foundService.id}
        />
      );
    }

    // Dynamic Divisions Routes (/divisions/{id} or /division/{id})
    if (normalizedPath.startsWith('/divisions/') || normalizedPath.startsWith('/division/')) {
      const divSlug = normalizedPath.replace(/^\/(divisions|division)\//, '').trim();
      const matchedDiv =
        (Object.keys(DIVISIONS) as DivisionId[]).find((key) => key === divSlug) ||
        divisions.find((d) => d.slug === divSlug || d.id === divSlug);

      if (matchedDiv) {
        const divId =
          typeof matchedDiv === 'string' ? matchedDiv : (matchedDiv.id as DivisionId);
        if (divId === 'sws') return <SWSView onNavigate={navigate} />;
        if (divId === 'u1') return <U1View onNavigate={navigate} />;
        if (divId === 'it') return <ITView onNavigate={navigate} />;
        if (divId === 'travels') return <TravelsView onNavigate={navigate} />;
        if (divId === 'mart') return <MartView onNavigate={navigate} />;
        return <DivisionView divisionId={divId} onNavigate={navigate} />;
      }

      return (
        <NotFoundView
          onNavigate={navigate}
          resourceType="division"
          attemptedSlug={divSlug}
        />
      );
    }

    if (normalizedPath === '/catalog' || normalizedPath.startsWith('/catalog/')) {
      const parts = normalizedPath.split('/').filter(Boolean);
      let initialProductId: string | undefined;
      let initialCategory: string | undefined;
      let initialDivision: string | undefined;

      if (parts[1] === 'product' && parts[2]) {
        const prodId = parts[2];
        const found =
          products.find((p) => p.id === prodId || p.slug === prodId) ||
          catalogService.getProductById(prodId) ||
          catalogService.getProductBySlug(prodId);

        if (!found) {
          return (
            <NotFoundView
              onNavigate={navigate}
              resourceType="product"
              attemptedSlug={prodId}
            />
          );
        }
        initialProductId = found.id;
      } else if (parts[1] === 'category' && parts[2]) {
        initialCategory = parts[2];
      } else if (parts[1] === 'division' && parts[2]) {
        initialDivision = parts[2];
      }

      return (
        <CatalogView
          initialDivision={initialDivision}
          initialCategory={initialCategory}
          initialProductId={initialProductId}
          onNavigate={navigate}
        />
      );
    }

    if (normalizedPath === '/book' || normalizedPath.startsWith('/book/')) {
      const parts = normalizedPath.split('/').filter(Boolean);
      let initialDivision: string | undefined;
      let initialServiceId: string | undefined;

      if (parts[1] === 'service' && parts[2]) {
        const srvId = parts[2];
        const found = services.find((s) => s.id === srvId || s.slug === srvId);
        if (!found) {
          return (
            <NotFoundView
              onNavigate={navigate}
              resourceType="service"
              attemptedSlug={srvId}
            />
          );
        }
        initialServiceId = found.id;
        initialDivision = typeof found.division === 'string' ? found.division : undefined;
      } else if (parts[1]) {
        initialDivision = parts[1];
      }

      return (
        <BookingView
          initialDivision={initialDivision}
          initialServiceId={initialServiceId}
        />
      );
    }

    if (divisionKey) {
      return <DivisionView divisionId={divisionKey} onNavigate={navigate} />;
    }

    if (legalPolicyType) {
      return <LegalPageView policyType={legalPolicyType} onNavigate={navigate} />;
    }

    switch (normalizedPath) {
      case '/':
        return <HomeView onNavigate={navigate} />;
      case '/about':
        return <AboutView onNavigate={navigate} />;
      case '/portfolio':
        return <PortfolioView onNavigate={navigate} />;
      case '/contact':
        return <ContactView onNavigate={navigate} />;
      default:
        return <NotFoundView onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-[#0052FF] selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Interactive Magnetic Custom Cursor for Desktop */}
      <CustomCursor />

      {/* Global Cart Slide-Over Drawer */}
      <CartDrawer onNavigate={navigate} />

      {/* Live CMS Top Announcement / Promotional Banner */}
      <AnnouncementBanner onNavigate={navigate} />

      {/* Sticky Top Navigation */}
      <Navigation currentPath={normalizedPath} onNavigate={navigate} />

      {/* Main Content Area with Smooth View Transitions */}
      <main className="flex-1 w-full max-w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={normalizedPath}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-full min-w-0"
          >
            <Suspense fallback={<PageLoadingFallback />}>
              {renderCurrentView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Reusable Global Footer */}
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <FirestoreDataProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </FirestoreDataProvider>
  );
}
