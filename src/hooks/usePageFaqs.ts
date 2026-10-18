import { useEffect, useState } from 'react';
import { firestoreFaqsService } from '../services/firestore/faqs';
import { SWS_FAQS } from '../data/swsLocalSeo';

export interface PageFaq {
  question: string;
  answer: string;
}

/**
 * Published FAQs for one page ('sws', 'contact'), managed in Admin → FAQs.
 * Read through the cached public snapshot, so this adds no API calls.
 * Until any FAQ has been saved in admin, the built-in FAQs are shown;
 * once admin manages FAQs, only those published for this page appear.
 */
export function usePageFaqs(page: string): PageFaq[] {
  const [faqs, setFaqs] = useState<PageFaq[]>(() => [...SWS_FAQS]);

  useEffect(() => {
    let active = true;
    firestoreFaqsService.getFaqs()
      .then((all) => {
        if (!active || all.length === 0) return; // nothing saved yet: keep the built-in FAQs
        setFaqs(
          all
            .filter((faq) => faq.isActive !== false && (faq.pages || []).includes(page))
            .map((faq) => ({ question: faq.question, answer: faq.answer }))
        );
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
