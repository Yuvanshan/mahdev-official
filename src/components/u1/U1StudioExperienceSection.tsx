import React from 'react';
import {
  Sparkles,
  Camera,
  Layers,
  Award,
  ShieldCheck,
  Zap,
  Frame,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, Caption, Body } from '../ui/Heading';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../motion/MotionWrappers';

export const U1StudioExperienceSection: React.FC = () => {
  const features = [
    {
      title: '25ft Infinity White Cyclorama',
      desc: 'Seamless curved floor-to-wall white cyclorama capable of automotive, multi-model fashion, and large product staging with zero harsh horizon lines.',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      image:
        'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Profoto High-Speed Studio Lighting',
      desc: 'Industry-standard Profoto D2 & B10X continuous and strobe systems with softboxes, beauty dishes, and optical snoots for flawless skin sculpting.',
      icon: <Zap className="w-5 h-5 text-sky-600" />,
      image:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Italian Leather Hand-Bound Albums',
      desc: 'Flush-mount lay-flat photo books hand-bound with genuine Italian leather, archival silver-halide paper, and gold-foil custom lettering.',
      icon: <Award className="w-5 h-5 text-indigo-600" />,
      image:
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Museum-Grade Framing & Acrylics',
      desc: 'Custom solid teak wood framing and diamond-polished acrylic glass mounts designed to protect fine prints from UV degradation for over 100 years.',
      icon: <Frame className="w-5 h-5 text-amber-600" />,
      image:
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <SectionContainer background="subtle" paddingY="xl" hasBorderBottom>
      {/* Header */}
      <div className="max-w-3xl mb-12">
        <ScrollReveal direction="up">
          <Caption className="text-[#0052FF] mb-2 block">The U1 Studio Space & Bindery</Caption>
          <H2 className="text-slate-900">
            A Master Space Engineered for Creative Excellence
          </H2>
          <Body className="text-slate-600 mt-2">
            Located in Colombo, U1 Studio is a sanctuary for visual artists, commercial brands, and discerning couples seeking an unhurried, luxurious production environment.
          </Body>
        </ScrollReveal>
      </div>

      {/* 4 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="group rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md">
                  {f.icon}
                </div>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-[#0052FF] transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Studio Standard Included</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
};
