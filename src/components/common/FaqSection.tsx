import React, { useEffect } from 'react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, H3, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';

interface FaqSectionProps {
  items: ReadonlyArray<{ question: string; answer: string }>;
  title?: string;
  id?: string;
  background?: 'white' | 'subtle';
}

/** Expandable FAQ list. The same questions are published as FAQPage structured data. */
export const FaqSection: React.FC<FaqSectionProps> = ({
  items,
  title = 'Frequently asked questions',
  id,
  background = 'white',
}) => {
  // FAQPage structured data always matches the questions shown (admin-managed).
  useEffect(() => {
    if (items.length === 0) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.faqSection = id || 'faq';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [items, id]);

  if (items.length === 0) return null;

  return (
  <SectionContainer background={background} paddingY="xl" id={id}>
    <ScrollReveal>
      <H2 className="text-slate-900">{title}</H2>
      <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {items.map((faq) => (
          <details key={faq.question} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold text-slate-900">
              <H3 className="text-base">{faq.question}</H3>
            </summary>
            <Body className="mt-3 text-slate-600">{faq.answer}</Body>
          </details>
        ))}
      </div>
    </ScrollReveal>
  </SectionContainer>
  );
};
