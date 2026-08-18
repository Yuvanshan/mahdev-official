import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  Info,
} from 'lucide-react';
import { SWS_PACKAGES, SWSPackage } from '../../data/swsData';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

interface SWSPackagesSectionProps {
  onBookPackage: (pkg: SWSPackage) => void;
}

export const SWSPackagesSection: React.FC<SWSPackagesSectionProps> = ({ onBookPackage }) => {
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});

  const nextImage = (pkgId: string, max: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndices((prev) => ({
      ...prev,
      [pkgId]: ((prev[pkgId] || 0) + 1) % max,
    }));
  };

  const prevImage = (pkgId: string, max: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndices((prev) => ({
      ...prev,
      [pkgId]: ((prev[pkgId] || 0) - 1 + max) % max,
    }));
  };

  return (
    <SectionContainer id="packages" background="subtle" paddingY="xl" hasBorderBottom>
      {/* Section Heading */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block">Curated Turnkey Packages</Caption>
          <H2 className="text-slate-900">
            All-Inclusive Event Suites Crafted for Perfection
          </H2>
          <Body className="text-slate-600 mt-2">
            Combine decoration, audio-visual engineering, cinema photography, and floor management into one seamless, cost-effective contract.
          </Body>
        </ScrollReveal>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-6">
        {SWS_PACKAGES.map((pkg) => {
          const currentIndex = activeImageIndices[pkg.id] || 0;
          const currentImage = pkg.images[currentIndex] || pkg.images[0];

          return (
            <div
              key={pkg.id}
              className={`rounded-2xl bg-white border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                pkg.popular
                  ? 'border-[#0052FF] ring-2 ring-blue-500/20 relative'
                  : 'border-slate-200/90 hover:border-blue-400'
              }`}
            >
              {/* Top Banner for Popular Package */}
              {pkg.popular && (
                <div className="bg-[#0052FF] text-white text-center py-1 text-[11px] font-bold tracking-wider uppercase flex items-center justify-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{pkg.badge || 'Most Popular Choice'}</span>
                </div>
              )}

              <div>
                {/* Image Carousel */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 group">
                  <img
                    src={currentImage}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Tier Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" size="sm" className="bg-black/70 backdrop-blur-md text-white text-[10px]">
                      {pkg.tier}
                    </Badge>
                  </div>

                  {/* Carousel Controls */}
                  {pkg.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => prevImage(pkg.id, pkg.images.length, e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => nextImage(pkg.id, pkg.images.length, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Guest Estimate */}
                  <div className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 drop-shadow">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>{pkg.guestEstimate}</span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-[#0052FF] font-medium mt-0.5">{pkg.tagline}</p>
                  </div>

                  {/* Price Block */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Package Price
                    </div>
                    <div className="font-display text-2xl font-bold text-slate-950">
                      {pkg.price}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {pkg.priceSubtext}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Included Services Checklist */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      What's Included:
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {pkg.includedServices.map((service, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with Availability & Booking CTA */}
              <div className="p-5 bg-slate-50/90 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{pkg.availability}</span>
                </div>

                <Button
                  variant={pkg.popular ? 'electric' : 'outline'}
                  size="md"
                  fullWidth
                  onClick={() => onBookPackage(pkg)}
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-bold py-2.5 shadow-sm"
                >
                  Book Package
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bespoke Custom Notice */}
      <div className="mt-12 p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Need a Customized Multi-Day or Destination Scope?</span>
          </div>
          <h4 className="font-display text-lg font-bold text-white">
            Custom Event Architecure & Destination Logistics
          </h4>
          <p className="text-xs text-slate-400 max-w-xl">
            If your celebration spans across several venues (Kandy, Galle Fort, Bentota beaches, or international destinations), our lead producer will draft a custom proposal tailored to your vision.
          </p>
        </div>

        <Button
          variant="electric"
          size="lg"
          onClick={() => onBookPackage(SWS_PACKAGES[1])}
          className="shrink-0 text-xs font-bold px-6"
        >
          Draft Custom Scope
        </Button>
      </div>
    </SectionContainer>
  );
};
