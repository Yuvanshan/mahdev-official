import React, { useMemo } from 'react';
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
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

export const U1StudioExperienceSection: React.FC = () => {
  const { divisions, mediaAssets } = useFirestoreDataContext();

  const u1Div = useMemo(() => {
    return divisions.find(
      (d) =>
        d.id === 'u1' ||
        d.id === 'u1-studio' ||
        d.id === 'div-u1' ||
        d.slug === 'u1' ||
        d.slug === 'u1-studio'
    );
  }, [divisions]);

  const features = useMemo(() => {
    // 1. Check if configured explicitly on division in Firestore
    const configuredCards =
      (u1Div as any)?.facilityHighlights ||
      (u1Div as any)?.experienceCards ||
      (u1Div as any)?.featuresList;

    if (Array.isArray(configuredCards) && configuredCards.length > 0) {
      return configuredCards.map((c: any) => ({
        title: c.title || c.name || 'Studio Standard',
        desc: c.desc || c.description || '',
        icon: <Sparkles className="w-5 h-5 text-blue-600" />,
        image: c.image || c.imageUrl || '',
      }));
    }

    // 2. Check if user added studio / facility / frame / album media assets
    const facilityMedia = mediaAssets.filter((m) => {
      const tags = (m.tags || []).map((t) => t.toLowerCase());
      return tags.some((t) =>
        ['facility', 'cyclorama', 'lighting', 'album', 'frame', 'equipment', 'bindery'].includes(t)
      );
    });

    if (facilityMedia.length > 0) {
      return facilityMedia.map((m) => {
        const isFrame = (m.tags || []).some((t) => t.toLowerCase().includes('frame'));
        const isAlbum = (m.tags || []).some((t) => t.toLowerCase().includes('album'));
        const isLight = (m.tags || []).some((t) => t.toLowerCase().includes('light'));

        const IconComponent = isFrame ? Frame : isAlbum ? Award : isLight ? Zap : Layers;
        return {
          title: m.title,
          desc: (m as any).description || `Master Craft: ${m.tags?.join(' • ') || 'Fine Art Studio Standard'}`,
          icon: <IconComponent className="w-5 h-5 text-blue-600" />,
          image: m.url,
        };
      });
    }

    // If no real studio features or media assets exist, do not render fake test data
    return [];
  }, [u1Div, mediaAssets]);

  if (features.length === 0) {
    return null;
  }

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
