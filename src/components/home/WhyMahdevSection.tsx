import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Body, Caption } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { IconRenderer } from '../ui/IconRenderer';
import {
  ScrollReveal,
  TiltCard,
  BlurReveal,
  ParallaxContainer,
} from '../motion/MotionWrappers';
import { WHY_MAHDEV_DIFFERENTIATORS } from '../../data/homeData';

export const WhyMahdevSection: React.FC = () => {
  return (
    <SectionContainer
      id="why-mahdev"
      background="subtle"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Caption className="text-[#0052FF] mb-2 block">Competitive Edge</Caption>
          <H2 className="text-slate-900 mb-3">Why Choose Mahdev Pvt Ltd?</H2>
          <Body className="text-slate-600 text-base">
            How our parent ecosystem delivers unprecedented creative freedom, engineering reliability, and operational synergy under one trusted corporate roof.
          </Body>
        </div>
      </ScrollReveal>

      {/* Differentiators Grid with 3D Perspective Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WHY_MAHDEV_DIFFERENTIATORS.map((diff, idx) => (
          <ScrollReveal key={diff.id} direction="up" delay={idx * 0.07}>
            <TiltCard maxTilt={7} glareEffect className="h-full">
              <div className="group rounded-2xl bg-white border border-slate-200/90 p-7 shadow-xs hover:border-[#0052FF] hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center group-hover:bg-[#0052FF] group-hover:text-white transition-colors duration-300">
                      <IconRenderer name={diff.iconName} className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" size="sm" className="text-slate-500">
                      0{idx + 1}
                    </Badge>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 mb-2 group-hover:text-[#0052FF] transition-colors">
                    {diff.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {diff.shortDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#0052FF]">
                  <CheckCircle2 className="w-4 h-4 text-[#0052FF]" />
                  <span>{diff.badge}</span>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}

        {/* 6th Card: Institutional Guarantee */}
        <ScrollReveal direction="up" delay={0.4}>
          <TiltCard maxTilt={7} glareEffect className="h-full">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-7 shadow-lg h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold text-white uppercase tracking-wider">
                    SLA Assured
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-white mb-2">
                  Uncompromising Delivery SLA
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed mb-6">
                  Every contract with any Mahdev division is backed by formal SLAs, dedicated project managers, and executive holding oversight.
                </p>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs text-blue-100 font-semibold">
                <span>Direct Executive Line</span>
                <span className="text-white font-bold">100% Guaranteed</span>
              </div>
            </div>
          </TiltCard>
        </ScrollReveal>
      </div>
    </SectionContainer>
  );
};
