import React, { useMemo } from 'react';
import { ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getTelLink } from '../../config/company';
import { getWhatsAppInquiryUrl } from '../../utils/whatsapp';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
}) => {
  const { homepageConfig, companySettings, divisions } = useFirestoreDataContext();
  const heroConfig = homepageConfig?.hero;

  const hotline = companySettings?.primaryPhone || '075 092 8078';

  const badgeText = heroConfig?.badgeText || 'Mahdev (Pvt) Ltd • Enterprise Conglomerate';
  const titleLine1 = heroConfig?.titleLine1 || 'Creating Moments';
  const titleHighlight = heroConfig?.titleHighlight || 'Capturing Memories';
  const titleLine2 = heroConfig?.titleLine2 || 'Delivering Innovation';
  const primaryCtaLabel = heroConfig?.primaryCtaLabel || 'Explore Divisions';

  const [videoFailed, setVideoFailed] = React.useState(false);

  // Admin Uploaded Media from Firestore
  const rawMediaUrl =
    heroConfig?.mediaUrl?.trim() ||
    (heroConfig as any)?.videoUrl?.trim() ||
    '';

  const rawImageUrl =
    (heroConfig as any)?.imageUrl?.trim() ||
    (!rawMediaUrl.includes('.mp4') &&
     !rawMediaUrl.includes('.webm') &&
     !rawMediaUrl.includes('.ogg') &&
     !rawMediaUrl.startsWith('data:video') &&
     !rawMediaUrl.includes('youtube.com') &&
     !rawMediaUrl.includes('youtu.be')
      ? rawMediaUrl
      : '');

  const isExplicitVideo = heroConfig?.mediaType === 'video';
  const isExplicitImage = heroConfig?.mediaType === 'image';
  const isVideoUrl =
    rawMediaUrl.includes('.mp4') ||
    rawMediaUrl.includes('.webm') ||
    rawMediaUrl.includes('.ogg') ||
    rawMediaUrl.startsWith('data:video') ||
    rawMediaUrl.includes('youtube.com') ||
    rawMediaUrl.includes('youtu.be');

  const isVideo =
    !videoFailed &&
    (isExplicitVideo
      ? rawMediaUrl.trim() !== ''
      : isExplicitImage
      ? false
      : isVideoUrl && rawMediaUrl.trim() !== '');

  // Fallback high-impact visuals
  const effectiveImageUrl =
    rawImageUrl ||
    (heroConfig?.mediaType !== 'video' ? rawMediaUrl : '') ||
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

  const effectiveVideoUrl = rawMediaUrl;

  const divisionLinks = useMemo(() => {
    if (divisions && divisions.length > 0) {
      return divisions
        .filter((d) => d.status !== 'inactive')
        .slice(0, 5)
        .map((d) => ({
          id: d.id,
          name: d.shortName || d.name,
          route: d.route || `/${d.slug || d.id}`,
        }));
    }
    return [
      { id: 'sws', name: 'Events & Decor', route: '/sws' },
      { id: 'u1', name: 'Cinema & Studio', route: '/u1' },
      { id: 'it', name: 'Software & Cloud', route: '/it' },
      { id: 'travels', name: 'Luxury Travels', route: '/travels' },
      { id: 'mart', name: 'Online Mart', route: '/mart' },
    ];
  }, [divisions]);

  const whatsappInquiryUrl = useMemo(() => {
    return getWhatsAppInquiryUrl({
      title: 'Consultation & Inquiries',
      divisionName: 'Mahdev (Pvt) Ltd',
      category: 'Inquiry Desk',
      description: 'Inquiry from official website hero section.',
      type: 'general',
    });
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-slate-950 text-white"
    >
      {/* ================= FULL SCREEN WIDTH BACKGROUND VIDEO / PICTURE COVER ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {isVideo ? (
          effectiveVideoUrl.includes('youtube.com') || effectiveVideoUrl.includes('youtu.be') ? (
            <iframe
              src={
                effectiveVideoUrl.includes('embed')
                  ? effectiveVideoUrl
                  : `https://www.youtube.com/embed/${effectiveVideoUrl.split('v=')[1] || effectiveVideoUrl.split('/').pop()}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0`
              }
              title="Mahdev Overview Video"
              className="w-full h-full object-cover pointer-events-none scale-125 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              src={effectiveVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setVideoFailed(true)}
              className="w-full h-full object-cover"
              title="Mahdev Overview Video"
            />
          )
        ) : (
          <img
            src={effectiveImageUrl}
            alt="Mahdev Official Showcase"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Left-Side Gradient Overlay: high contrast on the left, reveals media on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 sm:via-slate-950/70 md:via-slate-950/50 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none z-10" />
      </div>

      {/* ================= CONTENT OVER VIDEO ON LEFT SIDE ================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 z-20 w-full">
        <div className="max-w-3xl space-y-6">
          
          {/* Status Badge in Electric Blue */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0052FF]/20 border border-[#0052FF]/40 text-xs font-bold text-blue-300 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#0052FF] animate-pulse" />
              <span className="tracking-wide">{badgeText}</span>
            </div>
          </motion.div>

          {/* Main Headline - Bold, Direct, Over the Video with Left Gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white leading-[1.08] drop-shadow-md"
          >
            {titleLine1} <span className="text-[#3B82F6]">| {titleHighlight}</span> | {titleLine2}
          </motion.h1>

          {/* Primary Action Buttons in Electric Blue & Off-White */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center gap-3.5 pt-2"
          >
            <button
              id="hero-explore-mahdev-btn"
              onClick={onExploreMahdev}
              className="inline-flex items-center justify-center gap-2.5 bg-[#0052FF] hover:bg-blue-600 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all cursor-pointer active:scale-98"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors backdrop-blur-md shadow-sm"
              title={`Call Hotline ${hotline}`}
            >
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Call Us</span>
            </a>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 text-sm font-semibold transition-colors backdrop-blur-md shadow-sm"
              title="Send inquiry via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp</span>
            </a>
          </motion.div>

          {/* Division Quick Selector Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4 border-t border-white/15 flex flex-wrap items-center gap-2"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold mr-1">
              Divisions:
            </span>
            {divisionLinks.map((div) => (
              <button
                key={div.id}
                onClick={() => onNavigate(div.route)}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white/90 bg-white/10 hover:bg-[#0052FF] border border-white/15 hover:border-blue-400/50 transition-colors backdrop-blur-md cursor-pointer"
              >
                {div.name}
              </button>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};
