import React from 'react';
import { CalendarDays, Compass, MessageCircle, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SectionContainer } from '../ui/SectionContainer';
import { HorizontalScrollArea } from '../ui/HorizontalScrollArea';
import { useFirestoreDataContext } from '../../context/FirestoreDataContext';

const STEP_ICONS = {
  compass: Compass,
  message: MessageCircle,
  calendar: CalendarDays,
  sparkles: Sparkles,
} as const;

const JourneyLineArt: React.FC<{ index: number }> = ({ index }) => {
  const commonProps = {
    className: 'h-16 w-16 text-blue-200/90 sm:h-20 sm:w-20',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.5,
    viewBox: '0 0 72 72',
    'aria-hidden': true as const,
  };

  switch (index % 4) {
    case 0:
      return (
        <svg {...commonProps}>
          <circle cx="36" cy="36" r="23" />
          <circle cx="36" cy="36" r="12" />
          <path d="M36 8v9m0 38v9M8 36h9m38 0h9M19 19l7 7m20 20 7 7m0-34-7 7m-20 20-7 7" />
          <circle cx="36" cy="36" r="3" />
        </svg>
      );
    case 1:
      return (
        <svg {...commonProps}>
          <path d="M13 18h46v31H35L21 60v-11h-8z" />
          <path d="M22 29h28m-28 9h19" />
          <circle cx="53" cy="53" r="8" />
          <path d="m50 53 2 2 4-5" />
        </svg>
      );
    case 2:
      return (
        <svg {...commonProps}>
          <rect x="14" y="16" width="44" height="42" rx="6" />
          <path d="M14 28h44M25 12v9m22-9v9m-23 18h7m7 0h7m-21 8h7m7 0h7" />
          <path d="m48 48 4 4 8-10" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <path d="m36 8 6.5 18.5L61 33l-18.5 6.5L36 58l-6.5-18.5L11 33l18.5-6.5z" />
          <path d="m55 48 3 8 8 3-8 3-3 8-3-8-8-3 8-3zM17 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        </svg>
      );
  }
};

export const BookingGuide: React.FC = () => {
  const { homepageConfig } = useFirestoreDataContext();
  const reducedMotion = useReducedMotion();
  const guide = homepageConfig.bookingGuide;
  const steps = (guide?.steps || [])
    .filter((step) => step.enabled !== false)
    .sort((left, right) => left.order - right.order);

  if (guide?.enabled === false || steps.length === 0) return null;

  return (
    <SectionContainer id="how-to-book" background="subtle" paddingY="lg">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {guide?.title || 'Your Journey Starts Here.'}
        </h2>
        {guide?.subtitle && (
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{guide.subtitle}</p>
        )}
      </div>

      <HorizontalScrollArea
        ariaLabel="Booking steps"
        hideControlsAt="sm"
        className="pb-3 sm:pb-0"
        contentClassName="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain no-visible-scrollbar sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible lg:grid-cols-4"
      >
        <ol className="contents">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[step.icon] || Compass;
            return (
              <motion.li
                key={step.id}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={reducedMotion ? undefined : { once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: reducedMotion ? 0 : index * 0.08 }}
                className="relative min-h-44 w-[min(82vw,19rem)] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 pr-20 shadow-sm transition-shadow duration-300 hover:shadow-md sm:w-auto sm:shrink sm:p-6 sm:pr-24"
              >
                <div className="pointer-events-none absolute bottom-2 right-1 opacity-90 sm:bottom-3 sm:right-2">
                  <JourneyLineArt index={index} />
                </div>
                <div className="mb-4 flex items-center gap-2 sm:mb-5 sm:gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100 sm:h-12 sm:w-12">
                    <Icon aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug text-slate-950 sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{step.description}</p>
              </motion.li>
            );
          })}
        </ol>
      </HorizontalScrollArea>
    </SectionContainer>
  );
};
