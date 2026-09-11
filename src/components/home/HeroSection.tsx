import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Phone, MessageCircle, Sparkles, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Button } from '../ui/Button';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getTelLink } from '../../config/company';
import { HeroShowcaseSlideItem } from '../../types/cms';
import { getWhatsAppInquiryUrl } from '../../utils/whatsapp';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { ParallelWatermark } from '../motion/ParallelScroll';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const DEFAULT_HERO_SHOWCASE_ITEMS: HeroShowcaseSlideItem[] = [
  {
    id: 'sws',
    name: 'SWS Event Management',
    badge: 'Luxury Events & Staging',
    tagline: 'Creating Moments... Luxury Event Decor & Rentals',
    highlight: '5,000+ Rental Inventory • Mandaps • Stage Lighting',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    route: '/sws',
  },
  {
    id: 'u1',
    name: 'U1 Studio',
    badge: 'Cinema & Photography',
    tagline: 'Capturing Memories... 8K Cinema & Commercials',
    highlight: 'Master Portraiture • Drone Filming • Brand Campaigns',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=85',
    route: '/u1',
  },
  {
    id: 'it',
    name: 'Mahdev IT & Solutions',
    badge: 'Software & Cloud',
    tagline: 'Delivering Innovation... Web, Mobile & Enterprise Cloud',
    highlight: 'Custom Web Apps • Scalable API Systems • 99.9% SLA',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=85',
    route: '/it',
  },
  {
    id: 'travels',
    name: 'Mahdev Travels',
    badge: 'Bespoke Travel',
    tagline: 'Discover Paradise... Curated Ceylon Itineraries',
    highlight: 'Chauffeur Fleet • Boutique Villas • Islandwide Tours',
    image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=85',
    route: '/travels',
  },
  {
    id: 'mart',
    name: 'Mahdev Online Mart',
    badge: 'Decor & Tech Mart',
    tagline: 'Modern Living... Premium Decor & Smart Tech',
    highlight: 'Verified Hardware • Direct Islandwide Courier Delivery',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    route: '/mart',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onContactUs,
}) => {
  const { homepageConfig, divisions, companySettings, siteSettings, products } = useFirestoreDataContext();
  const heroConfig = homepageConfig?.hero;

  const rentalCount = getRentalAssetCount(
    products,
    (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  // Derive dynamic Hero Media Slider slides from CMS configuration or Firestore divisions
  const showcaseItems = useMemo<HeroShowcaseSlideItem[]>(() => {
    const getCanonicalRoute = (id: string, fallbackRoute: string) => {
      if (id === 'sws') return '/sws';
      if (id === 'u1') return '/u1';
      if (id === 'it') return '/it';
      if (id === 'travels') return '/travels';
      if (id === 'mart') return '/mart';
      return fallbackRoute.startsWith('/') ? fallbackRoute : `/${fallbackRoute}`;
    };

    if (heroConfig?.showcaseItems && heroConfig.showcaseItems.length > 0) {
      return heroConfig.showcaseItems.map((item) => ({
        ...item,
        highlight:
          item.id === 'sws' && item.highlight?.includes('5,000+')
            ? item.highlight.replace('5,000+', rentalCount)
            : item.highlight,
        route: getCanonicalRoute(item.id, item.route || `/${item.id}`),
      }));
    }

    // Populate directly from live Firestore divisions
    if (divisions && divisions.length > 0) {
      const canonicalMap: Record<string, string> = {
        'sws-event-management': 'sws',
        'u1-studio': 'u1',
        'it-solutions': 'it',
        'mahdev-travels': 'travels',
        'online-mart': 'mart',
      };

      const seen = new Set<string>();
      const items: HeroShowcaseSlideItem[] = [];

      for (const d of divisions) {
        const id = canonicalMap[d.id] || d.slug || d.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const img = d.heroImageUrl || d.imageUrl || (d.hero as any)?.bgImage || d.logoUrl || '';
        const defaultHighlight =
          id === 'sws'
            ? `${rentalCount} Rental Inventory • Mandaps • Stage Lighting`
            : d.heroSubheadline || d.tagline || d.shortDescription || 'Verified Direct In-House Delivery';

        items.push({
          id,
          name: d.name,
          badge: d.badge || (d.hero as any)?.badge || 'Enterprise Division',
          tagline: (d.hero as any)?.subtitle || d.tagline || d.shortDescription || '',
          highlight: defaultHighlight,
          image: img,
          route: getCanonicalRoute(id, d.route || `/${id}`),
        });
      }

      if (items.length > 0) {
        return items;
      }
    }

    return DEFAULT_HERO_SHOWCASE_ITEMS.map((item) => {
      if (item.id === 'sws') {
        return {
          ...item,
          highlight: `${rentalCount} Rental Inventory • Mandaps • Stage Lighting`,
        };
      }
      return item;
    });
  }, [heroConfig?.showcaseItems, divisions, rentalCount]);

  const [activeTab, setActiveTab] = useState<string>(() => showcaseItems[0]?.id || 'sws');
  const [isPaused, setIsPaused] = useState(false);
  const hotline = companySettings?.primaryPhone || '075 092 8078';

  // Ensure active tab points to a valid slide ID when showcaseItems change
  useEffect(() => {
    if (!showcaseItems.some((item) => item.id === activeTab) && showcaseItems[0]) {
      setActiveTab(showcaseItems[0].id);
    }
  }, [showcaseItems, activeTab]);

  // Smooth auto-cycling through showcase tabs if user is not hovering
  useEffect(() => {
    if (isPaused || showcaseItems.length <= 1) return;
    const timer = setInterval(() => {
      setActiveTab((prev) => {
        const idx = showcaseItems.findIndex((item) => item.id === prev);
        const nextIdx = (idx + 1) % showcaseItems.length;
        return showcaseItems[nextIdx].id;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, showcaseItems]);

  const currentItem =
    showcaseItems.find((item) => item.id === activeTab) || showcaseItems[0] || DEFAULT_HERO_SHOWCASE_ITEMS[0];

  const badgeText = heroConfig?.badgeText || 'Mahdev Group • 5 Operating Enterprise Divisions';
  const titleLine1 = heroConfig?.titleLine1 || 'Creating Moments.';
  const titleHighlight = heroConfig?.titleHighlight || 'Capturing Memories.';
  const titleLine2 = heroConfig?.titleLine2 || 'Delivering Innovation.';
  const description =
    heroConfig?.description ||
    'Turnkey event management, cinema media, software engineering, bespoke travel, and curated decor & tech commerce under unified Sri Lankan governance.';
  const primaryCtaLabel = heroConfig?.primaryCtaLabel || 'Explore Divisions';

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.1 });
  const yBackdrop = useTransform(smoothProgress, [0, 1], ['0%', '18%']);
  const yContent = useTransform(smoothProgress, [0, 1], ['0px', '32px']);
  const yShowcase = useTransform(smoothProgress, [0, 1], ['0px', '-28px']);
  const opacityFade = useTransform(smoothProgress, [0, 0.9], [1, 0.45]);

  // Current active showcase WhatsApp URL containing division image & details
  const activeWhatsAppUrl = useMemo(() => {
    return getWhatsAppInquiryUrl({
      title: currentItem.name,
      divisionName: currentItem.name,
      category: currentItem.badge,
      imageUrl: currentItem.image,
      description: currentItem.highlight || currentItem.tagline,
      type: 'general',
    });
  }, [currentItem]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative bg-slate-950 text-white pt-16 pb-16 lg:pt-24 lg:pb-24 border-b border-slate-800/80 overflow-hidden"
    >
      {/* Subtle Optical Ambient Glow with Parallel Drift */}
      <motion.div
        style={{ y: yBackdrop }}
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-900/15 rounded-full blur-3xl pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_10%,transparent_40%,#020617_100%)] pointer-events-none" />

      <motion.div
        style={{ opacity: opacityFade }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Sharp Editorial Copy & Action CTAs with Parallax */}
          <motion.div style={{ y: yContent }} className="lg:col-span-7 space-y-6">
            {/* Status Metadata Pill */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-2xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="tracking-wide">{badgeText}</span>
            </motion.div>

            {/* Main Headline - Clean, Authoritative Human Conglomerate Typography */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.14]">
                {titleLine1}{' '}
                <span className="text-slate-300 font-medium">
                  {titleHighlight}
                </span>{' '}
                {titleLine2}
              </h1>
            </motion.div>

            {/* High-Impact Value Proposition */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl font-normal"
            >
              {description}
            </motion.p>

            {/* Corporate Hotline & WhatsApp Indicators - Mobile & Web */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 }}
              className="flex flex-wrap items-center gap-2 pt-1"
            >
              <a
                href={getTelLink(hotline)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono hover:border-slate-700 hover:text-white transition-colors shadow-2xs"
                title="Direct Corporate Hotline 075 092 8078"
              >
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Hotline: <strong className="text-white">075 092 8078</strong></span>
              </a>
              <a
                href={activeWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono hover:bg-emerald-900/50 transition-colors shadow-2xs"
                title="Corporate WhatsApp 075 092 8078"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WhatsApp: <strong className="text-emerald-200">075 092 8078</strong></span>
              </a>
            </motion.div>

            {/* Direct CTAs: Explore + Call Hotline + Direct WhatsApp with Image */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                id="hero-explore-mahdev-btn"
                onClick={onExploreMahdev}
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-slate-100 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={getTelLink(hotline)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-200 text-sm font-medium hover:border-slate-700 hover:text-white transition-colors backdrop-blur-sm"
                title="Call Corporate Hotline 075 092 8078"
              >
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Call 075 092 8078</span>
              </a>

              <a
                href={activeWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Send inquiry to Corporate WhatsApp 075 092 8078"
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>WhatsApp 075 092 8078</span>
              </a>
            </motion.div>

            {/* Interactive Division Quick Selector */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2"
            >
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                Divisions:
              </span>
              {showcaseItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  {item.name.replace('Mahdev ', '')}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive Division Showcase Deck */}
          <motion.div
            style={{ y: yShowcase }}
            className="lg:col-span-5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-2 sm:p-2.5 shadow-xl overflow-hidden backdrop-blur-sm ring-1 ring-white/[0.04]"
            >
              {/* Clean Segmented Tabs Header */}
              <div className="flex gap-1 p-1 bg-slate-950/90 rounded-xl border border-slate-800/90 mb-2 overflow-x-auto scrollbar-none">
                {showcaseItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex-1 min-w-[54px] relative py-1.5 px-2 text-center rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="hero-active-tab-pill"
                          className="absolute inset-0 bg-blue-600 rounded-lg"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10 block truncate">
                        {item.id.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Animated Card Body */}
              <div className="relative rounded-xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] bg-slate-950 border border-slate-800/80 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItem.id}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <img
                      src={currentItem.image}
                      alt={currentItem.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                    {/* Card Content Overlay */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-between">
                      {/* Top Metadata Row */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
                          {currentItem.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-800 backdrop-blur-md">
                          Incorporated 2022
                        </span>
                      </div>

                      {/* Bottom Info & Launch Buttons */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-tight">
                            {currentItem.name}
                          </h3>
                          <p className="text-xs text-slate-300 font-normal mt-0.5 line-clamp-1">
                            {currentItem.highlight}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <a
                            href={activeWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                            title="Inquire via WhatsApp 075 092 8078"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>WhatsApp (075 092 8078)</span>
                          </a>

                          <button
                            onClick={() => onNavigate(currentItem.route)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs group/btn"
                          >
                            <span>View Division</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
