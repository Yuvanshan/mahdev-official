import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
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
import { BottomNavigation } from './components/layout/BottomNavigation';
import { testFirestoreConnection, initAppCheck } from './lib/firebase';
import { analyticsService } from './services/analyticsService';
import { catalogService } from './services/catalogService';
import { motion, AnimatePresence } from 'motion/react';

import { DivisionView } from './views/DivisionView';
import { DivisionComingSoonView } from './views/DivisionComingSoonView';
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
import { ProjectDetailView } from './views/ProjectDetailView';
import { ContactView } from './views/ContactView';
import { ServicesView } from './views/ServicesView';
import { ClientsView } from './views/ClientsView';
import { MilestonesView } from './views/MilestonesView';
import { DivisionsPageView } from './views/DivisionsPageView';
import { TestimonialsView } from './views/TestimonialsView';
import { CareersView } from './views/CareersView';
import { LegalPageView } from './views/LegalPageView';
import { NotFoundView } from './views/NotFoundView';
import { GalleryPageView } from './views/GalleryPageView';
import { LoginView } from './views/auth/LoginView';
import { RegisterView } from './views/auth/RegisterView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';
import { AccountLayout } from './views/account/AccountLayout';
import { AdminLayout } from './views/admin/AdminLayout';
import { MaintenanceView } from './views/MaintenanceView';
import { DocumentScrollProgress } from './components/motion/ParallelScroll';

function AppContent() {
  const {
    siteSettings,
    companySettings,
    isInitialLoading,
    isReady,
    syncProgress,
    syncStatus,
    error,
    refreshAll,
    products,
    services,
    divisions,
    isDivisionLoaded,
    loadDivisionData,
  } = useFirestoreDataContext();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.startsWith('#/') && hash.length > 2) {
      return hash.substring(1);
    }
    const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
    const directHashRoutes = [
      'admin', 'admin-login', 'adminportal', 'admin-portal',
      'sws', 'u1', 'it', 'travels', 'mart',
      'sws-events', 'sws-event-management', 'u1-studio', 'it-solutions', 'mahdev-travels', 'online-mart',
      'about', 'contact', 'services', 'divisions', 'projects', 'portfolio', 'gallery', 'milestones', 'testimonials', 'clients', 'companies', 'checkout', 'cart', 'catalog', 'track-order', 'order', 'orders'
    ];
    if (directHashRoutes.includes(cleanHash) || cleanHash.startsWith('admin/')) {
      return `/${cleanHash}${search}`;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const queryRoute = searchParams.get('route') || searchParams.get('p') || searchParams.get('path');
    if (queryRoute) {
      return (queryRoute.startsWith('/') ? queryRoute : `/${queryRoute}`) + search;
    }
    return (window.location.pathname || '/') + search;
  });

  // Dynamic favicon and document title synchronization from Firestore
  useEffect(() => {
    const brandName = companySettings?.name
      ? (companySettings.name.includes('(Pvt) Ltd') || companySettings.name.includes('Pvt Ltd') ? companySettings.name : `${companySettings.name} (Pvt) Ltd`)
      : (siteSettings?.siteName || 'Mahdev (Pvt) Ltd');
    const defaultTitle = `${brandName} - Creating Moments | Capturing Memories | Delivering Innovation`;

    if (
      !document.title ||
      document.title.includes('Mahdev Pvt Ltd – Creating') ||
      document.title.toLowerCase().includes('corporate eco') ||
      document.title.toLowerCase().includes('corporate ecosystem') ||
      document.title.toLowerCase().includes('corporate') ||
      document.title === 'Vite App' ||
      document.title.trim() === ''
    ) {
      document.title = defaultTitle;
    }

    const uploadedFavicon = siteSettings?.faviconUrl || companySettings?.faviconUrl;
    const effectiveFavicon =
      uploadedFavicon && uploadedFavicon.trim() !== ''
        ? uploadedFavicon
        : '/favicon.png';

    const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
    rels.forEach((rel) => {
      let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = effectiveFavicon;
    });
  }, [
    siteSettings?.faviconUrl,
    companySettings?.faviconUrl,
    siteSettings?.siteName,
    companySettings?.name,
  ]);

  // Verify Cloud Firestore connectivity and App Check on boot
  useEffect(() => {
    initAppCheck();
    testFirestoreConnection().then((res) => {
      console.info('[Firebase] Firestore Foundation Status:', res.message);
    });
  }, []);

  // Handle browser back/forward and hash navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.startsWith('#/') && hash.length > 2) {
        setCurrentPath(hash.substring(1));
        return;
      }
      const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
      const directHashRoutes = [
        'admin', 'admin-login', 'adminportal', 'admin-portal',
        'sws', 'u1', 'it', 'travels', 'mart',
        'sws-events', 'sws-event-management', 'u1-studio', 'it-solutions', 'mahdev-travels', 'online-mart',
        'about', 'about-us', 'contact', 'services', 'divisions', 'projects', 'portfolio', 'gallery', 'milestones', 'testimonials', 'clients', 'companies', 'checkout', 'cart', 'catalog', 'track-order', 'order', 'orders', 'terms-and-conditions', 'privacy-policy'
      ];
      if (directHashRoutes.includes(cleanHash) || cleanHash.startsWith('admin/')) {
        setCurrentPath(`/${cleanHash}${search}`);
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const queryRoute = searchParams.get('route') || searchParams.get('p') || searchParams.get('path');
      if (queryRoute) {
        setCurrentPath((queryRoute.startsWith('/') ? queryRoute : `/${queryRoute}`) + search);
        return;
      }
      setCurrentPath((window.location.pathname || '/') + search);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Clean navigation helper
  const navigate = (path: string) => {
    // In-page section scrolling if format is #section or /#section (excluding direct division routes)
    const isDirectDivisionOrAdmin = ['/#admin', '/#sws', '/#u1', '/#it', '/#travels', '/#mart'].includes(path.toLowerCase()) ||
      ['#admin', '#sws', '#u1', '#it', '#travels', '#mart'].includes(path.toLowerCase());

    if (path.startsWith('/#') && !isDirectDivisionOrAdmin) {
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

    let targetPath = path;
    if (targetPath.startsWith('#/')) {
      targetPath = targetPath.substring(1);
    } else if (targetPath.startsWith('#') && targetPath.length > 1 && !targetPath.includes('=')) {
      targetPath = `/${targetPath.substring(1)}`;
    }

    if (targetPath !== currentPath) {
      window.history.pushState({}, '', targetPath);
      setCurrentPath(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Extract path and query params for redirection
  const [basePathWithHash, searchParamsString] = (currentPath ? String(currentPath) : '/').split('?');
  let rawBase = basePathWithHash || '/';
  if (rawBase.startsWith('#/')) rawBase = rawBase.substring(1);
  else if (rawBase.startsWith('#') && rawBase.length > 1) rawBase = `/${rawBase.substring(1)}`;
  const basePath = rawBase.split('#')[0] || '/';
  const normalizedPath =
    (basePath.startsWith('/') ? basePath : `/${basePath}`).toLowerCase().replace(/\/$/, '') || '/';
  const searchParams = new URLSearchParams(
    searchParamsString || (typeof window !== 'undefined' ? window.location.search : '')
  );
  const redirectParam = searchParams.get('redirect') || undefined;

  const isAdminRoute = normalizedPath === '/admin' || normalizedPath.startsWith('/admin/');

  // Determine current division from path or known aliases
  const divisionKey =
    (Object.keys(DIVISIONS) as DivisionId[]).find((key) => {
      const route = DIVISIONS[key].route;
      if (route === normalizedPath) return true;
      if (
        key === 'sws' &&
        [
          '/sws-events',
          '/sws',
          '/events',
          '/event-management',
          '/sws-event-management',
          '/sws-event',
          '/events-management',
          '/decorations',
          '/decor',
        ].includes(normalizedPath)
      )
        return true;
      if (
        key === 'u1' &&
        ['/u1-studio', '/u1', '/studio', '/photography', '/cinema', '/u1-cinema'].includes(
          normalizedPath
        )
      )
        return true;
      if (
        key === 'it' &&
        ['/it-solutions', '/it', '/mahdev-it', '/solutions', '/software', '/it-services'].includes(
          normalizedPath
        )
      )
        return true;
      if (
        key === 'travels' &&
        ['/mahdev-travels', '/travels', '/tourism', '/tours', '/travel'].includes(normalizedPath)
      )
        return true;
      if (
        key === 'mart' &&
        ['/online-mart', '/mart', '/mahdev-mart', '/shop', '/store'].includes(normalizedPath)
      )
        return true;
      return false;
    }) ||
    (() => {
      const matched = divisions.find(
        (d) =>
          d.route === normalizedPath ||
          `/${d.slug}` === normalizedPath ||
          `/${d.id}` === normalizedPath
      );
      if (!matched) return undefined;
      const rawId = matched.id || matched.slug;
      if (rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events')
        return 'sws';
      if (rawId === 'u1' || rawId === 'u1-studio') return 'u1';
      if (rawId === 'it' || rawId === 'it-solutions') return 'it';
      if (rawId === 'travels' || rawId === 'mahdev-travels') return 'travels';
      if (rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart') return 'mart';
      return (rawId as DivisionId);
    })();

  // Live Firestore check for Coming Soon status across all divisions
  const isDivisionComingSoon = (rawDivId: string): boolean => {
    if (!rawDivId) return false;
    const normalized =
      rawDivId === 'u1' || rawDivId === 'u1-studio' || rawDivId === 'u1-cinema'
        ? 'u1'
        : rawDivId === 'it' || rawDivId === 'it-solutions' || rawDivId === 'mahdev-it'
        ? 'it'
        : rawDivId === 'travels' || rawDivId === 'mahdev-travels'
        ? 'travels'
        : rawDivId === 'mart' || rawDivId === 'online-mart' || rawDivId === 'mahdev-mart'
        ? 'mart'
        : rawDivId === 'sws' || rawDivId === 'sws-event-management' || rawDivId === 'sws-events'
        ? 'sws'
        : rawDivId;

    const matched = divisions.find(
      (d) =>
        d.id === rawDivId ||
        d.id === normalized ||
        d.slug === rawDivId ||
        d.slug === normalized ||
        (normalized === 'u1' && (d.id === 'u1-studio' || d.slug === 'u1-studio')) ||
        (normalized === 'it' && (d.id === 'it-solutions' || d.slug === 'it-solutions')) ||
        (normalized === 'travels' && (d.id === 'mahdev-travels' || d.slug === 'mahdev-travels')) ||
        (normalized === 'mart' && (d.id === 'online-mart' || d.slug === 'online-mart')) ||
        (normalized === 'sws' && (d.id === 'sws-event-management' || d.slug === 'sws-event-management'))
    );

    const isDefaultComingSoon = normalized === 'travels' || normalized === 'it' || normalized === 'mart';

    if (!matched) {
      try {
        const cachedStr = typeof window !== 'undefined' ? localStorage.getItem('mahdev_cached_divisions') : null;
        if (cachedStr) {
          const cachedDivs = JSON.parse(cachedStr);
          const cachedMatched = cachedDivs.find(
            (d: any) =>
              d.id === rawDivId ||
              d.id === normalized ||
              d.slug === rawDivId ||
              d.slug === normalized ||
              (normalized === 'u1' && (d.id === 'u1-studio' || d.slug === 'u1-studio')) ||
              (normalized === 'it' && (d.id === 'it-solutions' || d.slug === 'it-solutions')) ||
              (normalized === 'travels' && (d.id === 'mahdev-travels' || d.slug === 'mahdev-travels')) ||
              (normalized === 'mart' && (d.id === 'online-mart' || d.slug === 'online-mart')) ||
              (normalized === 'sws' && (d.id === 'sws-event-management' || d.slug === 'sws-event-management'))
          );
          if (cachedMatched) {
            return (cachedMatched as any).isComingSoon !== undefined
              ? !!(cachedMatched as any).isComingSoon
              : (cachedMatched as any).comingSoon !== undefined
              ? !!(cachedMatched as any).comingSoon
              : cachedMatched.status !== undefined
              ? cachedMatched.status === 'coming_soon'
              : isDefaultComingSoon;
          }
        }
      } catch {}
      return isDefaultComingSoon;
    }
    return (matched as any).isComingSoon !== undefined
      ? !!(matched as any).isComingSoon
      : (matched as any).comingSoon !== undefined
      ? !!(matched as any).comingSoon
      : (matched as any).status !== undefined
      ? (matched as any).status === 'coming_soon'
      : isDefaultComingSoon;
  };

  // Track page views and division views automatically
  useEffect(() => {
    analyticsService.trackPageView(normalizedPath, document.title, divisionKey);
    if (divisionKey) {
      analyticsService.trackDivisionView(divisionKey, DIVISIONS[divisionKey].name);
    }
  }, [normalizedPath, divisionKey]);

  // Priority division data hydration on navigation
  useEffect(() => {
    if (divisionKey && !isDivisionLoaded(divisionKey)) {
      loadDivisionData(divisionKey);
    }
  }, [divisionKey, isDivisionLoaded, loadDivisionData]);

  // 1. Maintenance Mode Screen: Live Firestore switch
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

    // Direct Order Confirmation & Lookup (/order/:id, /orders/:id, /track-order/:id, /order?id=..., /orders?id=..., /track-order?id=...)
    const orderQueryId = searchParams.get('id') || searchParams.get('orderId') || searchParams.get('order_id');

    if (
      normalizedPath.startsWith('/order/') ||
      normalizedPath.startsWith('/orders/') ||
      normalizedPath.startsWith('/track-order/')
    ) {
      const orderId = normalizedPath
        .replace(/^\/(order|orders|track-order)\//, '')
        .split('/')[0]
        .split('?')[0]
        .trim();
      return <OrderConfirmationView orderId={orderId} onNavigate={navigate} />;
    }

    if (normalizedPath === '/order' || normalizedPath === '/track-order') {
      if (orderQueryId) {
        return <OrderConfirmationView orderId={orderQueryId} onNavigate={navigate} />;
      }
      return <OrderLookupView onNavigate={navigate} />;
    }

    if (normalizedPath === '/orders' && orderQueryId) {
      return <OrderConfirmationView orderId={orderQueryId} onNavigate={navigate} />;
    }

    // Gallery Route (/gallery, /gallery/*, /media, /media/*)
    if (
      normalizedPath === '/gallery' ||
      normalizedPath.startsWith('/gallery/') ||
      normalizedPath === '/media' ||
      normalizedPath.startsWith('/media/')
    ) {
      const gallerySku =
        searchParams.get('sku') ||
        searchParams.get('mediaSku') ||
        searchParams.get('id') ||
        searchParams.get('item') ||
        undefined;
      return <GalleryPageView onNavigate={navigate} initialSku={gallerySku} />;
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

    if (normalizedPath === '/checkout') {
      return <CheckoutView onNavigate={navigate} />;
    }

    // Division direct routes: /sws, /u1, /it, /travels, /mart (and aliases)
    if (
      normalizedPath === '/sws' ||
      normalizedPath === '/sws-event-management' ||
      normalizedPath === '/sws-events' ||
      normalizedPath === '/event-management' ||
      normalizedPath === '/events' ||
      normalizedPath === '/divisions/sws' ||
      normalizedPath === '/division/sws' ||
      divisionKey === 'sws'
    ) {
      if (isDivisionComingSoon('sws')) {
        return <DivisionComingSoonView divisionId="sws" onNavigate={navigate} />;
      }
      return <SWSView onNavigate={navigate} />;
    }

    if (
      normalizedPath.startsWith('/sws/') ||
      normalizedPath.startsWith('/sws-event-management/') ||
      normalizedPath.startsWith('/sws-events/') ||
      normalizedPath.startsWith('/event-management/') ||
      normalizedPath.startsWith('/events/')
    ) {
      if (isDivisionComingSoon('sws')) {
        return <DivisionComingSoonView divisionId="sws" onNavigate={navigate} />;
      }
      const subSlug = normalizedPath
        .replace(/^\/(sws-event-management|sws-events|event-management|events|sws)\//, '')
        .trim();
      
      const swsService = services.find(
        (s) => s.division === 'sws' && (s.slug === subSlug || s.id === subSlug)
      );
      if (swsService) {
        return <BookingView initialDivision="sws" initialServiceId={swsService.id} />;
      }
      return <SWSView onNavigate={navigate} />;
    }

    if (
      normalizedPath === '/u1' ||
      normalizedPath === '/u1-studio' ||
      normalizedPath === '/u1-cinema' ||
      normalizedPath === '/studio' ||
      normalizedPath === '/photography' ||
      normalizedPath === '/cinema' ||
      normalizedPath === '/divisions/u1' ||
      normalizedPath === '/division/u1' ||
      divisionKey === 'u1'
    ) {
      if (isDivisionComingSoon('u1')) {
        return <DivisionComingSoonView divisionId="u1" onNavigate={navigate} />;
      }
      return <U1View onNavigate={navigate} />;
    }

    if (
      normalizedPath.startsWith('/u1/') ||
      normalizedPath.startsWith('/u1-studio/') ||
      normalizedPath.startsWith('/u1-cinema/') ||
      normalizedPath.startsWith('/studio/') ||
      normalizedPath.startsWith('/photography/') ||
      normalizedPath.startsWith('/cinema/')
    ) {
      if (isDivisionComingSoon('u1')) {
        return <DivisionComingSoonView divisionId="u1" onNavigate={navigate} />;
      }
      const subSlug = normalizedPath
        .replace(/^\/(u1-studio|u1-cinema|studio|photography|cinema|u1)\//, '')
        .trim();
      
      const u1Service = services.find(
        (s) => s.division === 'u1' && (s.slug === subSlug || s.id === subSlug)
      );
      if (u1Service) {
        return <BookingView initialDivision="u1" initialServiceId={u1Service.id} />;
      }
      return <U1View onNavigate={navigate} />;
    }

    if (
      normalizedPath === '/it' ||
      normalizedPath === '/it-solutions' ||
      normalizedPath === '/mahdev-it' ||
      normalizedPath === '/solutions' ||
      normalizedPath === '/software' ||
      normalizedPath === '/it-services' ||
      normalizedPath === '/divisions/it' ||
      normalizedPath === '/division/it' ||
      divisionKey === 'it'
    ) {
      if (isDivisionComingSoon('it')) {
        return <DivisionComingSoonView divisionId="it" onNavigate={navigate} />;
      }
      return <ITView onNavigate={navigate} />;
    }

    if (
      normalizedPath.startsWith('/it/') ||
      normalizedPath.startsWith('/it-solutions/') ||
      normalizedPath.startsWith('/mahdev-it/') ||
      normalizedPath.startsWith('/it-services/') ||
      normalizedPath.startsWith('/solutions/') ||
      normalizedPath.startsWith('/software/')
    ) {
      if (isDivisionComingSoon('it')) {
        return <DivisionComingSoonView divisionId="it" onNavigate={navigate} />;
      }
      const subSlug = normalizedPath
        .replace(/^\/(it-solutions|mahdev-it|it-services|solutions|software|it)\//, '')
        .trim();
      
      const itService = services.find(
        (s) => s.division === 'it' && (s.slug === subSlug || s.id === subSlug)
      );
      if (itService) {
        return <BookingView initialDivision="it" initialServiceId={itService.id} />;
      }
      return <ITView onNavigate={navigate} />;
    }

    if (
      normalizedPath === '/travels' ||
      normalizedPath === '/mahdev-travels' ||
      normalizedPath === '/tourism' ||
      normalizedPath === '/tours' ||
      normalizedPath === '/travel' ||
      normalizedPath === '/divisions/travels' ||
      normalizedPath === '/division/travels' ||
      divisionKey === 'travels'
    ) {
      if (isDivisionComingSoon('travels')) {
        return <DivisionComingSoonView divisionId="travels" onNavigate={navigate} />;
      }
      return <TravelsView onNavigate={navigate} />;
    }

    if (
      normalizedPath.startsWith('/travels/') ||
      normalizedPath.startsWith('/mahdev-travels/') ||
      normalizedPath.startsWith('/tourism/') ||
      normalizedPath.startsWith('/tours/') ||
      normalizedPath.startsWith('/travel/')
    ) {
      if (isDivisionComingSoon('travels')) {
        return <DivisionComingSoonView divisionId="travels" onNavigate={navigate} />;
      }
      const subSlug = normalizedPath
        .replace(/^\/(mahdev-travels|tourism|tours|travel|travels)\//, '')
        .trim();
      
      const travelsService = services.find(
        (s) => s.division === 'travels' && (s.slug === subSlug || s.id === subSlug)
      );
      if (travelsService) {
        return <BookingView initialDivision="travels" initialServiceId={travelsService.id} />;
      }
      return <TravelsView onNavigate={navigate} />;
    }

    if (
      normalizedPath === '/mart' ||
      normalizedPath === '/online-mart' ||
      normalizedPath === '/mahdev-mart' ||
      normalizedPath === '/shop' ||
      normalizedPath === '/store' ||
      normalizedPath === '/divisions/mart' ||
      normalizedPath === '/division/mart' ||
      divisionKey === 'mart'
    ) {
      if (isDivisionComingSoon('mart')) {
        return <DivisionComingSoonView divisionId="mart" onNavigate={navigate} />;
      }
      if (
        (normalizedPath.startsWith('/mart/') && normalizedPath !== '/mart') ||
        (normalizedPath.startsWith('/online-mart/') && normalizedPath !== '/online-mart') ||
        (normalizedPath.startsWith('/mahdev-mart/') && normalizedPath !== '/mahdev-mart') ||
        (normalizedPath.startsWith('/shop/') && normalizedPath !== '/shop') ||
        (normalizedPath.startsWith('/store/') && normalizedPath !== '/store')
      ) {
        const subSlug = normalizedPath
          .replace(/^\/(online-mart|mahdev-mart|shop|store|mart)\//, '')
          .trim();
        const validSubsections = ['products', 'categories', 'cart', 'deals', 'popular', 'featured', 'all'];
        if (validSubsections.includes(subSlug)) {
          return <MartView onNavigate={navigate} />;
        }

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
      }
      return <MartView onNavigate={navigate} />;
    }

    // Dynamic Direct Product Routes (/products/{slug} or /product/{slug})
    if (normalizedPath.startsWith('/products/') || normalizedPath.startsWith('/product/')) {
      const slug = normalizedPath.replace(/^\/(products|product)\//, '').trim();
      const cleanSlug = slug.toLowerCase();
      const foundProduct =
        products.find(
          (p) =>
            p.slug?.toLowerCase() === cleanSlug ||
            p.id?.toLowerCase() === cleanSlug ||
            (p as any).sku?.toLowerCase() === cleanSlug
        ) ||
        catalogService.getProductBySlug(slug) ||
        catalogService.getProductById(slug);

      if (!foundProduct) {
        if (isInitialLoading) {
          return (
            <div className="min-h-screen bg-slate-50 py-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          );
        }
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
      const cleanSlug = slug.toLowerCase();
      const foundService = services.find(
        (s) =>
          s.slug?.toLowerCase() === cleanSlug ||
          s.id?.toLowerCase() === cleanSlug ||
          (s as any).sku?.toLowerCase() === cleanSlug
      );

      if (!foundService) {
        if (isInitialLoading) {
          return (
            <div className="min-h-screen bg-slate-50 py-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
            </div>
          );
        }
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

    // Dynamic Project Detail Routes (/project/{slug}, /projects/{slug}, /work/{slug}, /portfolio/{slug})
    if (
      normalizedPath.startsWith('/project/') ||
      (normalizedPath.startsWith('/projects/') && normalizedPath !== '/projects') ||
      (normalizedPath.startsWith('/work/') && normalizedPath !== '/work') ||
      (normalizedPath.startsWith('/portfolio/') && normalizedPath !== '/portfolio')
    ) {
      const slug = normalizedPath.replace(/^\/(project|projects|work|portfolio)\//, '').trim();
      return <ProjectDetailView projectSlugOrId={slug} onNavigate={navigate} />;
    }

    // Dynamic Divisions Routes (/divisions/{id} or /division/{id})
    if (normalizedPath.startsWith('/divisions/') || normalizedPath.startsWith('/division/')) {
      const divSlug = normalizedPath.replace(/^\/(divisions|division)\//, '').trim();
      const matchedDiv =
        (Object.keys(DIVISIONS) as DivisionId[]).find((key) => key === divSlug) ||
        divisions.find(
          (d) =>
            d.slug === divSlug ||
            d.id === divSlug ||
            d.route === `/${divSlug}` ||
            (typeof d.route === 'string' && d.route.replace(/^\//, '') === divSlug)
        );

      if (
        matchedDiv ||
        [
          'sws',
          'sws-event-management',
          'sws-events',
          'u1',
          'u1-studio',
          'it',
          'it-solutions',
          'travels',
          'mart',
          'online-mart',
        ].includes(divSlug)
      ) {
        const rawId = typeof matchedDiv === 'string' ? matchedDiv : (matchedDiv?.id || divSlug);
        const divId =
          rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
            ? 'sws'
            : rawId === 'u1' || rawId === 'u1-studio'
            ? 'u1'
            : rawId === 'it' || rawId === 'it-solutions'
            ? 'it'
            : rawId === 'travels' || rawId === 'mahdev-travels'
            ? 'travels'
            : rawId === 'mart' || rawId === 'online-mart'
            ? 'mart'
            : (rawId as DivisionId);

        if (isDivisionComingSoon(divId)) {
          return <DivisionComingSoonView divisionId={divId} onNavigate={navigate} />;
        }

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
      if (isDivisionComingSoon(divisionKey)) {
        return <DivisionComingSoonView divisionId={divisionKey} onNavigate={navigate} />;
      }
      return <DivisionView divisionId={divisionKey} onNavigate={navigate} />;
    }

    if (legalPolicyType) {
      return <LegalPageView policyType={legalPolicyType} onNavigate={navigate} />;
    }

    switch (normalizedPath) {
      case '/':
        return <HomeView onNavigate={navigate} />;
      case '/admin':
      case '/admin-login':
      case '/adminlogin':
      case '/adminportal':
      case '/admin-portal':
        return <AdminLayout currentPath={normalizedPath} onNavigate={navigate} />;
      case '/sws':
      case '/sws-events':
      case '/sws-event-management':
      case '/divisions/sws':
      case '/division/sws':
        return isDivisionComingSoon('sws') ? <DivisionComingSoonView divisionId="sws" onNavigate={navigate} /> : <SWSView onNavigate={navigate} />;
      case '/u1':
      case '/u1-studio':
      case '/u1-cinema':
      case '/divisions/u1':
      case '/division/u1':
        return isDivisionComingSoon('u1') ? <DivisionComingSoonView divisionId="u1" onNavigate={navigate} /> : <U1View onNavigate={navigate} />;
      case '/it':
      case '/it-solutions':
      case '/mahdev-it':
      case '/divisions/it':
      case '/division/it':
        return isDivisionComingSoon('it') ? <DivisionComingSoonView divisionId="it" onNavigate={navigate} /> : <ITView onNavigate={navigate} />;
      case '/travels':
      case '/mahdev-travels':
      case '/divisions/travels':
      case '/division/travels':
        return isDivisionComingSoon('travels') ? <DivisionComingSoonView divisionId="travels" onNavigate={navigate} /> : <TravelsView onNavigate={navigate} />;
      case '/mart':
      case '/online-mart':
      case '/mahdev-mart':
      case '/divisions/mart':
      case '/division/mart':
        return isDivisionComingSoon('mart') ? <DivisionComingSoonView divisionId="mart" onNavigate={navigate} /> : <MartView onNavigate={navigate} />;
      case '/divisions':
        return <DivisionsPageView onNavigate={navigate} />;
      case '/services':
      case '/featured-services':
        return <ServicesView onNavigate={navigate} />;
      case '/about':
      case '/about-us':
      case '/company':
        return <AboutView onNavigate={navigate} />;
      case '/gallery':
      case '/media':
        return (
          <GalleryPageView
            onNavigate={navigate}
            initialSku={
              searchParams.get('sku') ||
              searchParams.get('mediaSku') ||
              searchParams.get('id') ||
              searchParams.get('item') ||
              undefined
            }
          />
        );
      case '/projects':
      case '/portfolio':
      case '/work':
        if (searchParams.get('sku') || searchParams.get('mediaSku')) {
          return (
            <GalleryPageView
              onNavigate={navigate}
              initialSku={searchParams.get('sku') || searchParams.get('mediaSku') || undefined}
            />
          );
        }
        return <PortfolioView onNavigate={navigate} />;
      case '/milestones':
      case '/journey':
        return <MilestonesView onNavigate={navigate} />;
      case '/testimonials':
      case '/reviews':
        return <TestimonialsView onNavigate={navigate} />;
      case '/careers':
      case '/jobs':
        return <CareersView onNavigate={navigate} />;
      case '/clients':
      case '/partners':
      case '/companies':
        return <ClientsView onNavigate={navigate} />;
      case '/contact':
        return <ContactView onNavigate={navigate} />;
      default:
        return <NotFoundView onNavigate={navigate} />;
    }
  };

  // Keep the primary navigation visible across the site, including coming-soon
  // division routes, while the division-specific notice still remains in place.
  const isStandaloneComingSoon = Boolean(divisionKey && isDivisionComingSoon(divisionKey));

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Document Scroll Progress Bar */}
      {!isStandaloneComingSoon && <DocumentScrollProgress />}

      {/* Interactive Magnetic Custom Cursor for Desktop */}
      {!isStandaloneComingSoon && <CustomCursor />}

      {/* Global Cart Slide-Over Drawer */}
      {!isStandaloneComingSoon && <CartDrawer onNavigate={navigate} />}

      {/* Sticky Top Navigation */}
      <Navigation currentPath={normalizedPath} onNavigate={navigate} />

      {/* Main Content Area with Smooth View Transitions */}
      <main className="flex-1 w-full max-w-full min-w-0" aria-live="polite">
        <AnimatePresence mode="wait">
          {/* Fade only on first paint; avoid a layout-shifting entrance while Firestore hydrates. */}
          <motion.div
            key={normalizedPath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-full min-w-0"
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <BottomNavigation currentPath={normalizedPath} onNavigate={navigate} />

      {/* Reusable Global Footer */}
      <Footer onNavigate={navigate} currentPath={normalizedPath} />
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
            <Analytics />
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </FirestoreDataProvider>
  );
}
