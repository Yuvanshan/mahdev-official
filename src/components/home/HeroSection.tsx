import React from 'react';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { BodyLarge } from '../ui/Heading';
import { Button } from '../ui/Button';
import {
  SlideIn,
  BlurReveal,
  TextReveal,
  Magnetic,
  Floating3DObject,
  ParallaxContainer,
  TiltCard,
} from '../motion/MotionWrappers';
import { DIVISION_LIST } from '../../config/divisions';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onContactUs?: () => void;
  onExploreServices?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onContactUs,
  onExploreServices,
}) => {
  const { homepageConfig, divisions } = useFirestoreDataContext();
  const hero = homepageConfig.hero;
  const fullTitle = `${hero.titleLine1} ${hero.titleHighlight} ${hero.titleLine2}`.trim();
  const displayDivisions = divisions && divisions.length > 0 ? divisions : [];

  const handleSecondaryClick = () => {
    if (onContactUs) {
      onContactUs();
    } else if (onExploreServices) {
      onExploreServices();
    } else {
      onNavigate('/contact');
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white pt-20 pb-24 sm:pt-28 sm:pb-32 border-b border-slate-100"
    >
      {/* Background Media (Image / Gradient) */}
      {hero.mediaType === 'image' && hero.mediaUrl && (
        <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-multiply overflow-hidden">
          <img
            src={hero.mediaUrl}
            alt="Hero Backdrop"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 3D Floating Geometric Objects */}
      <Floating3DObject
        size={80}
        delay={0}
        duration={7}
        className="top-16 left-6 lg:left-20 opacity-70"
      />
      <Floating3DObject
        size={60}
        delay={1.5}
        duration={8}
        className="bottom-24 right-8 lg:right-24 opacity-60"
      />
      <Floating3DObject
        size={45}
        delay={2.5}
        duration={6}
        className="top-36 right-12 lg:right-40 opacity-50"
      />

      {/* Subtle mathematical grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0052FF08_1px,transparent_1px),linear-gradient(to_bottom,#0052FF08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative ambient blurred nodes with parallax */}
      <ParallaxContainer offset={25} className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-blue-100/50 blur-3xl rounded-full" />
      </ParallaxContainer>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Corporate Badge */}
        <SlideIn direction="up" delay={0.1}>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/95 border border-blue-200/90 text-[#0052FF] text-xs sm:text-sm font-semibold mb-6 shadow-xs backdrop-blur-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0052FF]" />
            </span>
            <span>{hero.badgeText || 'Mahdev Pvt Ltd • Parent Enterprise'}</span>
          </div>
        </SlideIn>

        {/* Main Brand Headline with Blur-To-Sharp Text Reveal */}
        <div className="max-w-4xl mx-auto mb-6">
          <TextReveal
            as="h1"
            text={fullTitle || 'Creating Moments... Capturing Memories... & Delivering Innovation...'}
            className="justify-center font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 leading-[1.15]"
            wordClassName="hover:text-[#0052FF] transition-colors duration-200"
            delay={0.15}
          />
        </div>

        {/* Supporting Description with Blur Reveal */}
        <BlurReveal delay={0.3} className="max-w-2xl mx-auto mb-10">
          <BodyLarge className="text-slate-600 text-base sm:text-lg leading-relaxed">
            {hero.description}
          </BodyLarge>
        </BlurReveal>

        {/* Primary & Secondary Call to Actions with Magnetic Physics */}
        <SlideIn direction="up" delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <Magnetic strength={0.3}>
              <Button
                id="hero-explore-mahdev-btn"
                variant="electric"
                size="lg"
                onClick={onExploreMahdev}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 cursor-pointer"
              >
                {hero.primaryCtaLabel || 'Explore Our Divisions'}
              </Button>
            </Magnetic>

            <Magnetic strength={0.25}>
              <Button
                id="hero-explore-services-btn"
                variant="outline"
                size="lg"
                onClick={handleSecondaryClick}
                rightIcon={<Compass className="w-4 h-4" />}
                className="w-full sm:w-auto bg-white/95 backdrop-blur-xs hover:bg-slate-50 hover:border-blue-300 cursor-pointer"
              >
                {hero.secondaryCtaLabel || 'Contact Us'}
              </Button>
            </Magnetic>
          </div>
        </SlideIn>

        {/* Quick Division Jump Bar with 3D depth */}
        <div className="mt-14 pt-8 border-t border-slate-200/70 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Five Divisions:
            </span>
            <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full -mx-4 px-4 sm:mx-0 sm:px-0">
              {displayDivisions.map((division) => {
                const isPrimary = Boolean((division as any).isPrimary || division.id === 'sws');
                const displayName = (division as any).shortName || division.name;
                const route = division.route || `/${division.slug || division.id}`;

                return (
                  <Magnetic key={division.id} strength={0.15}>
                    <button
                      id={`hero-division-pill-${division.id}`}
                      onClick={() => onNavigate(route)}
                      className={`group px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs shrink-0 ${
                        isPrimary
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500 hover:bg-blue-700'
                          : 'bg-white/90 border border-slate-200 text-slate-700 hover:text-[#0052FF] hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPrimary
                            ? 'bg-amber-300 animate-pulse'
                            : 'bg-slate-300 group-hover:bg-[#0052FF]'
                        } transition-colors`}
                      />
                      <span>{displayName}</span>
                      {isPrimary && (
                        <span className="text-[10px] font-bold text-amber-300">★ Primary</span>
                      )}
                    </button>
                  </Magnetic>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

