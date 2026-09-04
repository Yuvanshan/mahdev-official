import React from 'react';
import { ArrowRight, Compass, Phone, ShieldCheck, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { SlideIn, Magnetic } from '../motion/MotionWrappers';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getTelLink } from '../../config/company';

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
  const { homepageConfig, divisions, companySettings } = useFirestoreDataContext();
  const hero = homepageConfig.hero;
  const fullTitle = `${hero.titleLine1 || 'Creating Moments.'} ${hero.titleHighlight || 'Capturing Memories.'} ${hero.titleLine2 || 'Delivering Innovation.'}`.trim();
  const displayDivisions = divisions && divisions.length > 0 ? divisions : [];
  const hotline = '075 092 8078';

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
      className="relative bg-white pt-20 pb-16 sm:pt-28 sm:pb-24 border-b border-slate-100 overflow-hidden"
    >
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Corporate Badge */}
        <SlideIn direction="up" delay={0.05}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
            <span>{hero.badgeText || 'Mahdev Group • Enterprise Holding'}</span>
          </div>
        </SlideIn>

        {/* Main Brand Headline */}
        <SlideIn direction="up" delay={0.1}>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12] max-w-4xl mx-auto">
            {fullTitle}
          </h1>
        </SlideIn>

        {/* Supporting Description */}
        <SlideIn direction="up" delay={0.15}>
          <p className="max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed mt-6">
            {hero.description ||
              'A Sri Lankan multi-disciplinary enterprise uniting luxury events, cinema-grade media, scalable software systems, bespoke travel, and commercial supply.'}
          </p>
        </SlideIn>

        {/* Primary & Secondary Call to Actions + Direct Hotline */}
        <SlideIn direction="up" delay={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-8">
            <Magnetic strength={0.2}>
              <Button
                id="hero-explore-mahdev-btn"
                variant="electric"
                size="lg"
                onClick={onExploreMahdev}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-semibold cursor-pointer"
              >
                {hero.primaryCtaLabel || 'Explore Divisions'}
              </Button>
            </Magnetic>

            <Magnetic strength={0.15}>
              <Button
                id="hero-explore-services-btn"
                variant="outline"
                size="lg"
                onClick={handleSecondaryClick}
                rightIcon={<Compass className="w-4 h-4 text-slate-500" />}
                className="font-medium cursor-pointer hover:bg-slate-50 hover:text-slate-900"
              >
                {hero.secondaryCtaLabel || 'Contact Group'}
              </Button>
            </Magnetic>

            <a
              href={getTelLink(hotline)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:border-blue-500 hover:text-[#0052FF] transition-all shadow-2xs"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Hotline: {hotline}</span>
            </a>

            <a
              href="https://wa.me/94750928078?text=Hello%20Mahdev%20Pvt%20Ltd,%20I%20would%20like%20to%20inquire%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </SlideIn>

        {/* Corporate Hotline Pill & Division Quick Strip */}
        <SlideIn direction="up" delay={0.25}>
          <div className="pt-10 mt-8 border-t border-slate-100 space-y-4 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Autonomous Units:
              </span>
              {displayDivisions.map((division) => {
                const displayName = (division as any).shortName || division.name;
                const route = division.route || `/${division.slug || division.id}`;

                return (
                  <button
                    key={division.id}
                    id={`hero-division-pill-${division.id}`}
                    onClick={() => onNavigate(route)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/80 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium pt-2">
              <div className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <Phone className="w-3.5 h-3.5" />
                <a href={getTelLink(hotline)} className="hover:underline">
                  Direct Hotline: {hotline}
                </a>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Island-wide Service Guarantee</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>24-Hour Lead SLA</span>
              </div>
            </div>
          </div>
        </SlideIn>
      </div>
    </section>
  );
};
