import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Activity, CalendarCheck, ChevronRight, CreditCard, ShoppingBag, UserCheck } from 'lucide-react';
import type { ActivityEntry, ActivityKind } from '../../services/customerAccountService';

interface AccountActivityTabProps {
  entries: ActivityEntry[];
  onNavigate: (path: string) => void;
}

const KIND_STYLE: Record<ActivityKind, { icon: React.ElementType; label: string; tone: string }> = {
  account: { icon: UserCheck, label: 'Account', tone: 'bg-indigo-100 text-indigo-700' },
  order: { icon: ShoppingBag, label: 'Orders', tone: 'bg-blue-100 text-blue-700' },
  payment: { icon: CreditCard, label: 'Payments', tone: 'bg-emerald-100 text-emerald-700' },
  booking: { icon: CalendarCheck, label: 'Bookings', tone: 'bg-amber-100 text-amber-700' },
};

const FILTERS: Array<'all' | ActivityKind> = ['all', 'order', 'booking', 'payment', 'account'];

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Timeline of the customer's account, order, payment and booking events. */
export const AccountActivityTab: React.FC<AccountActivityTabProps> = ({ entries, onNavigate }) => {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');
  const visible = useMemo(() => (filter === 'all' ? entries : entries.filter((entry) => entry.kind === filter)), [entries, filter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" /> Your activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">Everything that has happened on your account, newest first.</p>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter activity">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={filter === option}
                onClick={() => setFilter(option)}
                className={`relative rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === option ? 'text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {filter === option && (
                  <motion.span layoutId="activity-filter" className="absolute inset-0 rounded-full bg-slate-900" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{option === 'all' ? 'All' : KIND_STYLE[option].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Nothing here yet. Your orders and bookings will appear here.
        </div>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-slate-200 pl-6 sm:ml-3">
          {visible.map((entry, index) => {
            const { icon: Icon, tone } = KIND_STYLE[entry.kind];
            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{entry.title}</p>
                  <p className="truncate text-xs text-slate-500">{entry.detail}</p>
                </div>
                <time dateTime={entry.at} className="shrink-0 text-[11px] text-slate-400">{formatWhen(entry.at)}</time>
                {entry.route && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />}
              </>
            );
            return (
              <motion.li
                key={entry.id}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : Math.min(index, 12) * 0.04 }}
                className="relative"
              >
                <span className={`absolute -left-[2.35rem] top-3 flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-slate-50 ${tone}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {entry.route ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(entry.route!)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">{content}</div>
                )}
              </motion.li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
