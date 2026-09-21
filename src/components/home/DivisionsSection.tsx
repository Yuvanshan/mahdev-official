import React, { useMemo, useRef } from 'react';
import { ArrowRight, Sparkles, Calendar, Layers, ShieldCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { getRentalAssetCount } from '../../utils/assetMetrics';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';
import { DataLoadingOverlay } from '../common/DataLoadingOverlay';

interface DivisionsSectionProps {
  onNavigate: (route: string) => void;
}

interface BentoDivisionItem {
  id: string;
  name: string;
  badge: string;
  subtitle: string;
  summary: string;
  image: string;
  logo?: string;
  route: string;
  metrics: string[];
  isFeatured?: boolean;
  isComingSoon?: boolean;
}

const DEFAULT_DIVISION_BENTO_DATA: BentoDivisionItem[] = [
  {
    id: 'sws',
    name: 'SWS Event Management',
    badge: 'Primary Flagship Division',
    subtitle: 'Luxury Weddings, Stage Decor & 5,000+ Rental Units',
    summary: 'Sri Lanka’s premier event production unit for grand floral mandaps, banquet staging, concert AV, and comprehensive equipment rentals.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    logo: '/assets/images/sws_logo.svg',
    route: '/sws',
    metrics: ['5,000+ Rentals', 'Floral Mandaps', 'Stage Lighting', 'Audio/Visual'],
    isFeatured: true,
  },
  {
    id: 'u1',
    name: 'U1 Studio',
    badge: 'Cinema & Photography',
    subtitle: 'Fine Art Visual Production',
    summary: 'Ultra-HD commercial filmmaking, cinema wedding cinematography, and professional studio portraiture.',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
    logo: '/assets/images/u1_logo.svg',
    route: '/u1',
    metrics: ['8K Cinema', 'Aerial Drones', 'Commercials'],
    isFeatured: false,
  },
  {
    id: 'it',
    name: 'Mahdev IT & Solutions',
    badge: 'Software & Cloud',
    subtitle: 'Enterprise Engineering',
    summary: 'Full-stack web applications, scalable mobile software, and secure cloud API architectures.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    logo: '/assets/images/it_logo.svg',
    route: '/it',
    metrics: ['Web Apps', 'Mobile', 'Cloud 99.9%'],
    isFeatured: false,
    isComingSoon: true,
  },
  {
    id: 'travels',
    name: 'Mahdev Travels',
    badge: 'Bespoke Travel',
    subtitle: 'Curated Islandwide Expeditions',
    summary: 'Dedicated luxury chauffeur fleets, boutique villa reservations, and personalized Ceylon journeys.',
    image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
    logo: '/assets/images/travels_logo.svg',
    route: '/travels',
    metrics: ['Chauffeur Fleet', 'Custom Itineraries', '24/7 Support'],
    isFeatured: false,
    isComingSoon: true,
  },
  {
    id: 'mart',
    name: 'Mahdev Online Mart',
    badge: 'Decor & Tech Hardware',
    subtitle: 'Premium Living Essentials',
    summary: 'Curated home aesthetics, ambient interior decor, and verified smart technology delivered nationwide.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    logo: '/assets/images/mart_logo.svg',
    route: '/mart',
    metrics: ['Decor Items', 'Tech Hardware', 'Islandwide Courier'],
    isFeatured: false,
    isComingSoon: true,
  },
];

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate }) => {
  const { companySettings, siteSettings, homepageConfig, divisions, products, isInitialLoading, isFetching } = useFirestoreDataContext();

  const sectionConfig = homepageConfig?.divisionsSection;
  if (sectionConfig?.enabled === false) return null;

  const sectionBadge = sectionConfig?.badge || 'Our divisions';
  const sectionTitle = sectionConfig?.title || 'Operating Divisions';
  const sectionSubtitle =
    sectionConfig?.subtitle ||
    `Specialized teams delivering integrated solutions across events, media, technology, travel and retail.`;

  const rentalAssetCountStr = getRentalAssetCount(
    products,
    (companySettings as any)?.rentalAssetCount || (siteSettings as any)?.rentalAssetCount
  );

  // Dynamically map divisions using live updates from Admin Portal / FirestoreDataContext
  const bentoDivisions = useMemo<BentoDivisionItem[]>(() => {
    const getCanonicalRoute = (id: string, fallbackRoute?: string) => {
      if (id === 'sws' || id === 'sws-event-management') return '/sws';
      if (id === 'u1' || id === 'u1-studio') return '/u1';
      if (id === 'it' || id === 'it-solutions') return '/it';
      if (id === 'travels' || id === 'mahdev-travels') return '/travels';
      if (id === 'mart' || id === 'online-mart') return '/mart';
      const r = fallbackRoute || `/${id}`;
      return r.startsWith('/') ? r : `/${r}`;
    };

    if (divisions && divisions.length > 0) {
      const canonicalOrder = ['sws', 'u1', 'it', 'travels', 'mart'];
      const canonicalMap: Record<string, string> = {
        'sws-event-management': 'sws',
        'u1-studio': 'u1',
        'it-solutions': 'it',
        'mahdev-travels': 'travels',
        'online-mart': 'mart',
      };

      const seen = new Set<string>();
      const list: BentoDivisionItem[] = [];

      for (const d of divisions) {
        const id = canonicalMap[d.id] || d.slug || d.id;
        if (seen.has(id)) continue;
        seen.add(id);

        const defaultComingSoon = id === 'it' || id === 'travels' || id === 'mart';
        const isComingSoon = (d as any).isComingSoon !== undefined
          ? !!(d as any).isComingSoon
          : (d as any).comingSoon !== undefined
          ? !!(d as any).comingSoon
          : (d as any).status !== undefined
          ? (d as any).status === 'coming_soon'
          : defaultComingSoon;

        const defaultFallbackItem =
          DEFAULT_DIVISION_BENTO_DATA.find((item) => item.id === id) || DEFAULT_DIVISION_BENTO_DATA[0];
        const rawImg = d.heroImageUrl || d.imageUrl || (d.hero as any)?.bgImage;
        const img =
          rawImg && typeof rawImg === 'string' && rawImg.trim() !== ''
            ? rawImg.trim()
            : defaultFallbackItem.image;

        const resolvedLogo =
          (d.logoUrl && typeof d.logoUrl === 'string' && d.logoUrl.trim() !== '' ? d.logoUrl.trim() : '') ||
          ((d as any)?.logo && typeof (d as any).logo === 'string' && (d as any).logo.trim() !== '' ? (d as any).logo.trim() : '') ||
          defaultFallbackItem.logo ||
          `/assets/images/${id}_logo.svg`;

        const metrics =
          d.stats && d.stats.length > 0
            ? d.stats.map((s) => `${s.value} ${s.label}`)
            : [];

        list.push({
          id,
          name: d.name,
          badge: d.badge || (d.hero as any)?.badge || '',
          subtitle: d.tagline || d.shortDescription || (d.hero as any)?.subtitle || '',
          summary: d.description || d.aboutText || d.shortDescription || '',
          image: img,
          logo: resolvedLogo,
          route: getCanonicalRoute(id, d.route),
          metrics,
          isFeatured: id === 'sws',
          isComingSoon,
        });
      }

      // Sort so sws is first (featured) if available, followed by canonical order
      list.sort((a, b) => {
        const idxA = canonicalOrder.indexOf(a.id);
        const idxB = canonicalOrder.indexOf(b.id);
        const orderA = idxA !== -1 ? idxA : 99;
        const orderB = idxB !== -1 ? idxB : 99;
        return orderA - orderB;
      });

      return list;
    }

    return [];
  }, [divisions, rentalAssetCountStr]);

  if (bentoDivisions.length === 0) {
    return null;
  }

  const sws = bentoDivisions[0];

  // Active divisions currently operating
  const activeDivisions = useMemo(() => {
    const list = bentoDivisions.filter((d) => !d.isComingSoon);
    return list.length > 0 ? list : bentoDivisions;
  }, [bentoDivisions]);

  // Upcoming divisions explicitly marked as Coming Soon in Admin Portal
  const comingSoonDivisions = useMemo(() => {
    return bentoDivisions.filter((d) => d.isComingSoon);
  }, [bentoDivisions]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, isTouch } = useDeviceMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.1 });
  const yParallaxLeft = useTransform(smoothProgress, [0, 1], ['25px', '-25px']);
  const yParallaxRight = useTransform(smoothProgress, [0, 1], ['-20px', '20px']);

  const handleWhatsAppInquiry = (
    e: React.MouseEvent,
    division: BentoDivisionItem
  ) => {
    e.stopPropagation();
    openWhatsAppInquiry({
      title: `${division.name} Service Inquiry`,
      divisionName: division.name,
      category: division.badge,
      imageUrl: division.image,
      description: division.subtitle || division.summary,
      type: 'general',
    });
  };

  return (
    <div ref={sectionRef} className="relative overflow-hidden bg-slate-50/50">
      <ParallelWatermark text="03 // DIVISIONS" />
      <SectionContainer id="divisions" background="subtle" paddingY="xl" hasBorderBottom>
        {/* Editorial Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-700 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{sectionBadge}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              {sectionTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Direct concierge inquiries active</span>
          </div>
        </div>

        {/* Operating Divisions Grid: Exclusively displays active divisions */}
        <div
          className={
            activeDivisions.length === 1
              ? 'max-w-2xl mx-auto w-full'
              : activeDivisions.length === 2
              ? 'grid grid-cols-2 md:grid-cols-2 max-w-4xl mx-auto gap-3 sm:gap-6'
              : 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6'
          }
        >
          {activeDivisions.map((div, idx) => {
            return (
              <motion.div
                key={div.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => onNavigate(div.route)}
                className={`group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-end min-h-[340px] sm:min-h-[360px] p-6 sm:p-7 ${
                  activeDivisions.length > 3 && idx === activeDivisions.length - 1 && activeDivisions.length % 2 === 1
                    ? 'md:col-span-2 lg:col-span-1'
                    : ''
                }`}
              >
                {/* Background Image: Uploaded Content */}
                {div.image && div.image.trim() !== '' ? (
                  <img
                    src={div.image}
                    alt={div.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
                )}
                {/* Dark Readability Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20" />

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    {/* Division Logo */}
                    {div.logo && (
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/95 backdrop-blur-md p-1.5 shadow-lg flex items-center justify-center border border-white/50 shrink-0 group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300">
                        <img
                          src={div.logo}
                          alt={`${div.name} logo`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.onerror = null;
                            target.src = `/assets/images/${div.id}_logo.svg`;
                          }}
                        />
                      </div>
                    )}
                    <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-[#0052FF] shadow-xs">
                      {div.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                      {div.name}
                    </h3>
                    {div.subtitle && (
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-1">
                        {div.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppInquiry(e, div)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    <div className="inline-flex items-center gap-1 font-semibold text-white group-hover:text-blue-300 transition-colors">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Upcoming Enterprise Divisions: Shown if any division is configured as Coming Soon */}
        {comingSoonDivisions.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Upcoming Enterprise Divisions
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {comingSoonDivisions.length} Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configured in Admin Portal • In active preparation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {comingSoonDivisions.map((div) => (
                <div
                  key={div.id}
                  onClick={() => onNavigate(div.route)}
                  className="group relative p-4 rounded-xl border border-slate-200/90 bg-white hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {div.logo && (
                          <div className="w-7 h-7 rounded-lg bg-slate-50 p-1 flex items-center justify-center border border-slate-200 shrink-0 shadow-xs">
                            <img
                              src={div.logo}
                              alt={div.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.onerror = null;
                                target.src = `/assets/images/${div.id}_logo.svg`;
                              }}
                            />
                          </div>
                        )}
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          {div.badge}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Sparkles className="w-2.5 h-2.5" /> Coming Soon
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {div.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {div.subtitle || div.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span className="text-[11px] text-amber-700 font-semibold">VIP Status & Updates</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
