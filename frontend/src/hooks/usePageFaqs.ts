import { useEffect, useState } from 'react';
import { firestoreFaqsService } from '../services/firestore/faqs';
import { SITE_FAQS } from '../data/siteFaqs';
import { SWS_FAQS } from '../../../shared/data/swsLocalSeo';
import { useI18n } from '../i18n/I18nContext';
import { localizeRecord } from '../i18n/localizeData';

export interface PageFaq {
  question: string;
  answer: string;
}

/**
 * Published FAQs for one page ('sws', 'contact') or the all-FAQ index ('all'),
 * managed in Admin → FAQs.
 * Read through the cached public snapshot, so this adds no API calls.
 * The built-in questions fill any gaps in the public page while admin-managed
 * questions remain first and take precedence over matching defaults.
 */
export function usePageFaqs(page: string): PageFaq[] {
  const { lang } = useI18n();
  const [faqs, setFaqs] = useState<PageFaq[]>(() => [...(page === 'sws' ? SWS_FAQS : SITE_FAQS)]);

  useEffect(() => {
    let active = true;
    firestoreFaqsService.getFaqs()
      .then((all) => {
        if (!active || all.length === 0) return; // nothing saved yet: keep the built-in FAQs
        const pageFaqs = page === 'all'
          ? all
          : all.filter((faq) => (faq.pages || []).includes(page));
        const publishedFaqs = pageFaqs
          .filter((faq) => faq.isActive !== false)
          .map((faq) => {
            // Stored Tamil or Sinhala text for the admin-managed FAQ (English when none).
            const shown = lang === 'en' ? faq : localizeRecord('faqs', faq, lang);
            return { question: shown.question, answer: shown.answer };
          });
        const normalizeQuestion = (question: string) => question.trim().toLocaleLowerCase();
        const configuredQuestions = new Set(pageFaqs.map((faq) => normalizeQuestion(faq.question)));
        const visibleQuestions = new Set(publishedFaqs.map((faq) => normalizeQuestion(faq.question)));
        const combined = page === 'all'
          ? [...publishedFaqs]
          : [...publishedFaqs].slice(0, SITE_FAQS.length);

        for (const faq of SITE_FAQS) {
          if (page !== 'all' && combined.length >= SITE_FAQS.length) break;
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
  }, [page, lang]);

  return faqs;
}
