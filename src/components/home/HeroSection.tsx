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

const LINE_1 = 'Creating Moments.';
const LINE_2 = 'Capturing Memories.';
const LINE_3 = 'Delivering Innovation.';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMahdev,
  onExploreServices,
}) => {
  const { homepageConfig } = useFirestoreDataContext();
  const heroConfig = homepageConfig?.hero;

  // Smooth, slightly slow sequential typing animation across the three lines
  const [typedLine1, setTypedLine1] = useState('');
  const [typedLine2, setTypedLine2] = useState('');
  const [typedLine3, setTypedLine3] = useState('');
  const [activeLine, setActiveLine] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    let charIdx = 0;
    setTypedLine1('');
    setTypedLine2('');
    setTypedLine3('');
    setActiveLine(1);

    // Typing speed: smooth, gentle ~65-70ms per character
    const TYPING_SPEED = 70;
    const LINE_PAUSE = 280;

    const interval = setInterval(() => {
      // Phase 1: Line 1
      if (charIdx < LINE_1.length) {
        charIdx++;
        setTypedLine1(LINE_1.slice(0, charIdx));
      } else if (charIdx === LINE_1.length) {
        charIdx++;
        setActiveLine(2);
      }
      // Phase 2: Line 2
      else if (charIdx < LINE_1.length + 1 + LINE_2.length) {
        const line2Idx = charIdx - (LINE_1.length + 1);
        charIdx++;
        setTypedLine2(LINE_2.slice(0, line2Idx));
      } else if (charIdx === LINE_1.length + 1 + LINE_2.length) {
        charIdx++;
        setActiveLine(3);
      }
      // Phase 3: Line 3
      else if (charIdx < LINE_1.length + 1 + LINE_2.length + 1 + LINE_3.length) {
        const line3Idx = charIdx - (LINE_1.length + 1 + LINE_2.length + 1);
        charIdx++;
        setTypedLine3(LINE_3.slice(0, line3Idx));
      } else {
        setActiveLine(4);
        clearInterval(interval);
      }
    }, TYPING_SPEED);

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
      className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-[#061033] text-white"
    >
      {/* Reliable Full-Width Video Background */}
      <HeroVideoBackground
        videoUrl={effectiveVideoUrl}
        title="Mahdev Enterprise Showcase"
      />

      {/* Dark gradient overlay on left to ensure high readability and contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061033]/90 via-[#061033]/70 to-transparent z-10 pointer-events-none" />

      {/* Hero Content Overlay — Left-Aligned */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 z-20 w-full text-left">
        <div className="max-w-2xl sm:max-w-3xl space-y-6">
          {/* Animated 3-Line Taglines with reduced, elegant font size */}
          <div className="space-y-1 sm:space-y-2">
            {/* Line 1 */}
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight drop-shadow-md min-h-[38px] sm:min-h-[46px] md:min-h-[54px] flex items-center">
              <span>{typedLine1}</span>
              {activeLine === 1 && (
                <span className="inline-block w-0.5 h-6 sm:h-8 md:h-9 ml-2 align-middle bg-[#00D2FF] animate-pulse" />
              )}
            </h1>

            {/* Line 2 */}
            <div className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#00D2FF] leading-tight drop-shadow-md min-h-[38px] sm:min-h-[46px] md:min-h-[54px] flex items-center">
              <span>{typedLine2}</span>
              {activeLine === 2 && (
                <span className="inline-block w-0.5 h-6 sm:h-8 md:h-9 ml-2 align-middle bg-white animate-pulse" />
              )}
            </div>

            {/* Line 3 */}
            <div className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#93C5FD] leading-tight drop-shadow-md min-h-[38px] sm:min-h-[46px] md:min-h-[54px] flex items-center">
              <span>{typedLine3}</span>
              {(activeLine === 3 || activeLine === 4) && (
                <span
                  className={`inline-block w-0.5 h-6 sm:h-8 md:h-9 ml-2 align-middle bg-[#00D2FF] ${
                    activeLine === 4 ? 'animate-pulse' : 'animate-ping'
                  }`}
                />
              )}
            </div>
          </div>

          {/* Single Primary Action Button: Explore Our Services */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="pt-4 sm:pt-6"
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
      </div>
    </section>
  );
};

