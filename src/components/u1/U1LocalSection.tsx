import React from 'react';
import { SectionContainer } from '../ui/SectionContainer';
import { Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { U1_SERVICE_AREA_SUMMARY, U1_SERVICE_HIGHLIGHTS } from '../../data/u1LocalSeo';

/**
 * Local search section for /u1: keyword service headings for Trincomalee and
 * Colombo, matching the SWS page's section. Content comes from src/data/u1LocalSeo.ts,
 * which also feeds the prerendered HTML.
 */
export const U1LocalSection: React.FC = () => (
  <SectionContainer background="white" paddingY="xl" id="u1-photography-services">
    <ScrollReveal>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Trincomalee &amp; Colombo</p>
      <p className="font-editorial text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Photography and film services</p>
      <Body className="mt-3 max-w-3xl text-slate-600">{U1_SERVICE_AREA_SUMMARY}</Body>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {U1_SERVICE_HIGHLIGHTS.map((service) => (
          <article key={service.heading} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {/* Each service is its own h2 so search engines see the local service keywords. */}
            <h2 className="text-lg font-semibold leading-snug text-slate-900">{service.heading}</h2>
            <Body className="mt-2 text-slate-600">{service.body}</Body>
          </article>
        ))}
      </div>
    </ScrollReveal>
  </SectionContainer>
);
