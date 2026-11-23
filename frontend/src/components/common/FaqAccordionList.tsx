import React from 'react';
import { Plus } from 'lucide-react';
import { Body } from '../ui/Heading';

interface FaqAccordionListProps {
  items: ReadonlyArray<{ question: string; answer: string }>;
}

export const FaqAccordionList: React.FC<FaqAccordionListProps> = ({ items }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
    {items.map((faq, index) => (
      <details
        key={faq.question}
        className="faq-card group self-start rounded-xl border border-slate-200 bg-white transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/10 open:border-blue-200 open:bg-blue-50/40 open:shadow-sm"
      >
        <summary className="flex min-h-[76px] cursor-pointer list-none items-start gap-3 rounded-xl p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#861F31] [&::-webkit-details-marker]:hidden sm:items-center sm:p-5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold tabular-nums text-slate-500 transition-[transform,background-color,color] duration-200 group-hover:scale-105 group-hover:bg-blue-50 group-hover:text-blue-700 group-open:bg-blue-100 group-open:text-blue-700 sm:mt-0"
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="min-w-0 flex-1 font-display text-sm font-semibold leading-6 text-slate-900 transition-colors duration-200 group-hover:text-blue-900 sm:text-base">
            {faq.question}
          </h3>
          <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-[transform,border-color,background-color,color] duration-200 group-hover:scale-105 group-hover:border-blue-300 group-hover:text-blue-700 group-open:border-blue-200 group-open:bg-white group-open:text-blue-700 sm:mt-0">
            <Plus className="h-4 w-4 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
          </span>
        </summary>
        <div className="faq-answer-content px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="border-t border-slate-100 pt-3">
            <Body className="max-w-none text-left text-sm text-slate-600">{faq.answer}</Body>
          </div>
        </div>
      </details>
    ))}
  </div>
);
