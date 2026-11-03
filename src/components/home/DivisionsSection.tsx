import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';
import { getDashboardDivisionCardItems, getDivisionCardItems } from '../../utils/divisionPresentation';
import { DivisionCard } from '../divisions/DivisionCard';
import { getDefaultDivisions } from '../../services/firestore/divisions';

interface DivisionsSectionProps {
  onNavigate: (route: string) => void;
  layout?: 'rail' | 'grid';
}

const DivisionRailCard: React.FC<{
  division: ReturnType<typeof getDashboardDivisionCardItems>[number];
  onNavigate: (route: string) => void;
}> = ({ division, onNavigate }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 110, damping: 24, mass: 0.18 });
  const y = useTransform(smoothProgress, [0, 1], [10, -10]);

  return (
    <motion.div
      ref={cardRef}
      style={{ y: reducedMotion ? 0 : y }}
      className="divisions-marquee-card divisions-marquee-dashboard-card"
    >
      <DivisionCard division={division} onNavigate={onNavigate} variant="dashboard" />
    </motion.div>
  );
};

export const DivisionsSection: React.FC<DivisionsSectionProps> = ({ onNavigate, layout = 'rail' }) => {
  const { divisions, homepageConfig } = useFirestoreDataContext();
  const items = useMemo(
    () => {
      const sourceDivisions = layout === 'grid' && divisions.length === 0
        ? getDefaultDivisions()
        : divisions;
      return layout === 'grid'
        ? getDashboardDivisionCardItems(sourceDivisions)
        : getDivisionCardItems(sourceDivisions);
    },
    [divisions, layout]
  );
  const section = homepageConfig?.divisionsSection;
  const railRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      layout === 'grid' ||
      isPaused ||
      items.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    const timer = window.setInterval(() => {
      const rail = railRef.current;
      if (!rail) return;
      const card = rail.querySelector<HTMLElement>('.divisions-marquee-card');
      if (!card) return;

      const step = card.getBoundingClientRect().width + 16;
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - step / 2;
      rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + step, behavior: 'smooth' });
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isPaused, items.length, layout]);

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('.divisions-marquee-card');
    if (!rail || !card) return;
    rail.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: 'smooth' });
  };

  if (section?.enabled === false || items.length === 0) return null;

  return (
    <SectionContainer
      id="divisions"
      background={layout === 'grid' ? 'none' : 'white'}
      paddingY={layout === 'grid' ? 'none' : 'sm'}
      maxWidth={layout === 'grid' ? 'full' : undefined}
      innerClassName={layout === 'grid' ? 'px-0' : ''}
    >
      <div className={`mb-4 flex items-end justify-between gap-4 ${layout === 'grid' ? 'sm:mb-5' : 'sm:mb-10'}`}>
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {layout === 'grid' ? 'Explore Our Divisions' : section?.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/divisions')}
            className="hidden items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900 sm:inline-flex"
          >
            All businesses <ArrowUpRight className="h-4 w-4" />
          </button>
          <div className="hidden gap-2 sm:flex" aria-label="Scroll divisions">
            <button type="button" onClick={() => scrollRail(-1)} aria-label="Previous divisions" className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => scrollRail(1)} aria-label="Next divisions" className="rounded-full border border-slate-200 p-2 text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {layout === 'grid' ? (
        <div
          ref={railRef}
          className="divisions-marquee divisions-marquee-dashboard"
          aria-label="Mahdev divisions"
          onPointerEnter={() => setIsPaused(true)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {items.slice(0, 5).map((division) => (
            <DivisionRailCard key={division.id} division={division} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <>
          <div
            ref={railRef}
            className="divisions-marquee"
            aria-label="Mahdev divisions"
            onPointerEnter={() => setIsPaused(true)}
            onPointerLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={(event) => {
              const nextTarget = event.relatedTarget;
              if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setIsPaused(false);
            }}
          >
            {items.slice(0, 5).map((division) => (
              <div key={division.id} className="divisions-marquee-card">
                <DivisionCard division={division} onNavigate={onNavigate} />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/divisions')}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 sm:hidden"
          >
            All businesses <ArrowUpRight className="h-4 w-4" />
          </button>
        </>
      )}
    </SectionContainer>
  );
};
