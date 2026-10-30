import React, { lazy as reactLazy, Suspense, useState, useEffect, useLayoutEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Navigation } from './components/layout/Navigation';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DivisionId, LegalPolicyType } from './types';
import { DIVISIONS, FORCED_COMING_SOON_DIVISIONS } from './config/divisions';
import { CustomCursor } from './components/motion/CustomCursor';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WhatsAppWidget } from './components/common/WhatsAppWidget';
import { SeasonalThemeProvider } from './context/SeasonalThemeContext';
import { SeasonalOverlay } from './components/seasonal/SeasonalOverlay';
import { SeasonalWishesPopup } from './components/seasonal/SeasonalWishesPopup';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { FirestoreDataProvider, useFirestoreDataContext } from './context/FirestoreDataContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { AnnouncementBanner } from './components/layout/AnnouncementBanner';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { initAppCheck } from './lib/firebase';
import { analyticsService } from './services/analyticsService';
import { catalogService } from './services/catalogService';
import { canonicalizeDivisionRoute } from './services/firestore/divisions';
import { getPageTitle } from './config/pageTitles';
import { SITE_NAME } from './config/site';
import type { OnlineBookingKind } from './utils/onlineBooking';
import {
  ADMIN_PORTAL_PATH,
  canonicalizeAdminPath,
  isAdminPortalPath,
  isRetiredAdminPath,
} from './config/adminRoutes';
import { motion, AnimatePresence } from 'motion/react';

const CHUNK_RECOVERY_KEY = 'mahdev:chunk-load-recovery';

function lazy<T extends React.ComponentType<any>>(
  load: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return reactLazy(() =>
    load().then((module) => {
      try {
        sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
      } catch {
        // Session storage may be unavailable in restricted browser contexts.
      }
      return module;
    })
  );
}

type RouteLoadingFallbackProps = {
  path: string;
};

const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({ path }) => {
  const routeHeadlines: Record<string, string> = {
    '/': 'Creating moments... Capturing memories... Delivering innovation...',
    '/sws': 'We Create Moments... You Make Memories...',
    '/u1': 'Every Frame Tells a Story...',
    '/it': 'Enterprise Software, Cloud & AI Engineered for Uncompromising Scale',
    '/travels': 'Bespoke Expeditions Across Sri Lanka',
    '/mart': 'Curated Event & Home Decor, Ambient Lighting & Smart Tech',
  };
  const divisionPath = canonicalizeDivisionRoute(path);
  const heroHeadline = routeHeadlines[divisionPath];

  if (heroHeadline) {
    const showContentShimmer = ['/', '/sws', '/u1'].includes(divisionPath);

    return (
      <>
        <section
          role="status"
          aria-busy="true"
          aria-label="Loading page"
          className="flex min-h-[680px] items-center bg-gradient-to-br from-[#061033] via-[#0b1c4c] to-[#0052FF] px-5 py-20 text-white sm:min-h-[740px] sm:px-8 lg:min-h-[min(820px,calc(100svh-5rem))]"
        >
          <div className="mx-auto w-full max-w-7xl">
            <motion.h1
              initial={{ opacity: 0.7, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl font-editorial text-4xl font-medium leading-tight tracking-tight sm:text-6xl lg:text-7xl"
            >
              {heroHeadline}
            </motion.h1>
          </div>
        </section>
        {showContentShimmer && (
          <section
            role="status"
            aria-busy="true"
            aria-label="Loading page content"
            className="space-y-10 bg-slate-50 px-4 py-10 sm:px-8 sm:py-14"
          >
            {[0, 1].map((section) => (
              <div className="mx-auto max-w-7xl animate-pulse" key={section}>
                <div className="mb-6 space-y-3">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-8 w-2/3 max-w-xl rounded-lg bg-slate-200" />
                  <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((card) => (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" key={card}>
                      <div className="aspect-[4/3] bg-slate-200" />
                      <div className="space-y-3 p-5">
                        <div className="h-5 w-2/3 rounded bg-slate-200" />
                        <div className="h-3 w-full rounded bg-slate-100" />
                        <div className="h-3 w-4/5 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </>
    );
  }

  const isAbout = path === '/about' || path === '/about-us';
  const isLegal = [
    '/terms-and-conditions',
    '/privacy-policy',
    '/refund-policy',
    '/shipping-policy',
    '/cookie-policy',
  ].includes(path);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page"
      className="min-h-screen bg-slate-50 pt-20 sm:pt-24"
    >
      <section className="border-b border-slate-200 bg-white py-10 sm:py-14">
        <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
          <div className="mb-6 h-4 w-40 rounded bg-slate-200" />
          <div className="h-10 w-3/4 max-w-2xl rounded-xl bg-slate-200" />
          <div className="mt-4 h-5 w-full max-w-3xl rounded bg-slate-100" />
          <div className="mt-2 h-5 w-2/3 max-w-2xl rounded bg-slate-100" />
        </div>
      </section>
      <main className="mx-auto w-full max-w-7xl animate-pulse px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {isAbout ? (
          <div className="space-y-10">
            <div className="h-56 rounded-3xl bg-white" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-48 rounded-2xl bg-white" />
              <div className="h-48 rounded-2xl bg-white" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div className="h-40 rounded-2xl bg-white" key={item} />
              ))}
            </div>
          </div>
        ) : isLegal ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="hidden h-96 rounded-2xl bg-white lg:col-span-4 lg:block" />
            <div className="space-y-5 lg:col-span-8">
              {[0, 1, 2, 3, 4].map((item) => (
                <div className="space-y-4 rounded-2xl bg-white p-6" key={item}>
                  <div className="h-6 w-1/3 rounded bg-slate-200" />
                  <div className="h-4 rounded bg-slate-100" />
                  <div className="h-4 w-5/6 rounded bg-slate-100" />
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="h-48 rounded-3xl bg-white" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-48 rounded-2xl bg-white" />
              <div className="h-48 rounded-2xl bg-white" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const HomeView = lazy(() => import('./views/HomeView').then((module) => ({ default: module.HomeView })));
const DivisionView = lazy(() => import('./views/DivisionView').then((module) => ({ default: module.DivisionView })));
const DivisionComingSoonView = lazy(() => import('./views/DivisionComingSoonView').then((module) => ({ default: module.DivisionComingSoonView })));
const SWSView = lazy(() => import('./views/SWSView').then((module) => ({ default: module.SWSView })));
const U1View = lazy(() => import('./views/U1View').then((module) => ({ default: module.U1View })));
const ITView = lazy(() => import('./views/ITView').then((module) => ({ default: module.ITView })));
const TravelsView = lazy(() => import('./views/TravelsView').then((module) => ({ default: module.TravelsView })));
const MartView = lazy(() => import('./views/MartView').then((module) => ({ default: module.MartView })));
const CatalogView = lazy(() => import('./views/CatalogView').then((module) => ({ default: module.CatalogView })));
const BookingView = lazy(() => import('./views/BookingView').then((module) => ({ default: module.BookingView })));
const CheckoutView = lazy(() => import('./views/CheckoutView').then((module) => ({ default: module.CheckoutView })));
const OrderConfirmationView = lazy(() => import('./views/OrderConfirmationView').then((module) => ({ default: module.OrderConfirmationView })));
const ConfirmOrderView = lazy(() => import('./views/ConfirmOrderView').then((module) => ({ default: module.ConfirmOrderView })));
const BookOnlineView = lazy(() => import('./views/BookOnlineView').then((module) => ({ default: module.BookOnlineView })));
const OrderLookupView = lazy(() => import('./views/OrderLookupView').then((module) => ({ default: module.OrderLookupView })));
const AboutView = lazy(() => import('./views/AboutView').then((module) => ({ default: module.AboutView })));
const PortfolioView = lazy(() => import('./views/PortfolioView').then((module) => ({ default: module.PortfolioView })));
const ProjectDetailView = lazy(() => import('./views/ProjectDetailView').then((module) => ({ default: module.ProjectDetailView })));
const ContactView = lazy(() => import('./views/ContactView').then((module) => ({ default: module.ContactView })));
const ExploreAllView = lazy(() => import('./views/ExploreAllView').then((module) => ({ default: module.ExploreAllView })));
const ServiceDetailView = lazy(() => import('./views/ServiceDetailView').then((module) => ({ default: module.ServiceDetailView })));
const ClientsView = lazy(() => import('./views/ClientsView').then((module) => ({ default: module.ClientsView })));
const MilestonesView = lazy(() => import('./views/MilestonesView').then((module) => ({ default: module.MilestonesView })));
const DivisionsPageView = lazy(() => import('./views/DivisionsPageView').then((module) => ({ default: module.DivisionsPageView })));
const TestimonialsView = lazy(() => import('./views/TestimonialsView').then((module) => ({ default: module.TestimonialsView })));
const CareersView = lazy(() => import('./views/CareersView').then((module) => ({ default: module.CareersView })));
const PromotionsView = lazy(() => import('./views/PromotionsView').then((module) => ({ default: module.PromotionsView })));
const LegalPageView = lazy(() => import('./views/LegalPageView').then((module) => ({ default: module.LegalPageView })));
const NotFoundView = lazy(() => import('./views/NotFoundView').then((module) => ({ default: module.NotFoundView })));
const CmsPageView = lazy(() => import('./views/CmsPageView').then((module) => ({ default: module.CmsPageView })));
const InsightsView = lazy(() => import('./views/InsightsView').then((module) => ({ default: module.InsightsView })));
const GalleryPageView = lazy(() => import('./views/GalleryPageView').then((module) => ({ default: module.GalleryPageView })));
const LoginView = lazy(() => import('./views/auth/LoginView').then((module) => ({ default: module.LoginView })));
const RegisterView = lazy(() => import('./views/auth/RegisterView').then((module) => ({ default: module.RegisterView })));
const ForgotPasswordView = lazy(() => import('./views/auth/ForgotPasswordView').then((module) => ({ default: module.ForgotPasswordView })));
const AuthActionView = lazy(() => import('./views/auth/AuthActionView').then((module) => ({ default: module.AuthActionView })));
const AccountLayout = lazy(() => import('./views/account/AccountLayout').then((module) => ({ default: module.AccountLayout })));
const CompleteProfileView = lazy(() => import('./views/account/CompleteProfileView').then((module) => ({ default: module.CompleteProfileView })));
const AdminLayout = lazy(() => import('./views/admin/AdminLayout').then(({ AdminLayout }) => ({ default: AdminLayout })));
const MaintenanceView = lazy(() => import('./views/MaintenanceView').then((module) => ({ default: module.MaintenanceView })));
import { DocumentScrollProgress } from './components/motion/ParallelScroll';

function AppContent() {
  const {
    siteSettings,
    companySettings,
    isInitialLoading,
    isFetching,
    isProductsLoading,
    isServicesLoading,
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
    loadRouteData,
  } = useFirestoreDataContext();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    if (hash.startsWith('#/') && hash.length > 2) {
      return canonicalizeAdminPath(hash.substring(1));
    }
    const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
    const directHashRoutes = [
      'admin-yuvan1709',
      'sws', 'u1', 'it', 'travels', 'mart',
      'sws-events', 'sws-event-management', 'u1-studio', 'it-solutions', 'mahdev-travels', 'online-mart',
      'about', 'contact', 'services', 'divisions', 'projects', 'portfolio', 'gallery', 'milestones', 'testimonials', 'clients', 'companies', 'checkout', 'cart', 'catalog', 'track-order', 'order', 'orders'
    ];
    if (
      directHashRoutes.includes(cleanHash) ||
      cleanHash.startsWith('admin-yuvan1709/')
    ) {
      return `${canonicalizeAdminPath(`/${cleanHash}`)}${search}`;
    }
    const searchParams = new URLSearchParams(window.location.search);
    const queryRoute = searchParams.get('route') || searchParams.get('p') || searchParams.get('path');
    if (queryRoute) {
      return canonicalizeAdminPath(queryRoute.startsWith('/') ? queryRoute : `/${queryRoute}`) + search;
    }
    return canonicalizeAdminPath(window.location.pathname || '/') + search;
  });

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      Boolean(target.closest('input, textarea, select, [contenteditable="true"], [data-allow-context-menu]'));

    const blockContextMenu = (event: MouseEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const blockCopy = (event: ClipboardEvent) => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    // Block DevTools / view-source shortcuts across Chrome, Edge, Firefox, Safari and Opera.
    // Uses event.code because on macOS the Option key changes event.key (e.g. Option+I => "ˆ").
    const blockDevToolsShortcuts = (event: KeyboardEvent) => {
      const { code } = event;
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      const devToolsModifier = (event.ctrlKey && event.shiftKey) || (event.metaKey && event.altKey);

      const isDevToolsShortcut =
        code === 'F12' ||
        // Ctrl+Shift+X (Windows/Linux) or Cmd+Option+X (macOS):
        // I = DevTools, J = console, C = inspect element, K = Firefox console,
        // E = Firefox network, M = Firefox responsive mode, U = Safari view source
        (devToolsModifier && ['KeyI', 'KeyJ', 'KeyC', 'KeyK', 'KeyE', 'KeyM', 'KeyU'].includes(code)) ||
        // Ctrl+U / Cmd+U = view page source
        (ctrlOrCmd && !event.shiftKey && !event.altKey && code === 'KeyU');

      if (isDevToolsShortcut) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu, true);
    document.addEventListener('copy', blockCopy, true);
    window.addEventListener('keydown', blockDevToolsShortcuts, true);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu, true);
      document.removeEventListener('copy', blockCopy, true);
      window.removeEventListener('keydown', blockDevToolsShortcuts, true);
    };
  }, []);

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

  // Initialize App Check once; database health is checked only from diagnostics.
  useEffect(() => {
    initAppCheck();
  }, []);

  // Handle browser back/forward and hash navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.startsWith('#/') && hash.length > 2) {
        window.dispatchEvent(new Event('mahdev:routechange'));
        setCurrentPath(canonicalizeAdminPath(hash.substring(1)));
        return;
      }
      const cleanHash = hash.replace(/^#\/?/, '').toLowerCase();
      const directHashRoutes = [
        'admin-yuvan1709',
        'sws', 'u1', 'it', 'travels', 'mart',
        'sws-events', 'sws-event-management', 'u1-studio', 'it-solutions', 'mahdev-travels', 'online-mart',
        'about', 'about-us', 'contact', 'services', 'divisions', 'projects', 'portfolio', 'gallery', 'milestones', 'testimonials', 'clients', 'companies', 'checkout', 'cart', 'catalog', 'track-order', 'order', 'orders', 'promotion', 'promotions', 'terms-and-conditions', 'privacy-policy', 'refund-policy', 'shipping-policy', 'cookie-policy'
      ];
      if (
        directHashRoutes.includes(cleanHash) ||
        cleanHash.startsWith('admin-yuvan1709/')
      ) {
        window.dispatchEvent(new Event('mahdev:routechange'));
        setCurrentPath(canonicalizeAdminPath(`/${cleanHash}`) + search);
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);
      const queryRoute = searchParams.get('route') || searchParams.get('p') || searchParams.get('path');
      if (queryRoute) {
        window.dispatchEvent(new Event('mahdev:routechange'));
        setCurrentPath(canonicalizeAdminPath(queryRoute.startsWith('/') ? queryRoute : `/${queryRoute}`) + search);
        return;
      }
      window.dispatchEvent(new Event('mahdev:routechange'));
      setCurrentPath(canonicalizeAdminPath(window.location.pathname || '/') + search);
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
    const queryIndex = targetPath.indexOf('?');
    const targetRoute = queryIndex >= 0 ? targetPath.slice(0, queryIndex) : targetPath;
    const targetQuery = queryIndex >= 0 ? targetPath.slice(queryIndex) : '';
    targetPath = `${canonicalizeAdminPath(targetRoute)}${targetQuery}`;

    if (targetPath !== currentPath) {
      window.dispatchEvent(new Event('mahdev:routechange'));
      window.history.pushState({}, '', targetPath);
      setCurrentPath(targetPath);
    }
  };

  // Extract path and query params for redirection
  const [basePathWithHash, searchParamsString] = (currentPath ? String(currentPath) : '/').split('?');
  let rawBase = basePathWithHash || '/';
  if (rawBase.startsWith('#/')) rawBase = rawBase.substring(1);
  else if (rawBase.startsWith('#') && rawBase.length > 1) rawBase = `/${rawBase.substring(1)}`;
  const basePath = rawBase.split('#')[0] || '/';
  // Legacy category links used "/services%{slug}", which Vercel rejects as a malformed URL
  // (400). Redirect them, including the "%25" form, to the valid /services/category/{slug}.
  const legacyCategoryPath = basePath.replace(
    /^\/(?:services|gallery)%(?:25)?([a-z0-9-]+)$/i,
    (_match, slug: string) => `/services/category/${slug.toLowerCase()}`
  );
  const normalizedPath = canonicalizeAdminPath(canonicalizeDivisionRoute(legacyCategoryPath));
  // Set the tab title on every route change ("Careers - Mahdev (Pvt) Ltd"), so a page
  // without its own SEOHead never keeps the previous page's title. A layout effect runs
  // before the pages' own effects, so pages with a specific title (a service, project
  // or article) still replace this.
  useLayoutEffect(() => {
    document.title = getPageTitle(normalizedPath) ?? SITE_NAME;
  }, [normalizedPath]);
  useEffect(() => {
    if (normalizedPath === basePath || typeof window === 'undefined') return;
    const canonicalUrl = `${normalizedPath}${searchParamsString ? `?${searchParamsString}` : ''}`;
    window.history.replaceState({}, '', canonicalUrl);
    setCurrentPath(canonicalUrl);
  }, [basePath, normalizedPath, searchParamsString]);
  const lastDataRouteRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (lastDataRouteRef.current === null) {
      lastDataRouteRef.current = normalizedPath;
      return;
    }
    if (lastDataRouteRef.current === normalizedPath) return;

    lastDataRouteRef.current = normalizedPath;
    // The admin portal loads its own data once the admin session is authenticated.
    if (isAdminPortalPath(normalizedPath)) return;

    void loadRouteData(normalizedPath).catch((routeError: unknown) => {
      console.error(`[App] Could not load data for route ${normalizedPath}:`, routeError);
    });
  }, [normalizedPath, loadRouteData]);
  const searchParams = new URLSearchParams(
    searchParamsString || (typeof window !== 'undefined' ? window.location.search : '')
  );
  const redirectParam = searchParams.get('redirect') || undefined;

  const isAdminRoute = isAdminPortalPath(normalizedPath);

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

    // Divisions not launched yet always show "Coming soon" (src/config/divisions.ts).
    if (FORCED_COMING_SOON_DIVISIONS.has(normalized)) return true;

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

    // Default when the record has no status: IT and Mart live, Travels coming soon.
    const isDefaultComingSoon = normalized === 'travels';

    if (!matched) {
      try {
        const cachedStr = typeof window !== 'undefined' ? sessionStorage.getItem('mahdev_cached_divisions') : null;
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
      } catch { }
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

  // Priority division data hydration on navigation. Attempt once per division
  // visit: if a load fails, the loaded flag stays false and isDivisionLoaded
  // changes identity, which would otherwise re-run this effect in a loop.
  const attemptedDivisionRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!divisionKey) {
      attemptedDivisionRef.current = null;
      return;
    }
    if (attemptedDivisionRef.current === divisionKey || isDivisionLoaded(divisionKey)) return;
    attemptedDivisionRef.current = divisionKey;
    void Promise.resolve(loadDivisionData(divisionKey)).catch((error: unknown) => {
      console.error(`[App] Could not load ${divisionKey} division data:`, error);
    });
  }, [divisionKey, isDivisionLoaded, loadDivisionData]);

  // 1. Maintenance Mode Screen: Live Firestore switch
  const isMaintenanceActive = Boolean(
    siteSettings?.maintenance?.enabled ??
    siteSettings?.maintenanceMode ??
    siteSettings?.enableMaintenanceMode
  );

  if (isMaintenanceActive && !isAdminRoute) {
    return <MaintenanceView onAdminLogin={() => navigate(ADMIN_PORTAL_PATH)} />;
  }

  // Admin routes handle their own layout & auth flow
  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <AdminLayout currentPath={normalizedPath} onNavigate={navigate} />
      </Suspense>
    );
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
    // Design order confirmation link shared by the admin (/confirm-order/{token})
    if (normalizedPath.startsWith('/confirm-order/')) {
      // Read from the original path: route normalising lowercases, and tokens are case-sensitive.
      const token = basePath.replace(/^\/+confirm-order\//i, '').split('/')[0];
      return <ConfirmOrderView token={token} onNavigate={navigate} />;
    }

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

    // Links from account emails (verify email, reset password).
    if (normalizedPath === '/auth/action') {
      return <AuthActionView onNavigate={navigate} />;
    }

    // Protected Customer Account Routes
    if (normalizedPath === '/account/complete') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/complete">
          <CompleteProfileView onNavigate={navigate} redirectPath={redirectParam || '/account'} />
        </ProtectedRoute>
      );
    }

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

    if (normalizedPath === '/account/activity') {
      return (
        <ProtectedRoute onNavigate={navigate} currentPath="/account/activity">
          <AccountLayout currentTab="activity" onNavigate={navigate} />
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

    const categoryRoute = normalizedPath.match(/^\/services\/category\/([a-z0-9-]+)$/);
    if (categoryRoute) {
      return (
        <ExploreAllView
          onNavigate={navigate}
          initialCategorySlug={categoryRoute[1]}
          initialPage="services"
        />
      );
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
        searchParams.get('title') ||
        undefined;
      return gallerySku
        ? <GalleryPageView onNavigate={navigate} initialSku={gallerySku} />
        : <ExploreAllView onNavigate={navigate} initialPage="gallery" />;
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
        if (isInitialLoading || isProductsLoading || isFetching) {
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
      return <ServiceDetailView slug={slug} onNavigate={navigate} />;
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

        if (!found && !(isProductsLoading || isInitialLoading || isFetching)) {
          return (
            <NotFoundView
              onNavigate={navigate}
              resourceType="product"
              attemptedSlug={prodId}
            />
          );
        }
        initialProductId = found?.id || prodId;
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

    // "Book online" for the whole cart. Products are booked from the cart, so old
    // /book/product/{id} links open the cart booking too.
    if (/^\/+book\/(cart\/?$|product\/)/i.test(basePath)) {
      return <BookOnlineView key="cart" kind="cart" itemId="cart" onNavigate={navigate} />;
    }

    // "Book online" for one item: /book/service/{id}, /book/gallery/{id}
    const onlineBookingMatch = basePath.match(/^\/+book\/(service|gallery)\/([^/]+)/i);
    if (onlineBookingMatch) {
      // Read the id from the original path: route normalising lowercases, and ids can be mixed case.
      const kind = onlineBookingMatch[1].toLowerCase() as OnlineBookingKind;
      const itemId = decodeURIComponent(onlineBookingMatch[2]);
      // "Book online" switched off in the admin: services use the general booking wizard as before.
      if (siteSettings?.onlineBookingEnabled === false && kind === 'service') {
        const found = services.find((s) => s.id === itemId || s.slug === itemId);
        return (
          <BookingView
            initialServiceId={found?.id || itemId}
            initialDivision={found && typeof found.division === 'string' ? found.division : undefined}
          />
        );
      }
      return (
        <BookOnlineView
          key={`${kind}/${onlineBookingMatch[2]}`}
          kind={kind}
          itemId={itemId}
          onNavigate={navigate}
        />
      );
    }

    // General booking wizard: /book and /book/{division}
    if (normalizedPath === '/book' || normalizedPath.startsWith('/book/')) {
      const parts = normalizedPath.split('/').filter(Boolean);
      return <BookingView initialDivision={parts[1]} />;
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

    // Retired admin URLs (e.g. /admin) are a plain 404 and never hint at the portal path.
    if (isRetiredAdminPath(normalizedPath)) {
      return <NotFoundView onNavigate={navigate} />;
    }

    switch (normalizedPath) {
      case '/':
        return <HomeView onNavigate={navigate} />;
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
        return <ExploreAllView onNavigate={navigate} initialPage="services" />;
      case '/insights':
        return <InsightsView onNavigate={navigate} />;
      case '/about':
      case '/about-us':
      case '/company':
        return <AboutView onNavigate={navigate} />;
      case '/gallery':
      case '/media':
        return <ExploreAllView onNavigate={navigate} initialPage="gallery" />;
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
      case '/promotion':
      case '/promotions':
        return (
          <PromotionsView
            onNavigate={navigate}
            selectedOfferId={searchParams.get('offer') || undefined}
          />
        );
      case '/clients':
      case '/partners':
      case '/companies':
        return <ClientsView onNavigate={navigate} />;
      case '/contact':
        return <ContactView onNavigate={navigate} />;
      default:
        return <CmsPageView slug={normalizedPath.replace(/^\/+/, '')} onNavigate={navigate} />;
    }
  };

  // Keep the primary navigation visible across the site, including coming-soon
  // division routes, while the division-specific notice still remains in place.
  const isStandaloneComingSoon = Boolean(divisionKey && isDivisionComingSoon(divisionKey));
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Top Document Scroll Progress Bar */}
      {!isStandaloneComingSoon && <DocumentScrollProgress />}
      {!isAdminRoute && <SeasonalOverlay />}
      {!isAdminRoute && <SeasonalWishesPopup onNavigate={navigate} />}

      {/* Interactive Magnetic Custom Cursor for Desktop */}
      {!isStandaloneComingSoon && <CustomCursor />}

      {/* Global Cart Slide-Over Drawer */}
      {!isStandaloneComingSoon && <CartDrawer onNavigate={navigate} />}

      {/* Sticky Top Navigation */}
      {/* Keep the campaign banner visible across the public site, including division routes. */}
      {!isAdminRoute && <AnnouncementBanner onNavigate={navigate} />}
      <Navigation currentPath={normalizedPath} onNavigate={navigate} />

      {/* Main Content Area with Smooth View Transitions */}
      <main className="flex-1 w-full max-w-full min-w-0" aria-live="polite">
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
          {/* Fade only on first paint; avoid a layout-shifting entrance while database hydrates. */}
          <motion.div
            key={normalizedPath}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className={`w-full max-w-full min-w-0 ${isAdminRoute ? '' : 'public-editorial'}`}
          >
            <Suspense
              fallback={
                <RouteLoadingFallback path={normalizedPath} />
              }
            >
              {renderCurrentView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar */}
      <BottomNavigation currentPath={normalizedPath} onNavigate={navigate} />

      {/* Reusable Global Footer */}
      <Footer onNavigate={navigate} currentPath={normalizedPath} />
      {!isAdminRoute && <WhatsAppWidget />}
    </div>
  );
}

export default function App() {
  return (
    <FirestoreDataProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <SeasonalThemeProvider>
              <AppContent />
            </SeasonalThemeProvider>
            <Analytics />
            <SpeedInsights />
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </FirestoreDataProvider>
  );
}
