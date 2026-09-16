import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { HeroVideoBackground } from '../common/HeroVideoBackground';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

const FULL_TAGLINE = 'Creating Moments. Capturing Memories. Delivering Innovation.';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMahdev,
  onExploreServices,
}) => {
  const { homepageConfig } = useFirestoreDataContext();
  const heroConfig = homepageConfig?.hero;

  // Typing animation state
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    setTypedText('');
    setIsTypingComplete(false);

    const interval = setInterval(() => {
      index++;
      if (index <= FULL_TAGLINE.length) {
        setTypedText(FULL_TAGLINE.slice(0, index));
      } else {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Admin Uploaded Media or Fallback to /assets/hero_video.mp4
  const rawCandidateVideo =
    heroConfig?.videoUrl?.trim() ||
    (heroConfig as any)?.heroVideoUrl?.trim() ||
    (heroConfig?.mediaType === 'video' ? heroConfig?.mediaUrl?.trim() : '') ||
    '';

  const isDefaultOrPlaceholder =
    !rawCandidateVideo ||
    rawCandidateVideo.includes('assets.mixkit.co') ||
    rawCandidateVideo === '';

  const effectiveVideoUrl = isDefaultOrPlaceholder
    ? '/assets/hero_video.mp4'
    : rawCandidateVideo;

  const handleExplore = () => {
    if (onExploreServices) {
      onExploreServices();
    } else {
      onExploreMahdev();
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#061033] text-white"
    >
      {/* Reliable Full-Width Video Background - Uploaded Video */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        title="Mahdev Enterprise Showcase"
      />

      {/* Hero Content Overlay */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 lg:py-32 z-20 w-full text-center flex flex-col items-center">
        {/* Typing Tagline with Smaller, Elegant Font */}
        <div className="min-h-[72px] sm:min-h-[96px] md:min-h-[110px] flex items-center justify-center">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-snug sm:leading-tight drop-shadow-lg max-w-4xl">
            <span>{typedText}</span>
            <span
              className={`inline-block w-0.5 h-6 sm:h-8 md:h-10 ml-1.5 align-middle bg-[#00D2FF] ${
                isTypingComplete ? 'animate-pulse' : 'animate-ping'
              }`}
            />
          </h1>
        </div>

        {/* Single Primary Action Button: Explore Our Services */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-8 sm:pt-10"
        >
          <button
            id="hero-explore-services-btn"
            onClick={handleExplore}
            className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#0052FF] via-[#0066FF] to-[#0052FF] hover:brightness-110 text-white font-semibold text-sm sm:text-base px-8 py-3.5 sm:px-9 sm:py-4 rounded-xl shadow-xl shadow-[#0052FF]/35 hover:shadow-2xl hover:shadow-[#0052FF]/55 transition-all cursor-pointer active:scale-98"
          >
            <span>Explore Our Services</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

