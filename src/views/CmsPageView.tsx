import React, { useEffect, useState } from 'react';
import { CmsPage } from '../types/cms';
import { cmsService } from '../services/cmsService';
import { NotFoundView } from './NotFoundView';

interface CmsPageViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const CmsPageView: React.FC<CmsPageViewProps> = ({ slug, onNavigate }) => {
  const [page, setPage] = useState<CmsPage | null>(null);

  useEffect(() => {
    const loadPage = () => {
      const publishedPage = cmsService
        .getAll<CmsPage>('pages')
        .find((item) => item.slug === slug && item.isPublished);
      setPage(publishedPage || null);
    };
    const unsubscribe = cmsService.subscribe('pages', loadPage);
    loadPage();
    return unsubscribe;
  }, [slug]);

  useEffect(() => {
    if (page) document.title = `${page.title} | Mahdev`;
  }, [page]);

  if (!page) {
    return <NotFoundView onNavigate={onNavigate} resourceType="page" attemptedSlug={slug} />;
  }

  return (
    <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 mb-3">{page.category}</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-950">{page.heroHeading || page.title}</h1>
        {page.heroSubheading && <p className="mt-4 text-lg text-slate-600">{page.heroSubheading}</p>}
        {page.metaDescription && <p className="mt-5 text-sm text-slate-500">{page.metaDescription}</p>}
      </header>
      <article className="space-y-8 text-slate-700 leading-7">
        {page.content && <p className="whitespace-pre-wrap">{page.content}</p>}
        {page.sections?.map((section, index) => (
          <section key={`${section.heading}-${index}`}>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">{section.heading}</h2>
            <p className="whitespace-pre-wrap">{section.body}</p>
          </section>
        ))}
      </article>
    </main>
  );
};
