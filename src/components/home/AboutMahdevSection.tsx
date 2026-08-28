import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronRight, FileText, Globe, Sparkles, Target, Users, X } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  ScrollReveal,
  TiltCard,
  Magnetic,
  BlurReveal,
} from '../motion/MotionWrappers';
import { BRAND_CONFIG } from '../../config/brand';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

interface AboutMahdevSectionProps {
  onExploreDivisions: () => void;
}

export const AboutMahdevSection: React.FC<AboutMahdevSectionProps> = ({ onExploreDivisions }) => {
  const [showCharterModal, setShowCharterModal] = useState(false);
  const { companySettings, siteSettings, homepageConfig } = useFirestoreDataContext();

  const companyName = companySettings?.name || siteSettings?.siteName || 'Mahdev Pvt Ltd';
  const tagline = companySettings?.tagline || 'A Forward-Looking Enterprise Driven By Purpose & Precision';
  const description = companySettings?.description || 'Mahdev Pvt Ltd is a dynamic holding company headquartered in Colombo, Sri Lanka. Founded with a vision to integrate artistic craftsmanship with advanced engineering, we operate across five core industry pillars.';
  const foundedYear = (companySettings as any)?.foundedYear || (companySettings as any)?.establishedYear || BRAND_CONFIG.establishedYear || '2018';

  return (
    <SectionContainer id="about" background="white" paddingY="xl" hasBorderBottom>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Narrative Column with Sticky Storytelling */}
        <div className="lg:col-span-6 lg:sticky lg:top-28 space-y-6">
          <ScrollReveal direction="up">
            <Caption className="text-[#0052FF]">About {companyName}</Caption>
            <H2 className="text-slate-900 mt-2 mb-4">
              {tagline}
            </H2>
            <Body className="text-slate-600 text-base leading-relaxed">
              {description}
            </Body>
            <Body className="text-slate-600 text-base leading-relaxed">
              Our philosophy combines bold innovation with institutional reliability. Whether producing nationwide cultural events, capturing life milestones in cinema format, architecting cloud solutions, curating island-wide journeys, or supplying modern tech gear—we deliver exceptional value.
            </Body>

            {/* Core Values / Mission Pillars */}
            <div className="pt-2 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Target className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Our Mission</h4>
                  <p className="text-xs text-slate-600">
                    To craft transformative experiences and scalable digital solutions that elevate businesses and enrich personal lives.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Sparkles className="w-5 h-5 text-[#0052FF] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Our Vision</h4>
                  <p className="text-xs text-slate-600">
                    To be recognized as Sri Lanka's foremost multi-disciplinary enterprise, celebrated for creativity, technical mastery, and corporate integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.25}>
                <Button
                  id="about-charter-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCharterModal(true)}
                  rightIcon={<FileText className="w-4 h-4 text-[#0052FF]" />}
                  className="hover:border-blue-400"
                >
                  View Corporate Charter
                </Button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <Button
                  id="about-divisions-btn"
                  variant="electric"
                  size="sm"
                  onClick={onExploreDivisions}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Explore Divisions
                </Button>
              </Magnetic>
            </div>
          </ScrollReveal>
        </div>

        {/* Right Column: 3D Metric & Capability Matrix */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ScrollReveal direction="up" delay={0.1}>
            <TiltCard maxTilt={8} className="h-full">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center mb-4">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-900 mb-1">
                    {foundedYear}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 mb-2">
                    Founded & Incorporated
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Over 8 years of operational excellence, steady scaling, and sustainable multi-sector growth.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  Colombo, Sri Lanka
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <TiltCard maxTilt={8} className="h-full">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-900 mb-1">
                    5 Units
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 mb-2">
                    Unified Operations
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Autonomous domain leadership united under central executive governance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  100% In-house Capacity
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.3}>
            <TiltCard maxTilt={8} className="h-full">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center mb-4">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-900 mb-1">
                    9 Provinces
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 mb-2">
                    Island-wide Delivery
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Executing events, media productions, and logistics seamlessly across Sri Lanka.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  National Footprint
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <TiltCard maxTilt={8} className="h-full">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 h-full flex flex-col justify-between hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0052FF] flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="font-display text-3xl font-bold text-slate-900 mb-1">
                    99.8%
                  </div>
                  <h4 className="font-semibold text-sm text-slate-800 mb-2">
                    Customer Satisfaction
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Highest verified client ratings across corporate and private clientele.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                  Client Focus First
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>

      {/* Corporate Charter Modal */}
      {showCharterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCharterModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="electric" size="sm">
                Corporate Governance
              </Badge>
            </div>
            <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">
              Mahdev Pvt Ltd Corporate Charter
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>1. Institutional Integrity:</strong> Mahdev Pvt Ltd holds all divisions to rigorous standards of financial governance, legal compliance, and customer transparency.
              </p>
              <p>
                <strong>2. Quality Parity:</strong> No matter which division a client engages—be it SWS Events, U1 Studio, IT & Solutions, Mahdev Travels, or Online Mart—they receive the same gold-standard SLA and executive attention.
              </p>
              <p>
                <strong>3. Innovation Commitment:</strong> We invest continually in cutting-edge audio-visual equipment, camera optics, cloud frameworks, and fleet logistics to remain at the technology forefront.
              </p>
              <p>
                <strong>4. Community & Sustainability:</strong> We support local communities, nurture Sri Lankan creative talent, and adhere to responsible corporate citizenship.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <Magnetic strength={0.25}>
                <Button
                  variant="electric"
                  size="sm"
                  onClick={() => setShowCharterModal(false)}
                >
                  Close Charter
                </Button>
              </Magnetic>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};
