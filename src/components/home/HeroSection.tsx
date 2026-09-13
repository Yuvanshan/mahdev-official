import React, { useMemo } from 'react';
import { ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getTelLink } from '../../config/company';
import { getWhatsAppInquiryUrl } from '../../utils/whatsapp';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

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

  // Admin Uploaded Media from Firestore & Local Storage
  const rawCandidateVideo =
    heroConfig?.videoUrl?.trim() ||
    (heroConfig as any)?.heroVideoUrl?.trim() ||
    (heroConfig?.mediaType === 'video' ? heroConfig?.mediaUrl?.trim() : '') ||
    '';

  // Prevent 403 Forbidden on broken Mixkit hotlinks by routing directly to cloud Firestore video
  const candidateVideoUrl = rawCandidateVideo.includes('assets.mixkit.co')
    ? 'firestore://media_blobs/vid_corporate_hero_v1'
    : rawCandidateVideo;

  const rawMedia = heroConfig?.mediaUrl?.trim() || '';
  const isRawMediaVideo = Boolean(
    rawMedia &&
      (rawMedia.includes('.mp4') ||
        rawMedia.includes('.webm') ||
        rawMedia.includes('.ogg') ||
        rawMedia.includes('.mov') ||
        rawMedia.includes('.m4v') ||
        rawMedia.includes('youtube.com') ||
        rawMedia.includes('youtu.be') ||
        rawMedia.includes('vimeo.com') ||
        rawMedia.startsWith('firestore://') ||
        (rawMedia.includes('firebasestorage.googleapis.com') && rawMedia.includes('videos')) ||
        rawMedia.startsWith('/uploads/videos/') ||
        rawMedia.startsWith('data:video'))
  );

  // Show the video only - guaranteed video stream from Firestore cloud
  const effectiveVideoUrl =
    candidateVideoUrl ||
    (isRawMediaVideo ? rawMedia : '') ||
    'firestore://media_blobs/vid_corporate_hero_v1';

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
      className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex items-center overflow-hidden bg-[#061033] text-white"
    >
      {/* Reliable Full-Width Video Background - Video Only */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        title="Mahdev Enterprise Showcase"
      />

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
            {titleLine1} <span className="bg-gradient-to-r from-[#0052FF] via-[#0080FF] to-[#00D2FF] bg-clip-text text-transparent">| {titleHighlight}</span> | {titleLine2}
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
              className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#0052FF] hover:brightness-110 text-white font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-lg shadow-[#0052FF]/30 hover:shadow-xl hover:shadow-[#0052FF]/50 transition-all cursor-pointer active:scale-98"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-white/25 bg-white/10 hover:bg-[#0052FF]/20 hover:border-[#0052FF]/60 text-white text-sm font-semibold transition-colors backdrop-blur-md shadow-sm"
              title={`Call Hotline ${hotline}`}
            >
              <Phone className="w-4 h-4 text-[#00D2FF] shrink-0" />
              <span>Call Us</span>
            </a>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-[#0052FF]/20 border border-white/20 hover:border-[#0052FF]/50 text-white text-sm font-semibold transition-colors backdrop-blur-md shadow-sm"
              title="Send inquiry via WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#00D2FF] shrink-0" />
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
