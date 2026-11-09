import React from 'react';
import { formatLKR } from '../../utils/currency';

export interface PriceRange {
  min: number | null;
  max: number | null;
}

export const EMPTY_PRICE_RANGE: PriceRange = { min: null, max: null };

export const isPriceRangeActive = (range: PriceRange) => range.min !== null || range.max !== null;

/** True when `price` sits inside `range`; an empty range matches everything. */
export function priceInRange(price: number | null, range: PriceRange): boolean {
  if (!isPriceRangeActive(range)) return true;
  if (price === null) return false;
  if (range.min !== null && price < range.min) return false;
  if (range.max !== null && price > range.max) return false;
  return true;
}

/** Lowest and highest of the given prices (ignores missing ones); null when none are set. */
export function getPriceBounds(prices: Array<number | null | undefined>): { min: number; max: number } | null {
  const valid = prices.filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);
  if (valid.length === 0) return null;
  return { min: Math.floor(Math.min(...valid)), max: Math.ceil(Math.max(...valid)) };
}

/** A "round" slider step so thumbs land on tidy values (100, 500, 1,000...). */
function getSliderStep(span: number): number {
  const rough = span / 100;
  if (rough <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  return [1, 2, 5, 10].map((m) => m * magnitude).find((step) => step >= rough) || magnitude * 10;
}

/** Rounds to two significant figures (12,345 -> 12,000) for tidy quick-pick limits. */
function roundNice(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.max(Math.floor(Math.log10(value)) - 1, 0);
  return Math.round(value / magnitude) * magnitude;
}

/** Up to four quick-pick ranges ("Under X", "X – Y", "Y+") spread across the bounds. */
export function getPricePresets(bounds: { min: number; max: number }): Array<{ label: string; range: PriceRange }> {
  const span = bounds.max - bounds.min;
  const cuts = Array.from(new Set([0.25, 0.5, 0.75].map((f) => roundNice(bounds.min + span * f))))
    .filter((cut) => cut > bounds.min && cut < bounds.max);
  if (cuts.length === 0) return [];
  const presets: Array<{ label: string; range: PriceRange }> = [
    { label: `Under ${formatLKR(cuts[0])}`, range: { min: null, max: cuts[0] } },
  ];
  for (let i = 1; i < cuts.length; i += 1) {
    presets.push({ label: `${formatLKR(cuts[i - 1])} – ${formatLKR(cuts[i])}`, range: { min: cuts[i - 1], max: cuts[i] } });
  }
  presets.push({ label: `${formatLKR(cuts[cuts.length - 1])}+`, range: { min: cuts[cuts.length - 1], max: null } });
  return presets;
}

// Two overlaid range inputs; only the thumbs take pointer events so both stay draggable.
const THUMB_CLASSES =
  'pointer-events-none absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0052FF] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow ' +
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0052FF] [&::-moz-range-thumb]:bg-white';

interface PriceRangeFilterProps {
  bounds: { min: number; max: number };
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  /** Hint shown under the control while a range is set. */
  hint?: string;
  /** Show quick-pick range chips above the slider (default true). */
  showPresets?: boolean;
  className?: string;
}

/**
 * Shared min/max price range control (dual slider + typed amounts) used by
 * every division page, the services page and the Mart catalogue.
 * An unset end (null) means "no limit", so by default every item is shown.
 */
export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({ bounds, value, onChange, hint, showPresets = true, className = '' }) => {
  const span = Math.max(bounds.max - bounds.min, 1);
  const step = getSliderStep(span);
  const low = value.min ?? bounds.min;
  const high = value.max ?? bounds.max;
  const active = isPriceRangeActive(value);

  // Snap a value back to "no limit" when it reaches the outer bound.
  const setLow = (next: number) => {
    const clamped = Math.min(Math.max(next, bounds.min), high);
    onChange({ ...value, min: clamped <= bounds.min ? null : clamped });
  };
  const setHigh = (next: number) => {
    const clamped = Math.max(Math.min(next, bounds.max), low);
    onChange({ ...value, max: clamped >= bounds.max ? null : clamped });
  };

  const parseTyped = (text: string) => {
    const amount = Number(text.replace(/[^0-9.]/g, ''));
    return text.trim() === '' || !Number.isFinite(amount) ? null : amount;
  };

  const presets = showPresets ? getPricePresets(bounds) : [];
  const lowPct = ((low - bounds.min) / span) * 100;
  const highPct = ((high - bounds.min) / span) * 100;

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">Price range</span>
        <span className="font-semibold text-slate-900">
          {formatLKR(low)} – {formatLKR(high)}
          {active && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_PRICE_RANGE)}
              className="ml-2 font-medium text-[#0052FF] hover:underline"
            >
              Any price
            </button>
          )}
        </span>
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => {
            const selected = preset.range.min === value.min && preset.range.max === value.max;
            return (
              <button
                key={preset.label}
                type="button"
                // Clicking the selected quick pick again clears it
                onClick={() => onChange(selected ? EMPTY_PRICE_RANGE : preset.range)}
                aria-pressed={selected}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  selected ? 'bg-[#0052FF] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#0052FF]"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={low}
          onChange={(e) => setLow(Number(e.target.value))}
          aria-label="Minimum price"
          className={THUMB_CLASSES}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={high}
          onChange={(e) => setHigh(Number(e.target.value))}
          aria-label="Maximum price"
          className={THUMB_CLASSES}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {([
          ['Min', value.min, (n: number | null) => (n === null ? onChange({ ...value, min: null }) : setLow(n))],
          ['Max', value.max, (n: number | null) => (n === null ? onChange({ ...value, max: null }) : setHigh(n))],
        ] as const).map(([label, current, apply]) => (
          <label key={label} className="relative block">
            <span className="sr-only">{label} price</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">
              {label} Rs.
            </span>
            <input
              // Keyed on the committed value so typing is free and the box resyncs after slider moves.
              key={`${label}-${current ?? 'none'}`}
              type="text"
              inputMode="numeric"
              defaultValue={current === null ? '' : String(current)}
              placeholder={String(label === 'Min' ? bounds.min : bounds.max)}
              onBlur={(e) => apply(parseTyped(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-16 pr-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </label>
        ))}
      </div>

      {active && hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
};
