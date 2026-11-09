import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';

/**
 * Shared left-hand slide-in filter panel used by the /services catalogue and
 * every division page. Each filter (Categories, Price...) is a tab; the button
 * that opened the drawer decides which tab shows first.
 */

export interface FilterDrawerPanel {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Short summary of the current selection, shown on the tab (e.g. "Weddings"). */
  summary?: string;
  content: React.ReactNode;
}

interface FilterDrawerProps {
  /** Id of the open panel, or null when the drawer is closed. */
  openPanel: string | null;
  onChangePanel: (panelId: string) => void;
  onClose: () => void;
  panels: FilterDrawerPanel[];
  /** Number of items matching the current filters, for the "Show results" button. */
  resultCount: number;
  onReset?: () => void;
  canReset?: boolean;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  openPanel,
  onChangePanel,
  onClose,
  panels,
  resultCount,
  onReset,
  canReset = false,
}) => {
  const isOpen = openPanel !== null;
  const activePanel = panels.find((panel) => panel.id === openPanel) || panels[0];

  // Lock page scroll and close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  // Portalled to <body> so section transforms/overflow never clip the fixed panel
  return createPortal(
    <AnimatePresence>
      {isOpen && activePanel && (
        <div className="fixed inset-0 z-[120]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-drawer-title"
            className="absolute inset-y-0 left-0 flex w-[min(90vw,380px)] flex-col bg-white shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#0052FF]" />
                <h2 id="filter-drawer-title" className="font-display text-lg font-bold text-slate-900">Filters</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* One tab per filter type */}
            {panels.length > 1 && (
              <div role="tablist" aria-label="Filter type" className="flex gap-1 border-b border-slate-100 bg-slate-50/70 px-3 py-2">
                {panels.map((panel) => {
                  const selected = panel.id === activePanel.id;
                  return (
                    <button
                      key={panel.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => onChangePanel(panel.id)}
                      className={`flex min-w-0 flex-1 flex-col items-start rounded-xl px-3 py-2 text-left transition ${
                        selected ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/70'
                      }`}
                    >
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${selected ? 'text-[#0052FF]' : 'text-slate-700'}`}>
                        {panel.icon}
                        {panel.label}
                      </span>
                      <span className="mt-0.5 w-full truncate text-[11px] text-slate-500">{panel.summary || 'Any'}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div role="tabpanel" className="flex-1 overflow-y-auto px-5 py-4">
              {activePanel.content}
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4">
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  disabled={!canReset}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-[#0052FF] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition hover:bg-blue-700"
              >
                Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/** Toolbar button that opens a drawer panel; highlights when its filter is applied. */
export const FilterTriggerButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  /** Current selection; the button is highlighted when set. */
  activeLabel?: string;
  onClick: () => void;
  expanded?: boolean;
}> = ({ icon, label, activeLabel, onClick, expanded = false }) => (
  <button
    type="button"
    onClick={onClick}
    aria-haspopup="dialog"
    aria-expanded={expanded}
    className={`inline-flex min-h-10 max-w-full items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold shadow-2xs transition ${
      activeLabel
        ? 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300'
        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
    }`}
  >
    {icon}
    <span>{label}</span>
    {activeLabel && <span className="max-w-[9rem] truncate text-xs font-medium text-blue-600/80">· {activeLabel}</span>}
  </button>
);

/** Selectable row for a single-choice list inside a drawer panel (category, type...). */
export const FilterOptionRow: React.FC<{
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}> = ({ label, count, selected, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
      selected ? 'bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <span className="flex min-w-0 items-center gap-2.5">
      {/* Radio-style indicator */}
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[#0052FF]' : 'border-slate-300'
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-[#0052FF]" />}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </span>
    {count !== undefined && (
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${selected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    )}
  </button>
);

/** Label for an applied price range ("Rs. 1,000 – Rs. 5,000", "From ...", "Up to ..."), or undefined. */
export function describePriceRange(
  range: { min: number | null; max: number | null },
  format: (amount: number) => string
): string | undefined {
  const { min, max } = range;
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  if (max !== null) return `Up to ${format(max)}`;
  return undefined;
}
