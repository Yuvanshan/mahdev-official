import React from 'react';
import { Truck } from 'lucide-react';
import { formatLKR } from '../../utils/currency';

export const TRANSPORT_NOTE = '+ Transport as per distance';

/**
 * Normalises an optional price (number, or text such as "Rs. 75,000").
 * Returns null when no valid positive amount is set, so callers can hide the
 * price block entirely.
 */
export function getStartingPrice(value: unknown): number | null {
  let amount = value;
  if (typeof value === 'string') {
    // First number in the text, ignoring thousands separators ("Rs. 75,000/day" -> 75000)
    const match = value.replace(/,/g, '').match(/\d+(\.\d+)?/);
    amount = match ? Number(match[0]) : null;
  }
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0 ? amount : null;
}

/** A stored service record's starting price (startingPrice, else price), or null. */
export function getServiceStartingPrice(service: Record<string, any> | null | undefined): number | null {
  if (!service) return null;
  return getStartingPrice(service.startingPrice) ?? getStartingPrice(service.price);
}

/** "Starting From Rs. X", or undefined when there is no valid price. */
export function getStartingPriceLabel(value: unknown): string | undefined {
  const amount = getStartingPrice(value);
  return amount === null ? undefined : `Starting From ${formatLKR(amount)}`;
}

/** Price fields for the shared details pop-up; empty when the item has no price. */
export function getStartingPriceDetails(value: unknown): { priceLabel?: string; priceNote?: string } {
  const priceLabel = getStartingPriceLabel(value);
  return priceLabel ? { priceLabel, priceNote: TRANSPORT_NOTE } : {};
}

/** WhatsApp enquiry text for a price, including the transport note. */
export function getStartingPriceInquiryText(value: unknown): string | undefined {
  const priceLabel = getStartingPriceLabel(value);
  return priceLabel ? `${priceLabel} (${TRANSPORT_NOTE})` : undefined;
}

/** Shared "Starting From" price line plus transport tag for service and gallery cards. Renders nothing without a price. */
export const StartingPriceTag: React.FC<{ price?: unknown; className?: string }> = ({ price, className = '' }) => {
  const amount = getStartingPrice(price);
  if (amount === null) return null;

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <p className="flex items-baseline gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Starting From</span>
        <span className="text-sm font-bold text-slate-900">{formatLKR(amount)}</span>
      </p>
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800">
        <Truck className="h-3 w-3 shrink-0" />
        {TRANSPORT_NOTE}
      </span>
    </div>
  );
};
