import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Lightbulb,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Compass,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SectionContainer } from '../components/ui/SectionContainer';
import { H1, H2, H3, Body } from '../components/ui/Heading';
import { ScrollReveal } from '../components/motion/MotionWrappers';
import { AboutUsContent } from '../types/websiteContent';
import {
  websiteContentService,
  DEFAULT_ABOUT_US_CONTENT,
} from '../services/firestore/websiteContent';

interface AboutViewProps {
  onNavigate: (route: string) => void;
}

// Map value icons to lucide-react components
const VALUE_ICONS: Record<string, React.ElementType> = {
  Users,
  Lightbulb,
  ShieldCheck,
  Award,
  Sparkles,
  Compass,
};

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  const [content, setContent] = useState<AboutUsContent>(DEFAULT_ABOUT_US_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let isMounted = true;
    setIsLoading(true);

    // Subscribe to live Firestore updates
    const unsubscribe = websiteContentService.subscribeAboutUsContent((liveContent) => {
      if (isMounted) {
        setContent(liveContent);
        setIsLoading(false);
        setHasError(false);
      }
    });

    // Fallback load
    websiteContentService
      .getAboutUsContent()
      .then((data) => {
        if (isMounted) {
          setContent(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[AboutView] Error loading from Firestore, using baseline:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const sortedValues = [...(content.values || [])]
    .filter((v) => v.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const sortedDivisions = [...(content.divisions || [])]
    .filter((d) => d.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const sortedTimeline = [...(content.timeline || [])]
    .filter((t) => t.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const sortedLocations = [...(content.locations || [])]
    .filter((l) => l.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="pt-20 sm:pt-24 pb-16 bg-white min-h-screen text-slate-900 font-sans">
      <SEOHead
        title="About MAHDEV Pvt Ltd | Creating Moments. Capturing Memories. Delivering Innovation"
        description="Learn about MAHDEV Pvt Ltd, our vision, mission, business divisions, journey, and services across Sri Lanka."
        canonicalUrl="https://mahdev.lk/about"
      />

      {/* Shimmer Loading State */}
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-pulse">
          <div className="space-y-4 max-w-3xl">
            <div className="h-6 w-36 bg-blue-100 rounded-full" />
            <div className="h-12 w-3/4 bg-slate-200 rounded-xl" />
            <div className="h-6 w-1/2 bg-blue-100 rounded-lg" />
            <div className="h-20 w-full bg-slate-100 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-40 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : hasError ? (
        /* Professional Error / Empty State */
        <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Company Information Currently Updating
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            We are refreshing our company information. Please check back shortly or reach out to our team.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* 1. HERO SECTION */}
          <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white py-12 sm:py-20 border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-3xl">
                  {/* Category Chip */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="electric" size="sm">
                      About MAHDEV Pvt Ltd
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      Colombo & Trincomalee, Sri Lanka
                    </span>
                  </div>

                  {/* Main Title */}
                  <H1 className="text-slate-900 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-3">
                    {content.hero.title}
                  </H1>

                  {/* Tagline */}
                  <p className="text-lg sm:text-xl font-semibold text-blue-600 mb-4 tracking-tight">
                    {content.hero.subtitle}
                  </p>

                  {/* Short Introductory Text */}
                  <Body className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8">
                    {content.hero.description}
                  </Body>

                  {/* Hero CTA button */}
                  <div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => onNavigate(content.hero.buttonRoute || '/services')}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      {content.hero.buttonText || 'Explore Our Services'}
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* 2. COMPANY INTRODUCTION ("Who We Are") */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                      Corporate Identity
                    </span>
                  </div>

                  <H2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight mb-6">
                    {content.companyIntro.heading}
                  </H2>

                  <div className="space-y-4 text-slate-600 text-base sm:text-lg leading-relaxed">
                    {content.companyIntro.description
                      .split('\n\n')
                      .filter(Boolean)
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* 3. VISION & MISSION */}
          <section className="py-16 bg-slate-50 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Vision Card */}
                <ScrollReveal direction="up" delay={0.1}>
                  <div className="h-full bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                        <Compass className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block mb-2">
                        Future Horizon
                      </span>
                      <H3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-4">
                        {content.vision.heading}
                      </H3>
                      <p className="text-slate-600 text-base leading-relaxed">
                        {content.vision.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Mission Card */}
                <ScrollReveal direction="up" delay={0.2}>
                  <div className="h-full bg-white rounded-2xl p-8 sm:p-10 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 block mb-2">
                        Core Purpose
                      </span>
                      <H3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mb-4">
                        {content.mission.heading}
                      </H3>
                      <p className="text-slate-600 text-base leading-relaxed">
                        {content.mission.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* 4. CORE VALUES */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-3xl mb-12">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                      Our Guiding Principles
                    </span>
                  </div>
                  <H2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight">
                    Core Values
                  </H2>
                  <p className="text-sm sm:text-base text-slate-500 mt-2">
                    The fundamental standards that govern our culture, craftsmanship, and client relationships across Sri Lanka.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedValues.map((val, idx) => {
                  const Icon = VALUE_ICONS[val.iconName || ''] || ShieldCheck;
                  return (
                    <ScrollReveal key={val.id} direction="up" delay={idx * 0.1}>
                      <div className="h-full p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-400 block mb-1">
                            0{idx + 1}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{val.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {val.description}
                          </p>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 5. OUR DIVISIONS */}
          <section className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-3xl mb-12">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                      Multi-Sector Portfolio
                    </span>
                  </div>
                  <H2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight">
                    Our Business Divisions
                  </H2>
                  <p className="text-sm sm:text-base text-slate-500 mt-2">
                    Bringing together event management, creative studio services, technology, travel, and online commerce under one trusted brand.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {sortedDivisions.map((div, idx) => (
                  <ScrollReveal key={div.id} direction="up" delay={idx * 0.08}>
                    <div className="h-full bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                            Division 0{idx + 1}
                          </span>
                        </div>

                        <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
                          {div.name}
                        </h3>

                        <p className="text-sm text-slate-600 leading-relaxed mb-6">
                          {div.description}
                        </p>

                        {/* Highlighted Services Chips */}
                        {div.services && div.services.length > 0 && (
                          <div className="mb-6">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Core Capabilities
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {div.services.map((srv, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-xs bg-slate-50 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-lg"
                                >
                                  {srv}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigate(div.route)}
                          className="w-full justify-between"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* 6. COMPANY JOURNEY / TIMELINE */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-3xl mb-12">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                      Our Evolution
                    </span>
                  </div>
                  <H2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight">
                    Company Journey
                  </H2>
                  <p className="text-sm sm:text-base text-slate-500 mt-2">
                    A story of consistent growth, expanding divisions, and continuous innovation from Trincomalee to nationwide operations.
                  </p>
                </div>
              </ScrollReveal>

              {/* Timeline Items */}
              <div className="relative border-l-2 border-blue-200/80 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-10">
                {sortedTimeline.map((item, idx) => (
                  <ScrollReveal key={item.id} direction="up" delay={idx * 0.1}>
                    <div className="relative">
                      {/* Node Bullet */}
                      <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white border-2 border-blue-600" />

                      <div className="bg-slate-50 rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white font-mono font-bold text-xs mb-2">
                          {item.year}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold font-display text-slate-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* 7. OUR LOCATIONS */}
          <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollReveal direction="up">
                <div className="max-w-3xl mb-12">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
                      Physical Presence
                    </span>
                  </div>
                  <H2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-slate-900 tracking-tight">
                    Our Locations
                  </H2>
                  <p className="text-sm sm:text-base text-slate-500 mt-2">
                    Operating dedicated corporate branches and service hubs in both Colombo and Trincomalee.
                  </p>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {sortedLocations.map((loc, idx) => (
                  <ScrollReveal key={loc.id} direction="up" delay={idx * 0.1}>
                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col justify-between h-full">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                            Branch Office
                          </span>
                          <span className="text-xs font-bold text-slate-400">Sri Lanka</span>
                        </div>

                        <h3 className="text-xl font-display font-bold text-slate-900">
                          {loc.city} Branch
                        </h3>

                        <div className="flex items-start gap-3 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                          <span>{loc.address}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                          <a
                            href={`tel:${loc.phone.split('/')[0].replace(/\s+/g, '')}`}
                            className="hover:text-blue-600 font-mono font-medium"
                          >
                            {loc.phone}
                          </a>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                          <a
                            href={`mailto:${loc.email}`}
                            className="hover:text-blue-600 font-medium"
                          >
                            {loc.email}
                          </a>
                        </div>
                      </div>

                      {loc.mapUrl && (
                        <div className="pt-6 border-t border-slate-100 mt-6">
                          <a
                            href={loc.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5"
                          >
                            <span>Open on Google Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* 8. CALL TO ACTION SECTION */}
          <section className="py-20 sm:py-24 bg-gradient-to-br from-[#06102B] via-[#0A1B44] to-[#06102B] text-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <ScrollReveal direction="up">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-mono text-xs font-bold uppercase tracking-wider border border-blue-400/30">
                  Collaborate With Us
                </span>

                <H2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight mt-3">
                  {content.cta.title}
                </H2>

                <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
                  {content.cta.description}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => onNavigate(content.cta.primaryButtonRoute || '/services')}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {content.cta.primaryButtonText || 'Explore Our Services'}
                  </Button>

                  <button
                    onClick={() => onNavigate(content.cta.secondaryButtonRoute || '/contact')}
                    className="px-6 py-3 rounded-xl border border-blue-400/40 text-white hover:bg-blue-900/40 text-sm font-bold transition-all cursor-pointer"
                  >
                    {content.cta.secondaryButtonText || 'Contact Us'}
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
