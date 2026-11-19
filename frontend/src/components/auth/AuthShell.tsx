import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';

interface AuthShellProps {
  title: string;
  subtitle: string;
  /** Small icon shown above the title. */
  icon: React.ReactNode;
  children: React.ReactNode;
  /** Content under the card (e.g. "Already have an account?"). */
  footer?: React.ReactNode;
}

// The account highlights. Shown as a panel on large screens and as chips on phones.
const PERKS = [
  { icon: CalendarCheck, title: 'Bookings in one place', short: 'All bookings', text: 'Track SWS events, U1 Studio shoots and travel plans.' },
  { icon: Truck, title: 'Order tracking', short: 'Order tracking', text: 'Follow Mahdev Mart orders from checkout to delivery.' },
  { icon: Sparkles, title: 'Faster enquiries', short: 'Faster enquiries', text: 'Your details are filled in for quotes and bookings.' },
];

const STATS = [
  { value: '5', label: 'Divisions' },
  { value: '2', label: 'Branches' },
  { value: '1', label: 'Account' },
];

/**
 * Two-column layout for the sign-in, registration and password pages: an animated
 * brand panel (large screens), highlight chips (phones) and the form card. Motion is
 * reduced for visitors who ask their device for less animation.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, icon, children, footer }) => {
  const reduceMotion = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="relative min-h-[88vh] overflow-hidden bg-[#FAF6EF]">
      {/* Soft animated colour fields behind the card. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#861F31]/15 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-300/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-12 lg:px-8">
        {/* Brand panel */}
        <motion.aside {...rise(0)} className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2A0810] via-[#4A0F1C] to-[#861F31] p-10 text-white shadow-2xl shadow-[#861F31]/25">
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -right-4 top-10 h-32 w-32 rounded-full border border-white/10" />
            <div aria-hidden="true" className="absolute -bottom-20 -left-12 h-60 w-60 rounded-full border border-white/10" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Mahdev account</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight xl:text-4xl">
              One account for every Mahdev service.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-rose-100/90">
              Events, studio, IT, travel and online mart across Trincomalee and Colombo.
            </p>
            <ul className="mt-8 space-y-4">
              {PERKS.map(({ icon: Icon, title: perkTitle, text }, index) => (
                <motion.li key={perkTitle} {...rise(0.15 + index * 0.08)} className="flex gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="h-5 w-5 text-amber-200" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{perkTitle}</span>
                    <span className="block text-xs leading-5 text-rose-100/80">{text}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
            <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6 text-center">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-2xl font-bold text-amber-200">{value}</dd>
                  <dd className="text-[11px] uppercase tracking-wider text-rose-100/70" aria-hidden="true">{label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 flex items-center gap-2 text-xs text-rose-100/70">
              <MapPin className="h-4 w-4" aria-hidden="true" /> Trincomalee &amp; Colombo, Sri Lanka
            </p>
          </div>
        </motion.aside>

        {/* Form card */}
        <div className="w-full">
          {/* Phones and tablets: the highlights as compact chips above the card. */}
          <motion.ul {...rise(0)} aria-label="Account highlights" className="mb-4 flex gap-2 overflow-x-auto pb-1 no-visible-scrollbar lg:hidden">
            {PERKS.map(({ icon: Icon, short }) => (
              <li key={short} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#861F31]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#861F31] shadow-xs">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {short}
              </li>
            ))}
          </motion.ul>
          <motion.div
            {...rise(0.05)}
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#861F31]/10 backdrop-blur sm:p-9"
          >
            <div className="mb-6 text-center">
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#861F31] to-[#B23A4E] text-white shadow-lg shadow-[#861F31]/30"
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
