import React, { useState, useEffect } from 'react';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { HomeView } from './views/HomeView';
import { DivisionView } from './views/DivisionView';
import { SWSView } from './views/SWSView';
import { U1View } from './views/U1View';
import { ITView } from './views/ITView';
import { TravelsView } from './views/TravelsView';
import { MartView } from './views/MartView';
import { CatalogView } from './views/CatalogView';
import { BookingView } from './views/BookingView';
import { CheckoutView } from './views/CheckoutView';
import { OrderConfirmationView } from './views/OrderConfirmationView';
import { OrderLookupView } from './views/OrderLookupView';
import { AboutView } from './views/AboutView';
import { PortfolioView } from './views/PortfolioView';
import { ContactView } from './views/ContactView';
import { LegalPageView } from './views/LegalPageView';
import { NotFoundView } from './views/NotFoundView';
import { LoginView } from './views/auth/LoginView';
import { RegisterView } from './views/auth/RegisterView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { AccountLayout } from './views/account/AccountLayout';
import { DivisionId, LegalPolicyType } from './types';
import { DIVISIONS } from './config/divisions';
import { CustomCursor } from './components/motion/CustomCursor';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminLayout } from './views/admin/AdminLayout';
import { CartDrawer } from './components/cart/CartDrawer';
import { AnnouncementBanner } from './components/layout/AnnouncementBanner';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

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

  // Normalize path
  const normalizedPath = currentPath.toLowerCase().replace(/\/$/, '') || '/';

  // Determine current division from path
  const divisionKey = (Object.keys(DIVISIONS) as DivisionId[]).find(
    (key) => DIVISIONS[key].route === normalizedPath
  );

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
      return <LoginView onNavigate={navigate} />;
    }

    if (normalizedPath === '/register') {
      return <RegisterView onNavigate={navigate} />;
    }

    if (normalizedPath === '/forgot-password') {
      return <ForgotPasswordView onNavigate={navigate} />;
    }

    // Customer Account Sub-Routes
    if (normalizedPath === '/account') {
      return <AccountLayout currentTab="overview" onNavigate={navigate} />;
    }

    if (normalizedPath === '/account/profile') {
      return <AccountLayout currentTab="profile" onNavigate={navigate} />;
    }

    if (normalizedPath === '/account/orders') {
      return <AccountLayout currentTab="orders" onNavigate={navigate} />;
    }

    if (normalizedPath === '/account/bookings') {
      return <AccountLayout currentTab="bookings" onNavigate={navigate} />;
    }

    if (normalizedPath === '/account/payments') {
      return <AccountLayout currentTab="payments" onNavigate={navigate} />;
    }

    if (normalizedPath === '/account/invoices') {
      return <AccountLayout currentTab="invoices" onNavigate={navigate} />;
    }

    if (normalizedPath === '/checkout') {
      return <CheckoutView onNavigate={navigate} />;
    }

    if (normalizedPath === '/orders' || normalizedPath === '/track-order') {
      return <OrderLookupView onNavigate={navigate} />;
    }

    if (normalizedPath.startsWith('/order/')) {
      const orderId = normalizedPath.replace('/order/', '').trim();
      return <OrderConfirmationView orderId={orderId} onNavigate={navigate} />;
    }

    if (normalizedPath === '/sws' || divisionKey === 'sws') {
      return <SWSView onNavigate={navigate} />;
    }

    if (normalizedPath === '/u1' || divisionKey === 'u1') {
      return <U1View onNavigate={navigate} />;
    }

    if (normalizedPath === '/it' || divisionKey === 'it') {
      return <ITView onNavigate={navigate} />;
    }

    if (normalizedPath === '/travels' || divisionKey === 'travels') {
      return <TravelsView onNavigate={navigate} />;
    }

    if (
      normalizedPath === '/mart' ||
      normalizedPath.startsWith('/mart/') ||
      divisionKey === 'mart'
    ) {
      return <MartView onNavigate={navigate} />;
    }

    if (normalizedPath === '/catalog' || normalizedPath.startsWith('/catalog/')) {
      const parts = normalizedPath.split('/').filter(Boolean);
      let initialProductId: string | undefined;
      let initialCategory: string | undefined;
      let initialDivision: string | undefined;

      if (parts[1] === 'product' && parts[2]) {
        initialProductId = parts[2];
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
        initialServiceId = parts[2];
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

    // Administrative Portal
    if (normalizedPath === '/admin' || normalizedPath.startsWith('/admin/')) {
      return <AdminLayout currentPath={normalizedPath} onNavigate={navigate} />;
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

  const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');

  if (isAdminRoute) {
    return (
      <AdminAuthProvider>
        <AdminLayout currentPath={normalizedPath} onNavigate={navigate} />
      </AdminAuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-[#0052FF] selection:text-white">
            {/* Interactive Magnetic Custom Cursor for Desktop */}
            <CustomCursor />

            {/* Global Cart Slide-Over Drawer */}
            <CartDrawer onNavigate={navigate} />

            {/* Live CMS Top Announcement / Promotional Banner */}
            <AnnouncementBanner onNavigate={navigate} />

            {/* Sticky Top Navigation */}
            <Navigation currentPath={normalizedPath} onNavigate={navigate} />

            {/* Main Content Area with Smooth View Transitions */}
            <main className="flex-1 w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={normalizedPath}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full"
                >
                  {renderCurrentView()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Reusable Global Footer */}
            <Footer onNavigate={navigate} />
          </div>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
