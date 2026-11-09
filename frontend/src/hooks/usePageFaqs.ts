import { useEffect, useState } from 'react';
import { firestoreFaqsService } from '../services/firestore/faqs';
import { SITE_FAQS } from '../data/siteFaqs';

export interface PageFaq {
  question: string;
  answer: string;
}

/**
 * Published FAQs for one page ('sws', 'contact'), managed in Admin → FAQs.
 * Read through the cached public snapshot, so this adds no API calls.
 * The built-in questions fill any gaps in the public page while admin-managed
 * questions remain first and take precedence over matching defaults.
 */
export function usePageFaqs(page: string): PageFaq[] {
  const [faqs, setFaqs] = useState<PageFaq[]>(() => [...SITE_FAQS]);

  useEffect(() => {
    let active = true;
    firestoreFaqsService.getFaqs()
      .then((all) => {
        if (!active || all.length === 0) return; // nothing saved yet: keep the built-in FAQs
        const pageFaqs = all.filter((faq) => (faq.pages || []).includes(page));
        const publishedFaqs = pageFaqs
          .filter((faq) => faq.isActive !== false)
          .map((faq) => ({ question: faq.question, answer: faq.answer }));
        const normalizeQuestion = (question: string) => question.trim().toLocaleLowerCase();
        const configuredQuestions = new Set(pageFaqs.map((faq) => normalizeQuestion(faq.question)));
        const visibleQuestions = new Set(publishedFaqs.map((faq) => normalizeQuestion(faq.question)));
        const combined = [...publishedFaqs].slice(0, SITE_FAQS.length);

        for (const faq of SITE_FAQS) {
          if (combined.length >= SITE_FAQS.length) break;
          const question = normalizeQuestion(faq.question);
          if (configuredQuestions.has(question) || visibleQuestions.has(question)) continue;
          combined.push(faq);
          visibleQuestions.add(question);
        }

        setFaqs(combined);
      })
      .catch(() => {
        // Keep the built-in FAQs if the read fails.
      });
    return () => {
      active = false;
    };
  }, [page]);

  return faqs;
}
