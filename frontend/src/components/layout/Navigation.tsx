import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Compass,
  ShoppingCart,
  User,
  LogOut,
  ShoppingBag,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Activity,
  LayoutDashboard,
  AlertTriangle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { BrandLogo } from './BrandLogo';
import { MAIN_NAV_ITEMS as ALL_NAV_ITEMS } from '../../config/navigation';
import { DIVISION_SITE_IDS, getDivisionSiteHref, type DivisionSiteId } from '../../config/divisionSites';

// Items kept in config (and the footer) but hidden from the top bar and mobile menu.
const HIDDEN_TOP_BAR_ITEMS = new Set(['insights']);
const MAIN_NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => !HIDDEN_TOP_BAR_ITEMS.has(item.id));
const DIVISION_SITE_NAV_ITEMS: Record<DivisionSiteId, Array<{ id: string; label: string; href: string }>> = {
  sws: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'services', label: 'Events', href: '/#services' },
    { id: 'gallery', label: 'Gallery', href: '/#gallery' },
    { id: 'rentals', label: 'Rentals', href: '/#rentals' },
  ],
  u1: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'services', label: 'Services', href: '/#services' },
    { id: 'portfolio', label: 'Portfolio', href: '/#portfolio' },
  ],
  it: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'services', label: 'Services', href: '/#services' },
    { id: 'case-studies', label: 'Case studies', href: '/#case-studies' },
  ],
  travels: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'destinations', label: 'Destinations', href: '/#destinations' },
    { id: 'packages', label: 'Packages', href: '/#packages' },
  ],
  mart: [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'categories', label: 'Categories', href: '/#categories' },
    { id: 'products', label: 'Products', href: '/#products' },
  ],
};
const DIVISION_MENU_DETAILS: Record<string, { mark: string; description: string; background: string; color: string }> = {
  sws: { mark: 'SWS', description: 'Weddings, parties & events', background: '#0E1424', color: '#fff' },
  u1: { mark: 'U1', description: 'Photography & cinema', background: '#F1E4D3', color: '#0E1424' },
  it: { mark: 'IT', description: 'Web, apps & digital products', background: '#E8ECFF', color: '#2E46CF' },
  travels: { mark: 'MT', description: 'Thoughtful island journeys', background: '#E4F0EB', color: '#0E6B4F' },
  mart: { mark: 'OM', description: 'Celebration & home essentials', background: '#FBEBDD', color: '#9A4A12' },
};
import { DIVISIONS, DIVISION_LIST } from '../../config/divisions';
import { CANONICAL_SITE_ORIGIN } from '../../config/site';
import { DivisionId } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getTelLink, getMailtoLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getDivisionWhatsAppUrl } from '../../utils/whatsapp';
import { getProfileCompletion, hasRealName } from '../../utils/profileCompletion';
import { Avatar } from '../account/Avatar';
import { readDeviceProfile } from '../../services/authService';
import { useActiveSectionNavigation } from '../../hooks/useActiveSectionNavigation';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  divisionId?: DivisionSiteId;
  isDivisionHost?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate, divisionId, isDivisionHost }) => {
  const { totalQuantity, openCart } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { companySettings, siteSettings, divisions } = useFirestoreDataContext();

  const companyPrimaryPhone = companySettings?.primaryPhone || '075 092 8078';
  const secondaryPhone = companySettings?.secondaryPhone || '075 092 8078';
  const email = companySettings?.email || 'info.mahdev.lk@gmail.com';
  const whatsappUrl = companySettings?.socials?.whatsapp || 'https://wa.me/94750928078';
  const companyName = companySettings?.name || siteSettings?.siteName || 'Mahdev';

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Account button: initials or photo when signed in, and a dot while required details are missing.
  const profileIncomplete = Boolean(isAuthenticated && user && !getProfileCompletion(user).isComplete);
  // Saved on this device at the last visit; shown while Firebase restores the session.
  const savedProfile = isAuthLoading ? readDeviceProfile() : null;
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(currentPath.split('?')[0]);
  const signInHref = isAuthPage || currentPath === '/' ? '/login' : `/login?redirect=${encodeURIComponent(currentPath)}`;
  const ACCOUNT_LINKS = [
    { label: 'My account', href: '/account', icon: LayoutDashboard },
    { label: 'Orders', href: '/account/orders', icon: ShoppingBag },
    { label: 'Bookings', href: '/account/bookings', icon: Calendar },
    { label: 'Activity', href: '/account/activity', icon: Activity },
    { label: 'Profile', href: '/account/profile', icon: User },
  ];
  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    onNavigate('/');
  };

  // Dynamic divisions sorted by order
  const displayDivisions = useMemo(() => {
    if (divisions && divisions.length > 0) {
      const seen = new Set<string>();
      const result = [];
      for (const d of divisions) {
        if (d.status === 'inactive') continue;
        const rawId = (d.id || d.slug || '').toLowerCase();
        const canonicalId =
          rawId === 'u1' || rawId === 'u1-studio' || rawId === 'u1-cinema'
            ? 'u1'
            : rawId === 'sws' || rawId === 'sws-event-management' || rawId === 'sws-events'
            ? 'sws'
            : rawId === 'it' || rawId === 'it-solutions' || rawId === 'mahdev-it'
            ? 'it'
            : rawId === 'travels' || rawId === 'mahdev-travels'
            ? 'travels'
            : rawId === 'mart' || rawId === 'online-mart' || rawId === 'mahdev-mart'
            ? 'mart'
            : rawId;

        if (!canonicalId || seen.has(canonicalId)) continue;
        seen.add(canonicalId);

        const config = (DIVISIONS as any)[canonicalId] || (DIVISIONS as any)[d.id] || DIVISION_LIST.find((item) => item.id === canonicalId || item.id === d.id) || {};
        result.push({
          ...config,
          id: canonicalId,
          name: d.name || config.name,
          route: getDivisionSiteHref(canonicalId),
          badge: d.hero?.badge || config.badge || 'Enterprise Division',
          iconName: config.iconName || 'Building',
          accentColor: (config as any).accentColor || (config as any).color || '#1d4ed8',
          tagline: d.hero?.subtitle || config.tagline || '',
          isPrimary: (config as any).isPrimary || canonicalId === 'sws',
        });
      }
      // Guarantee all 5 divisions are present in navigation
      if (result.length < 5) {
        for (const defaultDiv of Object.values(DIVISIONS)) {
          if (!seen.has(defaultDiv.id)) {
            seen.add(defaultDiv.id);
            result.push({
              ...defaultDiv,
              route: getDivisionSiteHref(defaultDiv.id),
              isPrimary: defaultDiv.id === 'sws',
            });
          }
        }
      }
      // Fixed site order: SWS, U1, IT, Mart, Travels.
      const navOrder: Record<string, number> = { sws: 1, u1: 2, it: 3, mart: 4, travels: 5 };
      return result.sort((a, b) => (navOrder[a.id] ?? 99) - (navOrder[b.id] ?? 99));
    }
    return Object.values(DIVISIONS);
  }, [divisions]);

  // Detect current division if on child route (supporting aliases like /sws-event-management)
  const normalizedNavPath = (currentPath ? String(currentPath) : '/').toLowerCase().replace(/\/$/, '') || '/';
  const currentDivisionKey = (Object.keys(DIVISIONS) as DivisionId[]).find((key) => {
    const r = DIVISIONS[key].route;
    if (r === normalizedNavPath) return true;
    if (key === 'sws' && ['/sws', '/sws-event-management', '/sws-events', '/events', '/event-management'].includes(normalizedNavPath)) return true;
    if (key === 'u1' && ['/u1', '/u1-studio', '/u1-cinema'].includes(normalizedNavPath)) return true;
    if (key === 'it' && ['/it', '/it-solutions', '/mahdev-it'].includes(normalizedNavPath)) return true;
    if (key === 'travels' && ['/travels', '/mahdev-travels'].includes(normalizedNavPath)) return true;
    if (key === 'mart' && ['/mart', '/online-mart', '/mahdev-mart'].includes(normalizedNavPath)) return true;
    return false;
  });

  const currentDivision = currentDivisionKey ? DIVISIONS[currentDivisionKey] : null;
  const activeDivisionId = divisionId || (
    currentDivisionKey && DIVISION_SITE_IDS.includes(currentDivisionKey as DivisionSiteId)
      ? currentDivisionKey as DivisionSiteId
      : undefined
  );
  const currentDivisionRecord = activeDivisionId
    ? divisions.find((division) =>
        division.id === activeDivisionId ||
        division.divisionKey === activeDivisionId ||
        division.canonicalDocId === activeDivisionId ||
        division.slug === activeDivisionId
      )
    : undefined;
  const primaryPhone =
    currentDivisionRecord?.contactPhone ||
    currentDivisionRecord?.contactNumber ||
    (activeDivisionId ? DIVISIONS[activeDivisionId].contactPhone : undefined) ||
    companyPrimaryPhone;
  const divisionLogo =
    currentDivisionRecord?.logoUrl ||
    currentDivisionRecord?.logo ||
    (activeDivisionId ? DIVISIONS[activeDivisionId].logoUrl : undefined);
  const divisionName =
    activeDivisionId === 'sws' || activeDivisionId === 'u1'
      ? DIVISIONS[activeDivisionId].name
      : currentDivisionRecord?.name ||
        (activeDivisionId ? DIVISIONS[activeDivisionId].name : currentDivision?.name);
  const singleLineDivisionName = divisionName?.trim().replace(/\s+/g, ' ');
  const divisionBasePath =
    !isDivisionHost && activeDivisionId && (currentPath === `/${activeDivisionId}` || currentPath.startsWith(`/${activeDivisionId}/`))
      ? `/${activeDivisionId}`
      : '';
  const visibleNavItems = activeDivisionId
    ? DIVISION_SITE_NAV_ITEMS[activeDivisionId].map((item) => ({
        ...item,
        href: item.href === '/'
          ? divisionBasePath || '/'
          : item.href.startsWith('/#')
            ? `${divisionBasePath}${item.href.slice(1)}`
            : item.href,
      }))
    : MAIN_NAV_ITEMS;
  const { activeId: activeDivisionNavId, setActiveId: setActiveDivisionNavId } =
    useActiveSectionNavigation(visibleNavItems, activeDivisionId || 'company', Boolean(activeDivisionId));
  const divisionHomePath = divisionBasePath || '/';
  const isPublicRoute = !currentPath.startsWith('/admin');

  // Dynamic WhatsApp Inquiry URL matched to the current division (e.g. Hello SWS Event Management)
  const dynamicWhatsAppUrl = useMemo(() => {
    return getDivisionWhatsAppUrl(activeDivisionId || currentDivisionKey || currentDivision?.name);
  }, [activeDivisionId, currentDivisionKey, currentDivision]);

  // Handle throttled scroll detection for glass navbar effect
  useEffect(() => {
    let ticking = false;
    let lastScrolled = window.scrollY > 20;
    setIsScrolled(lastScrolled);

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldScroll = window.scrollY > 20;
          if (shouldScroll !== lastScrolled) {
            lastScrolled = shouldScroll;
            setIsScrolled(shouldScroll);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServicesOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (href: string) => {
    setIsServicesOpen(false);
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);

    if (href.startsWith('/')) {
      onNavigate(href);
    } else if (/^https?:\/\//i.test(href)) {
      window.location.assign(href);
    } else if (href.startsWith('#')) {
      if (currentPath !== '/' && currentPath !== `/${divisionId}`) {
        onNavigate('/' + href);
      } else {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;
    event.preventDefault();
    handleLinkClick(href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[60] w-full !overflow-visible transition-all duration-300 ${
          isPublicRoute ? 'public-nav-shell' : ''
        } ${
          isMobileMenuOpen ? 'public-nav-shell--menu-open' : ''
        } ${
          isMobileMenuOpen
            ? 'bg-white border-b border-slate-200/80'
            : isScrolled
              ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_8px_32px_-18px_rgba(15,23,42,0.24)]'
              : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80'
        }`}
        style={isMobileMenuOpen ? { backdropFilter: 'none', WebkitBackdropFilter: 'none' } : undefined}
      >
        {/* Division Context Notice (when inside a child division) */}
        {activeDivisionId && isPublicRoute && (
          <div className="division-context-notice text-xs py-1.5 px-4">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="division-context-title min-w-0 truncate whitespace-nowrap font-semibold leading-tight text-blue-300">
                  {singleLineDivisionName || 'Division site'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(CANONICAL_SITE_ORIGIN)}
                className="division-return-link inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
                aria-label="Return to the Mahdev company website"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Mahdev</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={`max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 ${isPublicRoute ? 'public-nav-inner' : ''} ${isMobileMenuOpen ? 'relative z-[56]' : ''}`}
          style={isMobileMenuOpen ? { backdropFilter: 'none', WebkitBackdropFilter: 'none' } : undefined}
        >
          <div className={`flex items-center justify-between h-16 ${isPublicRoute ? 'min-[900px]:h-[88px]' : 'sm:h-[72px]'}`}>
            {/* Left: Brand Logo */}
            <div className="flex items-center shrink-0 min-w-0 mr-1 sm:mr-0">
              <BrandLogo
                onClick={() => onNavigate(divisionHomePath)}
                logoUrl={divisionLogo}
              />
              {activeDivisionId && divisionName && (
                <span className="ml-2 hidden border-l border-slate-200 pl-3 text-sm font-semibold leading-tight text-slate-800 min-[900px]:block">
                  <span className="whitespace-nowrap">{singleLineDivisionName}</span>
                </span>
              )}
            </div>

            {/* Middle: Desktop Navigation Links */}
            <nav className="hidden min-[900px]:flex items-center gap-1 xl:gap-2">
              {visibleNavItems.map((item) => {
                if ('children' in item && item.children) {
                  return (
                    <div
                      key={item.id}
                      ref={servicesDropdownRef}
                      className="relative"
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setIsServicesOpen(false);
                      }}
                    >
                      <div className={`inline-flex items-center rounded-full transition-all duration-200 ${
                          isServicesOpen || currentDivision
                            ? 'bg-blue-50 font-semibold shadow-sm shadow-blue-900/5'
                            : 'text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/70'
                        }`}
                      >
                        <a
                          href={item.href}
                          onClick={(event) => handleAnchorClick(event, item.href)}
                          aria-current={currentPath === item.href ? 'page' : undefined}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-full transition-colors ${
                            isServicesOpen || currentDivision ? 'text-[#0052FF]' : ''
                          }`}
                        >
                          Divisions
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsServicesOpen(!isServicesOpen)}
                          className="inline-flex items-center rounded-r-full px-1.5 py-2 text-slate-500 hover:text-[#0052FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]"
                          aria-label="Show division links"
                          aria-expanded={isServicesOpen}
                          aria-haspopup="true"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isServicesOpen ? 'rotate-180 text-[#0052FF]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Dropdown Menu - perfectly constrained, responsive width, never overflows viewport */}
                      {isServicesOpen && (
                        <div className="absolute left-0 mt-3 w-[560px] max-w-[calc(100vw-2rem)] rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 z-[70] animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-sm font-semibold text-slate-900">Our businesses</span>
                          </div>

                          {/* Scrollable division items container */}
                          <div className="grid grid-cols-2 gap-2 p-3 overflow-y-auto overscroll-contain max-h-[360px] scrollbar-thin">
                            {displayDivisions.map((division) => (
                              (() => {
                                const detail = DIVISION_MENU_DETAILS[division.id] || {
                                  mark: division.name.slice(0, 2).toUpperCase(),
                                  description: division.tagline || 'Explore this Mahdev division',
                                  background: '#EEF1FF',
                                  color: '#2E46CF',
                                };
                                return (
                              <a
                                key={division.id}
                                href={division.route}
                                onClick={(event) => handleAnchorClick(event, division.route)}
                                aria-current={currentDivisionKey === division.id ? 'page' : undefined}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                                  currentPath === division.route
                                    ? 'bg-blue-100/80 text-blue-900 ring-1 ring-blue-500/30'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <span
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold tracking-tight"
                                  style={{ backgroundColor: detail.background, color: detail.color }}
                                  aria-hidden="true"
                                >
                                  {detail.mark}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold group-hover:text-[#3550E8] transition-colors">
                                    {division.name}
                                  </span>
                                  <span className="mt-0.5 block truncate text-xs text-slate-500">{detail.description}</span>
                                </span>
                              </a>
                                );
                              })()
                            ))}
                            <button
                              type="button"
                              onClick={() => handleLinkClick('/portfolio')}
                              className="col-span-2 flex min-h-14 items-center justify-between rounded-2xl bg-[#0E1424] px-4 text-left text-sm font-semibold text-white transition-colors hover:bg-[#20283c]"
                            >
                              See all our work <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          {/* Action footer */}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(event) => {
                      if (activeDivisionId) {
                        setActiveDivisionNavId(item.id);
                        if (item.id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      handleAnchorClick(event, item.href);
                    }}
                    aria-current={
                      activeDivisionId
                        ? activeDivisionNavId === item.id ? 'location' : undefined
                        : currentPath === item.href ? 'page' : undefined
                    }
                    className={`px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                      activeDivisionId
                        ? activeDivisionNavId === item.id
                          ? 'text-[#0052FF] font-semibold bg-blue-50 shadow-sm shadow-blue-900/5'
                          : 'text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/70'
                        : currentPath === item.href
                        ? 'text-[#0052FF] font-semibold bg-blue-50 shadow-sm shadow-blue-900/5'
                        : 'text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/70'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            {/* Right: Phone Hotline, WhatsApp & Mobile Hamburger Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Phone Hotline Link */}
              <a
                href={getTelLink(primaryPhone)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 text-xs font-mono font-bold text-slate-900 hover:text-[#0052FF] transition-colors shadow-2xs shrink-0"
                title={`Call Hotline ${primaryPhone}`}
                aria-label={`Call Hotline ${primaryPhone}`}
              >
                <Phone className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                <span className="hidden sm:inline">{primaryPhone}</span>
              </a>

              {/* WhatsApp Link */}
              <a
                href={dynamicWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition-colors shadow-2xs shrink-0"
                title="Direct WhatsApp"
                aria-label="Direct WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              {/* Cart: item count badge; opens the cart sheet. */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openCart();
                }}
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-xs font-semibold text-slate-900 transition-colors shadow-2xs shrink-0"
                title="View cart"
                aria-label={`View cart, ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`}
              >
                <ShoppingCart className="w-4 h-4 text-slate-800 shrink-0" />
                <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-[#0052FF] text-white text-[10px] font-bold leading-5 text-center shadow">
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              </button>

              {/* Account: sign-in link, or the signed-in customer's menu. */}
              {isAuthLoading ? (
                // While the session restores, show the saved profile photo instead of a shimmer.
                savedProfile ? (
                  <span className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs" aria-hidden="true">
                    <Avatar name={savedProfile.fullName} email={savedProfile.email} src={savedProfile.avatarUrl} className="h-7 w-7 rounded-lg" textClassName="text-[11px]" />
                  </span>
                ) : (
                  <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200" aria-hidden="true" />
                )
              ) : isAuthenticated && user ? (
                <div className="relative shrink-0" ref={accountDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAccountMenuOpen((open) => !open);
                    }}
                    className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 pr-1 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 xl:pr-2.5"
                    aria-label={`Account menu for ${user.fullName}${profileIncomplete ? ', profile incomplete' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={isAccountMenuOpen}
                  >
                    <Avatar name={user.fullName} email={user.email} src={user.avatarUrl} className="h-7 w-7 rounded-lg" textClassName="text-[11px]" />
                    <span className="hidden max-w-[7rem] truncate text-xs font-semibold text-slate-800 xl:inline">
                      {hasRealName(user) ? user.fullName.split(' ')[0] : 'Account'}
                    </span>
                    <ChevronDown className={`hidden h-3.5 w-3.5 text-slate-500 transition-transform xl:block ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                    {profileIncomplete && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-amber-500 ring-2 ring-white" aria-hidden="true" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute right-0 top-full z-[70] mt-2 w-[min(17rem,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
                      >
                        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/60 p-4">
                          <p className="truncate text-sm font-bold text-slate-900">{hasRealName(user) ? user.fullName : 'Your account'}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                        {profileIncomplete && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleLinkClick('/account/complete')}
                            className="flex w-full items-center gap-2.5 border-b border-amber-100 bg-amber-50 px-4 py-3 text-left text-xs font-semibold text-amber-900 hover:bg-amber-100"
                          >
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                            Complete your profile
                            <ArrowRight className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                        <div className="p-1.5">
                          {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
                            <button
                              key={href}
                              type="button"
                              role="menuitem"
                              onClick={() => handleLinkClick(href)}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                currentPath === href ? 'bg-blue-50 text-[#0052FF]' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 p-1.5">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <a
                  href={signInHref}
                  onClick={(event) => handleAnchorClick(event, signInHref)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-[#0052FF]"
                  title="Sign in"
                  aria-label="Sign in to your account"
                >
                  <User className="h-4 w-4 shrink-0 text-slate-800" aria-hidden="true" />
                  <span className="hidden xl:inline">Sign in</span>
                </a>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-[62] p-2 rounded-xl text-slate-900 hover:text-[#0052FF] hover:bg-blue-50 min-[900px]:hidden focus:outline-none focus:ring-2 focus:ring-[#0052FF] cursor-pointer shrink-0 border border-blue-200/80 bg-[#FAF9F6]"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mahdev-mobile-navigation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <div className="min-[900px]:hidden fixed inset-0 z-[140]" role="presentation">
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute inset-0 bg-slate-950/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.aside
                  id="mahdev-mobile-navigation"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Mobile navigation"
                  className="absolute inset-y-0 right-0 flex h-[100dvh] w-[min(90vw,380px)] flex-col overflow-hidden bg-[#F6F5F1] shadow-2xl"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                >
                  <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                    <BrandLogo onClick={() => handleLinkClick('/')} />
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
                      aria-label="Close navigation menu"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
            {/* Account */}
            {!isAuthLoading && (
              isAuthenticated && user ? (
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleLinkClick(profileIncomplete ? '/account/complete' : '/account')}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-left shadow-2xs"
                  >
                    <Avatar name={user.fullName} email={user.email} src={user.avatarUrl} className="h-9 w-9 rounded-lg" textClassName="text-xs" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{hasRealName(user) ? user.fullName : 'My account'}</span>
                      <span className={`block truncate text-xs ${profileIncomplete ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                        {profileIncomplete ? 'Complete your profile' : 'View account'}
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <a
                  href={signInHref}
                  onClick={(event) => handleAnchorClick(event, signInHref)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052FF] px-3 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20"
                >
                  <User className="h-4 w-4" aria-hidden="true" /> Sign in or create an account
                </a>
              )
            )}

            {/* Primary Navigation Links */}
            <div className="space-y-1">
              {visibleNavItems.map((item) => (
                <a
                  key={`mobile-${item.id}`}
                  href={item.href}
                  onClick={(event) => {
                    if (activeDivisionId) {
                      setActiveDivisionNavId(item.id);
                      if (item.id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    handleAnchorClick(event, item.href);
                  }}
                  aria-current={
                    activeDivisionId
                      ? activeDivisionNavId === item.id ? 'location' : undefined
                      : currentPath === item.href ? 'page' : undefined
                  }
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                    activeDivisionId
                      ? activeDivisionNavId === item.id
                        ? 'bg-[#0052FF] text-white'
                        : 'text-slate-800 hover:bg-blue-50 hover:text-[#0052FF]'
                      : currentPath === item.href
                      ? 'bg-[#0052FF] text-white'
                      : 'text-slate-800 hover:bg-blue-50 hover:text-[#0052FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </a>
              ))}
            </div>

            {/* Divisions Quick List */}
            {!divisionId && (
              <div className="border-t border-blue-100 pt-3 space-y-1">
                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Operating Divisions
                </div>
                {displayDivisions.map((division) => (
                  <a
                    key={`mobile-nav-${division.id}`}
                    href={division.route}
                    onClick={(event) => handleAnchorClick(event, division.route)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left text-xs font-medium cursor-pointer ${
                      currentPath === division.route
                        ? 'bg-blue-50 text-[#0052FF] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{division.name}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Mobile Contact Quick Actions */}
            <div className="border-t border-blue-100 pt-3 space-y-2">
              <a
                href={getTelLink(primaryPhone)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white rounded-xl border border-blue-200 text-xs font-mono font-bold text-slate-900 hover:text-[#0052FF] shadow-2xs"
              >
                <Phone className="w-4 h-4 text-[#0052FF]" />
                <span>Call Hotline: {primaryPhone}</span>
              </a>

              <a
                href={dynamicWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
                  </div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </header>
    </>
  );
};
