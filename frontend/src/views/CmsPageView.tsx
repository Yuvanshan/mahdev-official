import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { CmsPage } from '../types/cms';
import { cmsService } from '../services/cmsService';
import { NotFoundView } from './NotFoundView';
import { SEOHead } from '../components/layout/SEOHead';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { formatPageTitle } from '../config/pageTitles';

interface CmsPageViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

function resolveContentImage(image?: string): string | undefined {
  if (!image || image.startsWith('data:')) return undefined;
  try {
    const url = new URL(image, CANONICAL_SITE_ORIGIN);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const CmsPageView: React.FC<CmsPageViewProps> = ({ slug, onNavigate }) => {
  const [page, setPage] = useState<CmsPage | null>(null);

  useEffect(() => {
    const loadPage = () => {
      const publishedPage = cmsService
        .getAll<CmsPage>('pages')
        .find((item) =>
          item.isPublished &&
          !item.isDeleted &&
          (item.category === 'insights'
            ? [`blog/${item.slug}`, `insights/${item.slug}`].includes(slug)
            : item.slug === slug)
        );
      setPage(publishedPage || null);
    };
    const unsubscribe = cmsService.subscribe('pages', loadPage);
    loadPage();
    return unsubscribe;
  }, [slug]);

  useEffect(() => {
    if (page) document.title = formatPageTitle(page.title);
  }, [page]);

  if (!page) {
    return <NotFoundView onNavigate={onNavigate} resourceType="page" attemptedSlug={slug} />;
  }

  const canonicalPath = (page.category === 'insights' ? `blog/${page.slug}` : page.slug)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  const description = page.metaDescription ||
    page.heroSubheading ||
    page.content.replace(/[#*_`>\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const articleImages = [
    resolveContentImage(page.heroImageUrl),
    ...(page.sections || []).map((section) => resolveContentImage(section.imageUrl)),
  ].filter((image): image is string => Boolean(image));
  const articleImage = articleImages[0];
  const articleStructuredData = page.category === 'insights'
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: page.title,
        description,
        ...(articleImages.length ? { image: articleImages } : {}),
        ...(page.publishedAt ? { datePublished: page.publishedAt } : {}),
        ...(page.updatedAt ? { dateModified: page.updatedAt } : {}),
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${CANONICAL_SITE_ORIGIN}/${canonicalPath}` },
        author: { '@type': 'Organization', name: 'Mahdev (Pvt) Ltd' },
        publisher: { '@id': `${CANONICAL_SITE_ORIGIN}/#organization` },
        inLanguage: 'en-LK',
      }
    : undefined;

  return (
    <section className="max-w-5xl mx-auto w-full px-[var(--page-gutter)] py-16 sm:py-24">
      <SEOHead
        title={page.title}
        description={description}
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/${canonicalPath}`}
        ogType={page.category === 'insights' ? 'article' : 'website'}
        ogImage={articleImage}
        structuredData={articleStructuredData}
      />
      <header className="mb-10 border-b border-slate-200 pb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 mb-3">{page.category}</p>
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-slate-950">{page.heroHeading || page.title}</h1>
        {page.heroSubheading && <p className="mt-4 text-lg text-slate-600">{page.heroSubheading}</p>}
        {page.metaDescription && <p className="mt-5 text-sm text-slate-500">{page.metaDescription}</p>}
        {page.publishedAt && (
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            <time dateTime={page.publishedAt}>
              {new Date(page.publishedAt).toLocaleDateString('en-LK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </p>
        )}
      </header>
      {articleImage && (
        <img
          src={articleImage}
          alt={page.title}
          className="mb-10 max-h-[34rem] w-full rounded-2xl bg-slate-100 object-contain"
        />
      )}
      <article className="space-y-8 text-slate-700 leading-7">
        {page.content && <p className="whitespace-pre-wrap">{page.content}</p>}
        {page.sections?.map((section, index) => (
          <section key={`${section.heading}-${index}`}>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">{section.heading}</h2>
            <p className="whitespace-pre-wrap">{section.body}</p>
            {resolveContentImage(section.imageUrl) && (
              <img
                src={resolveContentImage(section.imageUrl)}
                alt={section.heading || page.title}
                loading="lazy"
                className="mt-4 max-h-[34rem] w-full rounded-2xl bg-slate-100 object-contain"
              />
            )}
          </section>
        ))}
      </article>
      {page.category === 'insights' && (
        <aside className="mt-12 rounded-2xl bg-slate-950 px-6 py-8 text-center text-white sm:px-10">
          <h2 className="font-display text-2xl font-bold">Planning an event?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Explore Mahdev services, event decorations, and real projects from our gallery.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {[
              { label: 'Explore services & decorations', route: '/catalog' },
              { label: 'View the gallery', route: '/gallery' },
            ].map(({ label, route }) => (
              <a
                key={route}
                href={route}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onNavigate(route);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
              >
                {label}
              </a>
            ))}
          </div>
        </aside>
      )}
    </section>
  );
};
