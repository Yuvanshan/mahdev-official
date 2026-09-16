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
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import { MAIN_NAV_ITEMS } from '../../config/navigation';
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
      return result;
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

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-[#FAF9F6]/90 backdrop-blur-md border-b border-blue-200/60 shadow-xs'
            : 'bg-[#FAF9F6] border-b border-blue-100/70'
        }`}
      >
        {/* Division Context Notice (when inside a child division) */}
        {currentDivision && (
          <div className="bg-[#061033] text-white text-xs py-1.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-300">{currentDivision.name}</span>
                <span className="text-blue-200/70 hidden sm:inline">— A Division of Mahdev (Pvt) Ltd</span>
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
          <div className="flex items-center justify-between h-18 sm:h-20 md:h-22">
            {/* Left: Brand Logo */}
            <div className="flex items-center shrink-0 min-w-0 mr-1 sm:mr-0">
              <BrandLogo
                divisionLabel={currentDivision ? currentDivision.badge : undefined}
                onClick={() => onNavigate('/')}
              />
            </div>

            {/* Middle: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {MAIN_NAV_ITEMS.map((item) => {
                if (item.id === 'services' || item.id === 'divisions' || item.children) {
                  return (
                    <div
                      key={item.id}
                      ref={servicesDropdownRef}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() => setIsServicesOpen(!isServicesOpen)}
                        className={`inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                          isServicesOpen || currentDivision
                            ? 'text-[#0052FF] bg-blue-50 font-semibold'
                            : 'text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/50'
                        }`}
                        aria-expanded={isServicesOpen}
                      >
                        <span>Divisions</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isServicesOpen ? 'rotate-180 text-[#0052FF]' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu - perfectly constrained, responsive width, never overflows viewport */}
                      {isServicesOpen && (
                        <div className="absolute left-0 mt-2 w-[360px] sm:w-[410px] max-w-[calc(100vw-2rem)] bg-[#FAF9F6] rounded-2xl shadow-2xl border border-blue-200/80 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden">
                          <div className="px-4 py-3 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between shrink-0">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block">
                                Operating Divisions
                              </span>
                              <span className="text-[10px] text-blue-600/80">
                                Autonomous specialized enterprise units
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                              {displayDivisions.length} Active
                            </span>
                          </div>

                          {/* Scrollable division items container */}
                          <div className="p-2 space-y-1 overflow-y-auto overscroll-contain max-h-[360px] divide-y divide-blue-50 scrollbar-thin">
                            {displayDivisions.map((division) => (
                              <button
                                key={division.id}
                                onClick={() => handleLinkClick(division.route)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                                  currentPath === division.route
                                    ? 'bg-blue-100/80 text-blue-900 ring-1 ring-blue-500/30'
                                    : 'hover:bg-blue-50/70 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs group-hover:scale-105 transition-transform bg-[#0052FF]"
                                  >
                                    <IconRenderer name={division.iconName} className="w-4.5 h-4.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-bold flex items-center gap-1.5 flex-wrap">
                                      <span className="truncate group-hover:text-[#0052FF] transition-colors">
                                        {division.name}
                                      </span>
                                      {division.isPrimary && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-100 text-[#0052FF] border border-blue-300 shrink-0">
                                          PRIMARY
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate mt-0.5">
                                      {division.tagline}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  size="sm"
                                  variant={division.isPrimary ? 'electric' : 'default'}
                                  className="shrink-0 text-[10px]"
                                >
                                  {division.badge}
                                </Badge>
                              </button>
                            ))}
                          </div>

                          {/* Action footer */}
                          <div className="p-3 bg-blue-50/70 border-t border-blue-100 flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => handleLinkClick('/divisions')}
                              className="text-xs font-semibold"
                            >
                              All Divisions
                            </Button>
                            <Button
                              variant="electric"
                              size="sm"
                              fullWidth
                              onClick={() => handleLinkClick('/book')}
                              className="text-xs font-bold shadow-xs"
                            >
                              Book Services
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleLinkClick(item.href)}
                    className={`px-3.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                      currentPath === item.href
                        ? 'text-[#0052FF] font-semibold bg-blue-50'
                        : 'text-slate-700 hover:text-[#0052FF] hover:bg-blue-50/50'
                    }`}
                  >
                    {item.label}
                  </button>
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
          <div className="lg:hidden border-t border-blue-200/80 bg-[#FAF9F6] px-4 pt-4 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200 max-w-full overflow-hidden">
            {/* Primary Navigation Links */}
            <div className="space-y-1">
              {MAIN_NAV_ITEMS.map((item) => (
                <button
                  key={`mobile-${item.id}`}
                  onClick={() => handleLinkClick(item.href)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                    currentPath === item.href
                      ? 'bg-[#0052FF] text-white'
                      : 'text-slate-800 hover:bg-blue-50 hover:text-[#0052FF]'
                  }`}
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>
              ))}
            </div>

            {/* Divisions Quick List */}
            <div className="border-t border-blue-100 pt-3 space-y-1">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Operating Divisions
              </div>
              {displayDivisions.map((division) => (
                <button
                  key={`mobile-nav-${division.id}`}
                  onClick={() => handleLinkClick(division.route)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium cursor-pointer ${
                    currentPath === division.route
                      ? 'bg-blue-50 text-[#0052FF] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <IconRenderer name={division.iconName} className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                    <span className="truncate">{division.name}</span>
                  </div>
                  <Badge size="sm" variant={division.isPrimary ? 'electric' : 'default'} className="text-[10px] shrink-0">
                    {division.badge}
                  </Badge>
                </button>
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
        )}
      </header>
    </>
  );
};
