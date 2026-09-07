import React, { useMemo, useRef } from 'react';
import { ArrowRight, Sparkles, Calendar, Layers, ShieldCheck, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { openWhatsAppInquiry } from '../../utils/whatsapp';
import { ParallelWatermark } from '../motion/ParallelScroll';
import { useDeviceMotion } from '../motion/MotionWrappers';

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
  route: string;
  metrics: string[];
  isFeatured?: boolean;
}

const DEFAULT_DIVISION_BENTO_DATA: BentoDivisionItem[] = [
  {
    id: 'sws',
    name: 'SWS Event Management',
    badge: 'Primary Flagship Division',
    subtitle: 'Luxury Weddings, Stage Decor & 5,000+ Rental Units',
    summary: 'Sri Lanka’s premier event production unit for grand floral mandaps, banquet staging, concert AV, and comprehensive equipment rentals.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
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
    route: '/it',
    metrics: ['Web Apps', 'Mobile', 'Cloud 99.9%'],
    isFeatured: false,
  },
  {
    id: 'travels',
    name: 'Mahdev Travels',
    badge: 'Bespoke Travel',
    subtitle: 'Curated Islandwide Expeditions',
    summary: 'Dedicated luxury chauffeur fleets, boutique villa reservations, and personalized Ceylon journeys.',
    image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=800&q=80',
    route: '/travels',
    metrics: ['Chauffeur Fleet', 'Custom Itineraries', '24/7 Support'],
    isFeatured: false,
  },
  {
    id: 'mart',
    name: 'Mahdev Online Mart',
    badge: 'Decor & Tech Hardware',
    subtitle: 'Premium Living Essentials',
    summary: 'Curated home aesthetics, ambient interior decor, and verified smart technology delivered nationwide.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    route: '/mart',
    metrics: ['Decor Items', 'Tech Hardware', 'Islandwide Courier'],
    isFeatured: false,
  },
];

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate }) => {
  const { companySettings, homepageConfig, divisions } = useFirestoreDataContext();

  const sectionConfig = homepageConfig?.divisionsSection;
  if (sectionConfig?.enabled === false) return null;

  const sectionBadge = sectionConfig?.badge || 'Enterprise Portfolio';
  const sectionTitle = sectionConfig?.title || 'Operating Divisions';
  const sectionSubtitle =
    sectionConfig?.subtitle ||
    `Autonomous specialized units governed under ${companySettings?.name || 'Mahdev Group'} with direct in-house technical crews.`;

  // Dynamically map divisions using live updates from Admin Portal / FirestoreDataContext
  const bentoDivisions = useMemo<BentoDivisionItem[]>(() => {
    const getCanonicalRoute = (id: string, fallbackRoute: string) => {
      if (id === 'sws') return '/sws';
      if (id === 'u1') return '/u1';
      if (id === 'it') return '/it';
      if (id === 'travels') return '/travels';
      if (id === 'mart') return '/mart';
      return fallbackRoute.startsWith('/') ? fallbackRoute : `/${fallbackRoute}`;
    };

    return DEFAULT_DIVISION_BENTO_DATA.map((fallback) => {
      const liveDiv = divisions?.find(
        (d) =>
          d.id === fallback.id || d.slug === fallback.id || (d as any).divisionKey === fallback.id
      );
      if (liveDiv) {
        return {
          ...fallback,
          name: liveDiv.name || fallback.name,
          badge: liveDiv.badge || fallback.badge,
          subtitle: liveDiv.tagline || liveDiv.shortDescription || fallback.subtitle,
          summary: liveDiv.description || liveDiv.aboutText || fallback.summary,
          image:
            liveDiv.imageUrl ||
            liveDiv.heroImageUrl ||
            (liveDiv.hero as any)?.bgImage ||
            fallback.image,
          route: getCanonicalRoute(fallback.id, liveDiv.route || fallback.route),
          metrics:
            liveDiv.stats && liveDiv.stats.length > 0
              ? liveDiv.stats.map((s) => `${s.value} ${s.label}`)
              : fallback.metrics,
        };
      }
      return {
        ...fallback,
        route: getCanonicalRoute(fallback.id, fallback.route),
      };
    });
  }, [divisions]);

  const sws = bentoDivisions[0];

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
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-700 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{sectionBadge}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              {sectionTitle}
            </h2>
          </div>
          <div className="md:max-w-md">
            <p className="text-slate-600 text-sm leading-relaxed font-normal">
              {sectionSubtitle}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct inquiries active at 075 092 8078</span>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Flagship Card: SWS Event Management */}
          {sws && (
            <motion.div
              style={{ y: yParallaxLeft }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => onNavigate(sws.route)}
              className="lg:col-span-7 group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-end min-h-[400px] lg:min-h-[440px]"
            >
              <img
                src={sws.image}
                alt={sws.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />

              <div className="relative p-6 sm:p-8 space-y-3.5 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider bg-rose-700 text-white font-semibold">
                    {sws.badge}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-white/10 text-white backdrop-blur-md border border-white/10">
                    5,000+ Rental Inventory
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight group-hover:text-rose-200 transition-colors">
                    {sws.name}
                  </h3>
                  <p className="text-slate-300 text-xs font-medium mt-1">
                    {sws.subtitle}
                  </p>
                </div>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                  {sws.summary}
                </p>

                <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {sws.metrics.map((m) => (
                      <span
                        key={m}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-200 bg-black/40 border border-white/10"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppInquiry(e, sws)}
                      title="Inquire via WhatsApp (0750928078)"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] px-3.5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors border border-white/10">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Side Stack: U1 Studio and Mahdev IT */}
          <motion.div
            style={{ y: yParallaxRight }}
            className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6"
          >
            {bentoDivisions.slice(1, 3).map((div) => {
              const badgeBg = div.id === 'u1' ? 'bg-amber-700' : 'bg-blue-700';
              return (
                <motion.div
                  key={div.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onNavigate(div.route)}
                  className="group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-end min-h-[210px] p-6"
                >
                  <img
                    src={div.image}
                    alt={div.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

                  <div className="relative z-10 space-y-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider text-white ${badgeBg}`}>
                      {div.badge}
                    </span>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                      {div.name}
                    </h3>
                    <p className="text-slate-300 text-xs line-clamp-1">
                      {div.summary}
                    </p>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-slate-300">
                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppInquiry(e, div)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Inquire 0750928078</span>
                      </button>
                      <span className="font-medium text-slate-300 group-hover:text-white flex items-center gap-1 transition-colors">
                        Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* 3. Bottom Row: Mahdev Travels and Mahdev Online Mart */}
          {bentoDivisions.slice(3, 5).map((div) => {
            const badgeBg = div.id === 'travels' ? 'bg-teal-700' : 'bg-indigo-700';
            return (
              <motion.div
                key={div.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => onNavigate(div.route)}
                className="lg:col-span-6 group relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-end min-h-[230px] p-6 sm:p-7"
              >
                <img
                  src={div.image}
                  alt={div.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

                <div className="relative z-10 space-y-2.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider text-white ${badgeBg}`}>
                    {div.badge}
                  </span>
                  <h3 className="font-display text-xl font-bold text-white group-hover:text-slate-200 transition-colors">
                    {div.name}
                  </h3>
                  <p className="text-slate-300 text-xs line-clamp-1 max-w-lg">
                    {div.summary}
                  </p>

                  <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                    <div className="flex gap-2">
                      {div.metrics.map((m) => (
                        <span
                          key={m}
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-medium text-slate-200 bg-black/40 border border-white/10"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleWhatsAppInquiry(e, div)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Inquire</span>
                      </button>
                      <span className="font-medium text-slate-300 group-hover:text-white flex items-center gap-1 transition-colors">
                        View Division <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionContainer>
    </div>
  );
};
