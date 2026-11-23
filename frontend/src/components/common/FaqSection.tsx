import React, { useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2 } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { FaqAccordionList } from './FaqAccordionList';

interface FaqSectionProps {
  items: ReadonlyArray<{ question: string; answer: string }>;
  title?: string;
  id?: string;
  background?: 'white' | 'subtle';
  previewLimit?: number;
  onNavigate?: (route: string) => void;
}

/** Expandable FAQ list. The same questions are published as FAQPage structured data. */
export const FaqSection: React.FC<FaqSectionProps> = ({
  items,
  title = 'Frequently asked questions',
  id,
  background = 'white',
  previewLimit,
  onNavigate,
}) => {
  const visibleItems = useMemo(
    () => previewLimit ? items.slice(0, previewLimit) : items,
    [items, previewLimit]
  );

  // FAQPage structured data always matches the questions shown (admin-managed).
  useEffect(() => {
    if (visibleItems.length === 0) return;
    document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]').forEach((existing) => {
      if (existing.textContent?.includes('"@type":"FAQPage"')) existing.remove();
    });
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.faqSection = id || 'faq';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: visibleItems.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [visibleItems, id]);

  if (items.length === 0) return null;

  return (
    <SectionContainer background={background} paddingY="xl" id={id}>
      <ScrollReveal>
        <H2 className="text-center text-slate-900">{title}</H2>
        <div className="mx-auto mt-6 max-w-5xl">
          <FaqAccordionList items={visibleItems} />
          {previewLimit && items.length > visibleItems.length && (
            <div className="mt-6 flex justify-center">
              <a
                href="/faq"
                onClick={(event) => {
                  if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onNavigate('/faq');
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-800 hover:shadow-md"
              >
                See all FAQs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </ScrollReveal>
    </SectionContainer>
  );
};
