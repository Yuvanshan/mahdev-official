import React, { useState, useEffect, useRef } from 'react';
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
import { DIVISIONS } from '../../config/divisions';
import { DivisionId } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { COMPANY_INFO, getTelLink, getMailtoLink } from '../../config/company';

interface NavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPath, onNavigate }) => {
  const { totalQuantity, openCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const servicesDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Detect current division if on child route
  const currentDivisionKey = Object.keys(DIVISIONS).find(
    (key) => DIVISIONS[key as DivisionId].route === currentPath
  ) as DivisionId | undefined;

  const currentDivision = currentDivisionKey ? DIVISIONS[currentDivisionKey] : null;

  // Handle scroll detection for glass navbar effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
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
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs'
            : 'bg-white border-b border-slate-100'
        }`}
      >
        {/* Division Context Notice (when inside a child division) */}
        {currentDivision && (
          <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#3B82F6]">{currentDivision.name}</span>
                <span className="text-slate-400 hidden sm:inline">— A Division of Mahdev Pvt Ltd</span>
              </div>
              <button
                onClick={() => onNavigate('/')}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium underline underline-offset-2 transition-colors cursor-pointer"
              >
                <span>Corporate Home</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Left: Brand Logo */}
            <div className="flex items-center">
              <BrandLogo
                divisionLabel={currentDivision ? currentDivision.badge : undefined}
                onClick={() => onNavigate('/')}
              />
            </div>

            {/* Middle: Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {MAIN_NAV_ITEMS.map((item) => {
                if (item.id === 'services') {
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
                            ? 'text-[#0052FF] bg-blue-50/60'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        aria-expanded={isServicesOpen}
                      >
                        <span>Services & Divisions</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isServicesOpen ? 'rotate-180 text-[#0052FF]' : 'text-slate-400'
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      {isServicesOpen && (
                        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            Our Operating Divisions
                          </div>
                          <div className="mt-1 space-y-1">
                            {Object.values(DIVISIONS).map((division) => (
                              <button
                                key={division.id}
                                onClick={() => handleLinkClick(division.route)}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                                  currentPath === division.route
                                    ? 'bg-blue-50 text-[#0052FF]'
                                    : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                                    style={{ backgroundColor: division.accentColor }}
                                  >
                                    <IconRenderer name={division.iconName} className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold">{division.name}</div>
                                    <div className="text-xs text-slate-500 line-clamp-1">
                                      {division.tagline}
                                    </div>
                                  </div>
                                </div>
                                <Badge size="sm" variant="default">
                                  {division.badge}
                                </Badge>
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 p-1 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => handleLinkClick('/catalog')}
                              className="text-xs"
                            >
                              Catalog
                            </Button>
                            <Button
                              variant="electric"
                              size="sm"
                              fullWidth
                              onClick={() => handleLinkClick('/book')}
                              className="text-xs"
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
                        ? 'text-[#0052FF] font-semibold bg-blue-50/50'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right: Cart, Customer Account & CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Universal Cart Trigger Button */}
              <button
                type="button"
                onClick={openCart}
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200/80"
                aria-label="View Shopping Cart"
              >
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Cart</span>
                {totalQuantity > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#0052FF] text-white font-mono text-[10px] font-bold flex items-center justify-center animate-scaleIn">
                    {totalQuantity}
                  </span>
                )}
              </button>

              {/* Customer Account Button & Dropdown */}
              {isAuthenticated && user ? (
                <div ref={accountDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <img
                      src={
                        user.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={user.fullName}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                    <span className="hidden md:inline max-w-[100px] truncate">{user.fullName.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-1">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                        <span className="text-xs font-bold text-slate-900 block truncate">{user.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">{user.email}</span>
                      </div>

                      <button
                        onClick={() => handleLinkClick('/account')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Account Hub</span>
                      </button>

                      <button
                        onClick={() => handleLinkClick('/account/orders')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-500" />
                        <span>My Orders</span>
                      </button>

                      <button
                        onClick={() => handleLinkClick('/account/bookings')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>My Bookings</span>
                      </button>

                      <button
                        onClick={() => handleLinkClick('/account/invoices')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Invoices</span>
                      </button>

                      <button
                        onClick={() => handleLinkClick('/account/profile')}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-slate-500" />
                        <span>Profile & Preferences</span>
                      </button>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setIsAccountMenuOpen(false);
                            onNavigate('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('/login')}
                  leftIcon={<User className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Sign In
                </Button>
              )}

              <Button
                variant="electric"
                size="sm"
                onClick={() => {
                  if (currentPath === '/') {
                    const el = document.getElementById('divisions-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onNavigate('/');
                  }
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="hidden xl:inline-flex"
              >
                Ecosystem
              </Button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            {/* Account Quick Status on Mobile */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{user.fullName}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{user.email}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Mahdev Customer Portal</span>
                  <span className="text-[10px] text-slate-500">Sign in to track orders and bookings</span>
                </div>
              )}

              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={() => handleLinkClick('/account')} className="text-xs">
                  Account Hub
                </Button>
              ) : (
                <Button variant="electric" size="sm" onClick={() => handleLinkClick('/login')} className="text-xs">
                  Sign In
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Divisions
              </div>
              {Object.values(DIVISIONS).map((division) => (
                <button
                  key={division.id}
                  onClick={() => handleLinkClick(division.route)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm font-medium cursor-pointer ${
                    currentPath === division.route
                      ? 'bg-blue-50 text-[#0052FF] font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconRenderer name={division.iconName} className="w-4 h-4 text-[#0052FF]" />
                    <span>{division.name}</span>
                  </div>
                  <Badge size="sm" variant="default">{division.badge}</Badge>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Services
              </div>
              <button
                onClick={() => handleLinkClick('/catalog')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Product & Tea Catalog
              </button>
              <button
                onClick={() => handleLinkClick('/book')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Universal Booking System
              </button>
              <button
                onClick={() => handleLinkClick('/account/orders')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                My Orders & Invoices
              </button>
              <button
                onClick={() => handleLinkClick('/account/bookings')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                My Service Bookings
              </button>
              <button
                onClick={() => handleLinkClick('/checkout')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center justify-between"
              >
                <span>Shopping Cart & Checkout</span>
                {totalQuantity > 0 && (
                  <Badge size="sm" variant="default">
                    {totalQuantity} items
                  </Badge>
                )}
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Contact Mahdev
              </div>

              {/* Call Hotline */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Official Hotlines</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={getTelLink(COMPANY_INFO.primaryPhone)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
                  >
                    <span>{COMPANY_INFO.primaryPhone}</span>
                  </a>
                  <a
                    href={getTelLink(COMPANY_INFO.secondaryPhone)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
                  >
                    <span>{COMPANY_INFO.secondaryPhone}</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp & Email Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={COMPANY_INFO.socials.whatsapp || 'https://wa.me/94750928078'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={getMailtoLink(COMPANY_INFO.email)}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email Mahdev</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="electric"
                fullWidth
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('/');
                }}
              >
                Explore Mahdev Ecosystem
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
