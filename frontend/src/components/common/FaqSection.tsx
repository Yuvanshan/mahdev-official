import React, { useEffect } from 'react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2 } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { FaqAccordionList } from './FaqAccordionList';

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
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]').forEach((existing) => {
      if (existing.textContent?.includes('"@type":"FAQPage"')) existing.remove();
    });
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
      <H2 className="text-center text-slate-900">{title}</H2>
      <div className="mx-auto mt-6 max-w-5xl">
        <FaqAccordionList items={items} />
      </div>
    </ScrollReveal>
  </SectionContainer>
  );
};
