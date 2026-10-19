import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
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
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              <H3 className="text-base">{faq.question}</H3>
              {/* Arrow shows the item can be opened; it turns down when open. */}
              <ArrowRight className="h-5 w-5 shrink-0 text-blue-600 transition-transform duration-200 group-open:rotate-90" aria-hidden="true" />
            </summary>
            <Body className="mt-3 text-slate-600">{faq.answer}</Body>
          </details>
        ))}
      </div>
    </ScrollReveal>
  </SectionContainer>
  );
};
