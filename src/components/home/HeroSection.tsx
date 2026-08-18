import React, { useState, useEffect } from 'react';
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
import { cmsService } from '../../services/cmsService';
import { HomepageCmsConfig } from '../../types/cms';

interface HeroSectionProps {
  onNavigate: (route: string) => void;
  onExploreMahdev: () => void;
  onExploreServices: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  onExploreMahdev,
  onExploreServices,
}) => {
  const [config, setConfig] = useState<HomepageCmsConfig>(() => cmsService.getHomepageConfig());

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(cmsService.getHomepageConfig());
    };
    const unsub = cmsService.subscribeHomepage(handleUpdate);
    return () => unsub();
  }, []);

  const hero = config.hero;
  const fullTitle = `${hero.titleLine1} ${hero.titleHighlight} ${hero.titleLine2}`.trim();

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
            text={fullTitle || 'Creating Moments. Capturing Memories. Delivering Innovation.'}
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
                {hero.primaryCtaLabel || 'Explore Mahdev'}
              </Button>
            </Magnetic>

            <Magnetic strength={0.25}>
              <Button
                id="hero-explore-services-btn"
                variant="outline"
                size="lg"
                onClick={onExploreServices}
                rightIcon={<Compass className="w-4 h-4" />}
                className="w-full sm:w-auto bg-white/95 backdrop-blur-xs hover:bg-slate-50 hover:border-blue-300 cursor-pointer"
              >
                {hero.secondaryCtaLabel || 'Explore Our Services'}
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              {DIVISION_LIST.map((division) => (
                <Magnetic key={division.id} strength={0.15}>
                  <button
                    id={`hero-division-pill-${division.id}`}
                    onClick={() => onNavigate(division.route)}
                    className="group px-3.5 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-medium text-slate-700 hover:text-[#0052FF] hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#0052FF] transition-colors" />
                    <span>{division.shortName}</span>
                  </button>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

