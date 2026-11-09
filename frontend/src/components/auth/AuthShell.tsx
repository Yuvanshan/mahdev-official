import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  /** Small icon shown above the title. */
  icon: React.ReactNode;
  children: React.ReactNode;
  /** Content under the card (e.g. "Already have an account?"). */
  footer?: React.ReactNode;
}

const PERKS = [
  { icon: CalendarCheck, title: 'Bookings in one place', text: 'Track SWS events, U1 Studio shoots and travel plans.' },
  { icon: Truck, title: 'Order tracking', text: 'Follow Mahdev Mart orders from checkout to delivery.' },
  { icon: Sparkles, title: 'Faster enquiries', text: 'Your details are filled in for quotes and bookings.' },
];

/**
 * Two-column layout for the sign-in, registration and password pages: an animated
 * brand panel (large screens) and the form card. Motion is reduced for visitors who
 * ask their device for less animation.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, icon, children, footer }) => {
  const reduceMotion = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="relative min-h-[88vh] overflow-hidden bg-slate-50">
      {/* Soft animated colour fields behind the card. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-400/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[1fr_minmax(0,30rem)] lg:px-8">
        {/* Brand panel */}
        <motion.aside {...rise(0)} className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#061033] via-[#0b1f5c] to-[#0052FF] p-10 text-white shadow-2xl shadow-blue-900/20">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-4 top-10 h-32 w-32 rounded-full border border-white/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Mahdev account</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight">
              One account for every Mahdev service.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/90">
              Events, studio, IT, travel and online mart across Trincomalee and Colombo.
            </p>
            <ul className="mt-8 space-y-4">
              {PERKS.map(({ icon: Icon, title: perkTitle, text }, index) => (
                <motion.li key={perkTitle} {...rise(0.15 + index * 0.08)} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-5 w-5 text-blue-100" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{perkTitle}</span>
                    <span className="block text-xs leading-5 text-blue-100/80">{text}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.aside>

        {/* Form card */}
        <div className="w-full">
          <motion.div
            {...rise(0.05)}
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-9"
          >
            <div className="mb-6 text-center">
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
              >
                {icon}
              </motion.div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </motion.div>
          {footer && <motion.div {...rise(0.2)} className="mt-5 text-center text-sm text-slate-600">{footer}</motion.div>}
          <motion.p {...rise(0.25)} className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Secured by Google. Your details are only used for your bookings and orders.
          </motion.p>
        </div>
      </div>
    </div>
  );
};
