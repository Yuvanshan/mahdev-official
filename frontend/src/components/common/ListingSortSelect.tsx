import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { LISTING_SORT_OPTIONS, ListingSort } from '../../utils/listingSort';

/** Shared "Sort by" dropdown (Recommended, price low/high, name A–Z/Z–A). */
export const ListingSortSelect: React.FC<{
  value: ListingSort;
  onChange: (sort: ListingSort) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => (
  <label className={`relative inline-flex items-center ${className}`}>
    <span className="sr-only">Sort by</span>
    <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ListingSort)}
      className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
    >
      {LISTING_SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-3 text-[10px] text-slate-400" aria-hidden="true">▼</span>
  </label>
);
