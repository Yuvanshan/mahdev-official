import React from 'react';
import { SEOHead } from '../components/layout/SEOHead';
import { FaqSection } from '../components/common/FaqSection';
import { usePageFaqs } from '../hooks/usePageFaqs';
import { CANONICAL_SITE_ORIGIN } from '../config/site';

export const FaqPageView: React.FC = () => {
  const faqs = usePageFaqs('all');

  return (
    <main className="min-h-screen bg-white pt-16 sm:pt-20">
      <SEOHead
        title="Frequently Asked Questions"
        description="Answers to common questions about Mahdev services, event planning, photography, online orders and contacting our teams."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/faq`}
      />
      <section className="border-b border-slate-200 bg-slate-50 px-[var(--page-gutter)] py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Mahdev help</p>
          <h1 className="mt-2 font-editorial text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Find answers about our services, bookings, products and locations.
          </p>
        </div>
      </section>
      <FaqSection items={faqs} title="Answers from the Mahdev team" background="white" />
    </main>
  );
};
