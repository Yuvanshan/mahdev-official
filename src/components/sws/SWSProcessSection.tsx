import React from 'react';
import {
  Sparkles,
  Compass,
  Layers,
  Wrench,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';

export const SWSProcessSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Discovery & Creative Moodboard',
      description:
        'We sit down with you to understand your aesthetic vision, color palettes, venue acoustics, and guest demographics, translating desires into a tactile moodboard.',
      icon: <Compass className="w-5 h-5 text-blue-600" />,
    },
    {
      number: '02',
      title: '3D Spatial Modeling & Scope',
      description:
        'Our technical designers generate 3D stage and venue floorplans, floral architectural renders, and line-item cost specifications so there are no surprises.',
      icon: <Layers className="w-5 h-5 text-sky-600" />,
    },
    {
      number: '03',
      title: 'Fabrication, Floral & AV Prep',
      description:
        'Fresh blooms are reserved, custom woodwork and neon structures are fabricated in-house, and line-array sound systems are bench-tested 48 hours prior.',
      icon: <Wrench className="w-5 h-5 text-indigo-600" />,
    },
    {
      number: '04',
      title: 'Flawless On-Day Master Direction',
      description:
        'Our lead producer and floor directors manage the entire timeline—from early-morning setup through backstage cues, first dance pyrotechnics, and teardown.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <SectionContainer background="white" paddingY="xl" hasBorderBottom>
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block">Methodical Event Craftsmanship</Caption>
          <H2 className="text-slate-900">How We Orchestrate Unforgettable Milestones</H2>
          <Body className="text-slate-600 mt-2">
            A seamless four-phase production lifecycle ensuring complete creative integrity, financial transparency, and stress-free execution.
          </Body>
        </ScrollReveal>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between space-y-4 hover:border-blue-500 hover:shadow-lg transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <span className="font-mono text-2xl font-black text-slate-300 group-hover:text-[#0052FF] transition-colors">
                  {step.number}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-200/60 text-[11px] font-semibold text-blue-600">
              Phase {idx + 1} Delivery
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
