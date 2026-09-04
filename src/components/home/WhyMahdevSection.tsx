import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { IconRenderer } from '../ui/IconRenderer';
import { ScrollReveal } from '../motion/MotionWrappers';
import { WHY_MAHDEV_DIFFERENTIATORS } from '../../data/homeData';

export const WhyMahdevSection: React.FC = () => {
  return (
    <SectionContainer
      id="why-mahdev"
      background="white"
      paddingY="xl"
      hasBorderBottom
    >
      <ScrollReveal direction="up">
        <div className="max-w-2xl mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0052FF] block mb-2">
            Why Partner With Mahdev
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            The Enterprise Advantage
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Direct holding governance, dedicated technical crews, and transparent accountability across every engagement.
          </p>
        </div>
      </ScrollReveal>

      {/* Differentiators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {WHY_MAHDEV_DIFFERENTIATORS.map((diff, idx) => (
          <ScrollReveal key={diff.id} direction="up" delay={idx * 0.05}>
            <div className="rounded-xl bg-slate-50/70 border border-slate-200/90 p-6 hover:border-blue-400 hover:bg-white transition-all duration-200 h-full flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center mb-4">
                  <IconRenderer name={diff.iconName} className="w-4 h-4" />
                </div>

                <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                  {diff.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {diff.shortDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF]" />
                <span>{diff.badge}</span>
              </div>
            </div>
          </ScrollReveal>
        ))}

        {/* 6th Card: Delivery SLA */}
        <ScrollReveal direction="up" delay={0.3}>
          <div className="rounded-xl bg-slate-50/70 border border-slate-200/90 p-6 hover:border-blue-400 hover:bg-white transition-all duration-200 h-full flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center mb-4">
                <ShieldCheck className="w-4 h-4" />
              </div>

              <h3 className="font-display text-base font-bold text-slate-900 mb-1.5">
                Service Level Assurance
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Structured delivery timelines, verified checklists, and direct escalation to executive directors.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF]" />
                <span>Executive Oversight</span>
              </span>
              <span className="font-bold text-[#0052FF]">Verified</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </SectionContainer>
  );
};
