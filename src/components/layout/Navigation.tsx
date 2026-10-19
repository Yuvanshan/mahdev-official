import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronDown,
  Menu,
  X,
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
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from '../ui/Button';
import { MAIN_NAV_ITEMS as ALL_NAV_ITEMS } from '../../config/navigation';

// Items kept in config (and the footer) but hidden from the top bar and mobile menu.
const HIDDEN_TOP_BAR_ITEMS = new Set(['insights']);
const MAIN_NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => !HIDDEN_TOP_BAR_ITEMS.has(item.id));
import { DIVISIONS, DIVISION_LIST } from '../../config/divisions';
import { DivisionId } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getTelLink, getMailtoLink } from '../../config/company';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getDivisionWhatsAppUrl } from '../../utils/whatsapp';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  const { totalQuantity, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { companySettings, siteSettings, divisions } = useFirestoreDataContext();

  const primaryPhone = companySettings?.primaryPhone || '075 092 8078';
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
          route: config.route || `/${d.slug || canonicalId}`,
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

  // Dynamic WhatsApp Inquiry URL matched to the current division (e.g. Hello SWS Event Management)
  const dynamicWhatsAppUrl = useMemo(() => {
    return getDivisionWhatsAppUrl(currentDivisionKey || currentDivision?.name);
  }, [currentDivisionKey, currentDivision]);

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

  const handleLinkClick = (href: string) => {
    setIsServicesOpen(false);
    setIsAccountMenuOpen(false);
    setIsMobileMenuOpen(false);

    if (href.startsWith('/')) {
      onNavigate(href);
    } else if (href.startsWith('#')) {
      if (currentPath !== '/') {
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
          isScrolled
            ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-[0_8px_32px_-18px_rgba(15,23,42,0.24)]'
            : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80'
        }`}
      >
        {/* Division Context Notice (when inside a child division) */}
        {currentDivision && (
          <div className="bg-[#061033] text-white text-xs py-1.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-300">{currentDivision.name}</span>
                <span className="text-blue-200/70 hidden sm:inline">Mahdev Group</span>
              </div>
              <button
                onClick={() => onNavigate('/')}
                className="text-xs text-blue-200 hover:text-white flex items-center gap-1 font-medium underline underline-offset-2 transition-colors cursor-pointer"
              >
                <span>Home</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Left: Brand Logo */}
            <div className="flex items-center shrink-0 min-w-0 mr-1 sm:mr-0">
              <BrandLogo
                onClick={() => onNavigate('/')}
              />
            </div>

            {/* Middle: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {MAIN_NAV_ITEMS.map((item) => {
                if (item.id === 'divisions' || item.children) {
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
                        <div className="absolute left-0 mt-2 w-[360px] sm:w-[410px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-[70] animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
                          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-sm font-semibold text-slate-900">Our businesses</span>
                          </div>

                          {/* Scrollable division items container */}
                          <div className="p-2 space-y-1 overflow-y-auto overscroll-contain max-h-[360px] divide-y divide-slate-100 scrollbar-thin">
                            {displayDivisions.map((division) => (
                              <a
                                key={division.id}
                                href={division.route}
                                onClick={(event) => handleAnchorClick(event, division.route)}
                                className={`w-full flex items-center p-3 rounded-xl text-left transition-all cursor-pointer group ${
                                  currentPath === division.route
                                    ? 'bg-blue-100/80 text-blue-900 ring-1 ring-blue-500/30'
                                    : 'hover:bg-blue-50/70 text-slate-800'
                                }`}
                              >
                                <span className="truncate text-sm font-semibold group-hover:text-[#0052FF] transition-colors">
                                  {division.name}
                                </span>
                              </a>
                            ))}
                          </div>

                          {/* Action footer */}
                          <div className="p-3 border-t border-slate-200 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => handleLinkClick('/divisions')}
                              className="text-xs font-semibold"
                            >
                              Explore all businesses
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={(event) => handleAnchorClick(event, item.href)}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                    className={`px-3.5 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                      currentPath === item.href
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
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                {totalQuantity > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 min-w-5 h-5 px-1 rounded-full bg-[#0052FF] text-white text-[10px] font-bold leading-5 text-center shadow">
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-900 hover:text-[#0052FF] hover:bg-blue-50 lg:hidden focus:outline-none focus:ring-2 focus:ring-[#0052FF] cursor-pointer shrink-0 border border-blue-200/80 bg-[#FAF9F6]"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <>
          {/* Tap outside the floating menu to close it. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute inset-x-0 top-full h-[100svh] z-[55] bg-slate-950/30"
          />
          <div className="lg:hidden absolute inset-x-3 top-full z-[61] mt-2 max-h-[calc(100svh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-blue-200/80 bg-[#FAF9F6] px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {/* Primary Navigation Links */}
            <div className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => (
                <a
                  key={`mobile-${item.id}`}
                  href={item.href}
                  onClick={(event) => handleAnchorClick(event, item.href)}
                  aria-current={currentPath === item.href ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                    currentPath === item.href
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
          </>
        )}
      </header>
    </>
  );
};
