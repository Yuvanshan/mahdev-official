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
                className="relative w-[min(82vw,19rem)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:w-auto sm:shrink sm:p-6"
              >
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
