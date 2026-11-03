import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  ExternalLink,
  Heart,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plane,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import { BrandLogo } from '../layout/BrandLogo';
import { HeroSection } from './HeroSection';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { FirestoreProduct, FirestoreService } from '../../types/firestore';
import { getDashboardDivisionCardItems, getDivisionCardItems } from '../../utils/divisionPresentation';
import { useAvailableCmsBanners } from '../../hooks/useAvailableCmsBanners';
import { resolveMediaUrl } from '../../services/firestoreMediaService';
import { CmsBanner } from '../../types/cms';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getDefaultDivisions } from '../../services/firestore/divisions';

interface HomeDashboardShellProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

const divisionIcons: Record<string, React.ElementType> = {
  sws: Building2,
  u1: Camera,
  it: Code2,
  travels: Plane,
  mart: ShoppingBag,
};

interface SearchResult {
  id: string;
  title: string;
  detail: string;
  route: string;
  type: 'Division' | 'Service' | 'Product';
}

function normalizeDivisionId(value?: string): string {
  const id = (value || '').toLowerCase();
  if (id.includes('sws')) return 'sws';
  if (id.includes('u1')) return 'u1';
  if (id.includes('it')) return 'it';
  if (id.includes('travel')) return 'travels';
  if (id.includes('mart')) return 'mart';
  return id;
}

function matchesSearch(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function getDivisionDestination(
  divisions: ReturnType<typeof getDivisionCardItems>,
  divisionId: string,
  fallback: string
): string {
  const division = divisions.find((item) => item.id === divisionId);
  return division?.externalUrl || division?.route || fallback;
}

const GlobalSearch: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  const { activeDivisions, divisions: allDivisions, services, products } = useFirestoreDataContext();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const divisions = useMemo(
    () => getDashboardDivisionCardItems(
      activeDivisions.length ? activeDivisions : allDivisions.length ? allDivisions : getDefaultDivisions()
    ),
    [activeDivisions, allDivisions]
  );
  const normalizedQuery = query.trim();

  const results = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    const divisionResults: SearchResult[] = divisions
      .filter((division) => matchesSearch(`${division.name} ${division.description}`, normalizedQuery))
      .map((division) => ({
        id: `division-${division.id}`,
        title: division.name,
        detail: division.description,
        route: division.externalUrl || division.route,
        type: 'Division',
      }));
    const serviceResults: SearchResult[] = (services as FirestoreService[])
      .filter((service) => service.isPublished !== false && service.status !== 'inactive' && service.status !== 'draft')
      .filter((service) =>
        matchesSearch(`${service.name} ${service.title || ''} ${service.description || ''}`, normalizedQuery)
      )
      .slice(0, 5)
      .map((service) => {
        const division = divisions.find((item) =>
          item.id === normalizeDivisionId(service.divisionId || service.division)
        );
        return {
          id: `service-${service.id}`,
          title: service.title || service.name,
          detail: division?.name || 'Service',
          route: division?.externalUrl || division?.route || '/services',
          type: 'Service' as const,
        };
      });
    const productResults: SearchResult[] = (products as FirestoreProduct[])
      .filter((product) => product.isPublished !== false && product.status !== 'draft' && product.status !== 'archived')
      .filter((product) =>
        matchesSearch(`${product.name} ${product.shortDescription || ''} ${product.description || ''}`, normalizedQuery)
      )
      .slice(0, 5)
      .map((product) => ({
        id: `product-${product.id}`,
        title: product.name,
        detail: 'Online Mart',
        route: getDivisionDestination(divisions, 'mart', '/mart'),
        type: 'Product',
      }));

    return [...divisionResults, ...serviceResults, ...productResults].slice(0, 10);
  }, [divisions, normalizedQuery, products, services]);

  const showResults = isFocused && normalizedQuery.length >= 2;

  return (
    <div className="relative z-30 w-full max-w-2xl">
      <label htmlFor="homepage-global-search" className="sr-only">
        Search divisions, services, and products
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100/70">
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          id="homepage-global-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setQuery('');
              setIsFocused(false);
            } else if (event.key === 'Enter' && results[0]) {
              openBannerTarget(results[0].route, onNavigate);
              setQuery('');
            }
          }}
          placeholder="What service are you looking for today?"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {showResults && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {results.length ? (
            results.map((result) => (
              <button
                type="button"
                key={result.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  openBannerTarget(result.route, onNavigate);
                  setQuery('');
                  setIsFocused(false);
                }}
                className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {result.title}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{result.detail}</span>
                </span>
                <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                  {result.type}
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-slate-500">
              No matching divisions, services, or products found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

function getSafeExternalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function openBannerTarget(target: string | undefined, onNavigate: (path: string) => void): void {
  if (!target) return;
  if (target.startsWith('#')) {
    const targetElement = document.querySelector<HTMLElement>(target);
    if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
    else onNavigate('/divisions');
    return;
  }
  if (target.startsWith('/') && !target.startsWith('//')) {
    onNavigate(target);
    return;
  }
  const safeUrl = getSafeExternalUrl(target);
  if (safeUrl) window.location.assign(safeUrl);
}

const HomePromotionBanner: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  const { homepageConfig } = useFirestoreDataContext();
  const banners = useAvailableCmsBanners()
    .filter((banner) => banner.placement === 'home_hero' && (!banner.divisionId || banner.divisionId === 'all'))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState('');
  const activeBanner: CmsBanner | undefined = banners[activeIndex];
  const bannerImage = activeBanner?.imageUrl || '';
  const bannerVideo = activeBanner?.videoUrl || '';
  const [imageMediaUrl, setImageMediaUrl] = useState('');
  const [videoMediaUrl, setVideoMediaUrl] = useState('');

  useEffect(() => {
    if (banners.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    let active = true;
    const resolve = (source: string, setResolved: (url: string) => void) => {
      if (!source) {
        setResolved('');
        return;
      }
      void resolveMediaUrl(source)
        .then((resolved) => {
          if (active) setResolved(resolved);
        })
        .catch((error: unknown) => {
          console.error('[HomeDashboard] Could not resolve promotional media:', error);
          if (active) setResolved('');
        });
    };
    resolve(bannerImage, setImageMediaUrl);
    resolve(bannerVideo, setVideoMediaUrl);
    return () => { active = false; };
  }, [bannerImage, bannerVideo]);

  const goTo = (direction: -1 | 1) => {
    if (banners.length < 2) return;
    setActiveIndex((index) => (index + direction + banners.length) % banners.length);
  };
  const hero = homepageConfig.hero;
  const title = activeBanner?.title || 'Creating Moments. Capturing Memories. Delivering Innovation.';
  const subtitle = activeBanner?.subtitle || hero?.description || '';
  const cta = activeBanner?.buttonText || hero?.primaryCtaLabel || 'Explore our services';
  const safeImage = getSafeExternalUrl(imageMediaUrl) || (imageMediaUrl.startsWith('/') ? imageMediaUrl : '');
  const safeVideo = getSafeExternalUrl(videoMediaUrl) || (videoMediaUrl.startsWith('/') ? videoMediaUrl : '');

  if (!activeBanner) return null;

  return (
    <section
      className="relative isolate mb-5 min-h-[245px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#160605] via-[#432818] to-[#99582a] text-white shadow-lg shadow-slate-950/10 sm:min-h-[290px]"
      aria-label="Mahdev promotions"
      aria-roledescription={banners.length > 1 ? 'carousel' : undefined}
    >
      {safeImage && (
        <img
          src={safeImage}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {safeVideo && (
        <video
          key={safeVideo}
          src={safeVideo}
          poster={safeImage || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#160605]/85 via-[#432818]/60 to-[#432818]/15" />
      <div className="relative flex min-h-[245px] flex-col justify-center p-6 sm:min-h-[290px] sm:p-9">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">
          {activeBanner?.badgeText || 'MAHDEV GROUP'}
        </p>
        <h2 className="max-w-2xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
        {subtitle && <p className="mt-3 max-w-xl text-xs leading-relaxed text-white/80 sm:text-sm">{subtitle}</p>}
        <button
          type="button"
          onClick={() => openBannerTarget(activeBanner?.targetUrl || hero?.primaryCtaLink || '/services', onNavigate)}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#6f1d1b] transition hover:-translate-y-0.5 hover:bg-amber-50"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        {banners.length > 1 && (
          <div className="mt-5 flex items-center gap-2">
            <button type="button" onClick={() => goTo(-1)} aria-label="Previous promotion" className="rounded-full border border-white/40 p-1.5 text-white hover:bg-white/15">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {banners.map((banner, index) => (
              <button
                type="button"
                key={banner.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show promotion ${index + 1}: ${banner.title}`}
                aria-current={index === activeIndex}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-amber-300' : 'w-2 bg-white/50'}`}
              />
            ))}
            <button type="button" onClick={() => goTo(1)} aria-label="Next promotion" className="rounded-full border border-white/40 p-1.5 text-white hover:bg-white/15">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export const HomeDashboardShell: React.FC<HomeDashboardShellProps> = ({ children, onNavigate }) => {
  const { companySettings, activeDivisions, divisions: allDivisions } = useFirestoreDataContext();
  const { user, isAuthenticated } = useAuth();
  const { totalQuantity, openCart } = useCart();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const divisions = useMemo(
    () => getDashboardDivisionCardItems(
      activeDivisions.length ? activeDivisions : allDivisions.length ? allDivisions : getDefaultDivisions()
    ),
    [activeDivisions, allDivisions]
  );
  const phone = companySettings.primaryPhone || companySettings.contactPhone;
  const offices = Object.values(companySettings.offices || {}).filter(
    (office) => office?.name || office?.city || office?.address
  );
  const whatsappUrl = getSafeExternalUrl(
    companySettings.socials?.whatsapp ||
    (phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '')
  );
  const socialLinks = Object.entries(companySettings.socials || {})
    .map(([name, url]) => ({ name, url: getSafeExternalUrl(url) }))
    .filter((item): item is { name: string; url: string } => Boolean(item.url))
    .slice(0, 4);
  const workingHours = Object.entries(companySettings.workingHours || {}).filter(([, hours]) => Boolean(hours));

  return (
    <div className="mx-auto w-full max-w-[1680px] px-3 pb-8 sm:px-5 lg:px-7">
      <header className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <BrandLogo size="md" theme="light" onClick={() => onNavigate('/')} />
          <div className="hidden min-w-0 border-l border-slate-200 pl-4 sm:block">
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-blue-800">MAHDEV GROUP</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">Creating Moments. Capturing Memories. Delivering Innovation.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart, ${totalQuantity} items`}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-700 px-1 text-center text-[9px] font-bold leading-4 text-white">
              {totalQuantity}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate(isAuthenticated ? '/account' : '/login')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{isAuthenticated ? 'My account' : 'Sign in'}</span>
          </button>
        </div>
      </header>

      <div className={`grid items-start gap-4 2xl:gap-5 ${
        isSidebarCollapsed
          ? 'xl:grid-cols-[76px_minmax(0,1fr)_260px]'
          : 'xl:grid-cols-[220px_minmax(0,1fr)_260px]'
      }`}>
        <aside className="hidden xl:sticky xl:top-4 xl:block">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <div className={`mb-3 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              {!isSidebarCollapsed && <p className="px-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Navigation</p>}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={isSidebarCollapsed ? 'Expand dashboard navigation' : 'Collapse dashboard navigation'}
                aria-expanded={!isSidebarCollapsed}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {isSidebarCollapsed
                  ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                  : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            <nav aria-label="Dashboard navigation" className="space-y-1">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                aria-current="page"
                title="Dashboard"
                className={`flex w-full items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-left text-sm font-semibold text-blue-800 ${
                  isSidebarCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!isSidebarCollapsed && <span>Dashboard</span>}
              </button>
              {!isSidebarCollapsed && (
                <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Categories
                </p>
              )}
              {divisions.map((division) => {
                const Icon = divisionIcons[division.id] || Building2;
                return (
                  <button
                    key={division.id}
                    type="button"
                    title={division.categoryLabel}
                    onClick={() => openBannerTarget(division.externalUrl || division.route, onNavigate)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      isSidebarCollapsed ? 'justify-center px-2' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                    {!isSidebarCollapsed && <span className="truncate">{division.categoryLabel}</span>}
                  </button>
                );
              })}
              <div className="my-3 border-t border-slate-100" />
              {[
                { label: 'My Bookings', route: '/account/bookings', icon: CalendarDays },
                { label: 'Services', route: '/services', icon: MessageCircle },
                { label: 'Account settings', route: '/account/profile', icon: UserRound },
                { label: 'Contact & support', route: '/contact', icon: Phone },
              ].map(({ label, route, icon: Icon }) => (
                <button
                  key={route}
                  type="button"
                  title={label}
                  onClick={() => onNavigate(route)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSidebarCollapsed ? 'justify-center px-2' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                  {!isSidebarCollapsed && <span className="truncate">{label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <nav aria-label="Explore MAHDEV categories" className="mb-3 flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {divisions.map((division) => {
              const Icon = divisionIcons[division.id] || Building2;
              return (
                <button
                  key={division.id}
                  type="button"
                  onClick={() => openBannerTarget(division.externalUrl || division.route, onNavigate)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:text-[#6f1d1b]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#bb9457]" aria-hidden="true" />
                  {division.categoryLabel}
                </button>
              );
            })}
          </nav>
          <HeroSection
            onNavigate={onNavigate}
            onExploreMahdev={() => onNavigate('/services')}
            onExploreServices={() => onNavigate('/services')}
            theme="v2"
          />
          <div className="mb-4 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  {companySettings.name || 'MAHDEV GROUP'}
                </p>
                <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                  Welcome{isAuthenticated && user?.fullName ? `, ${user.fullName}` : ' to MAHDEV'}
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Explore our divisions, find a service, or browse products from one place.
                </p>
              </div>
            </div>
            <GlobalSearch onNavigate={onNavigate} />
          </div>
          <HomePromotionBanner onNavigate={onNavigate} />
          <div className="min-w-0">{children}</div>
        </main>

        <aside className="xl:sticky xl:top-4">
          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                Need assistance?
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">Talk to our team</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Get help choosing the right service or division for your needs.
              </p>
              <div className="mt-4 space-y-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Phone className="h-4 w-4 text-blue-700" aria-hidden="true" />
                    <span className="truncate">{phone}</span>
                  </a>
                )}
                {companySettings.email && (
                  <a
                    href={`mailto:${companySettings.email}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                    <span className="truncate">{companySettings.email}</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/contact')}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-950"
              >
                Visit contact page
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </section>

            {offices.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  <h2 className="text-sm font-bold text-slate-900">Our locations</h2>
                </div>
                <div className="mt-3 space-y-3">
                  {offices.map((office) => (
                    <a
                      key={`${office.name}-${office.city}`}
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        office.mapQuery || `${office.address} ${office.city}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <span className="block text-sm font-semibold text-slate-800">{office.name}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {[office.address, office.city, office.country].filter(Boolean).join(', ')}
                      </span>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800">
                        View map <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {divisions.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900">Popular divisions</h2>
                  <Heart className="h-4 w-4 text-blue-700" aria-hidden="true" />
                </div>
                <div className="mt-3 space-y-1">
                  {divisions.map((division) => (
                    <button
                      type="button"
                      key={division.id}
                      onClick={() => openBannerTarget(division.externalUrl || division.route, onNavigate)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-800"
                    >
                      <span className="truncate">{division.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900">Business information</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {companySettings.description || companySettings.tagline || companySettings.name}
              </p>
              {workingHours.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Clock3 className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
                    Business hours
                  </div>
                  {workingHours.slice(0, 3).map(([day, hours]) => (
                    <div key={day} className="flex justify-between gap-2 text-[11px] text-slate-500">
                      <span className="capitalize">{day.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              )}
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-700 hover:bg-blue-50 hover:text-blue-800"
                    >
                      {social.name}
                      <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[10px] text-slate-400">
                {companySettings.domain || 'Mahdev Pvt Ltd'}
              </p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};
