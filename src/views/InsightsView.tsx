import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { CmsPage } from '../types/cms';
import { cmsService } from '../services/cmsService';

interface InsightsViewProps {
  onNavigate: (path: string) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<CmsPage[]>([]);

  useEffect(() => {
    const loadArticles = () => {
      setArticles(
        cmsService
          .getAll<CmsPage>('pages')
          .filter((page) => page.category === 'insights' && page.isPublished && !page.isDeleted)
          .sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt))
      );
    };
    const unsubscribe = cmsService.subscribe('pages', loadArticles);
    loadArticles();
    return unsubscribe;
  }, []);

  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <SEOHead
        title="Insights | Mahdev"
        description="Practical insights, project learnings, and helpful guidance from Mahdev's event, media, technology, travel, and production teams in Sri Lanka."
        canonicalUrl="https://mahdev-official.vercel.app/insights"
        keywords={['Mahdev insights', 'Sri Lanka event and production insights', 'business technology Sri Lanka']}
        noIndex={articles.length === 0}
      />
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Mahdev Insights
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Useful ideas and stories from our teams
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Read practical guidance and project stories published by Mahdev's teams across Sri Lanka.
          </p>
        </div>
      </SectionContainer>

      <SectionContainer background="white" paddingY="lg">
        {articles.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  {article.heroSubheading || 'Mahdev Insights'}
                </p>
                <h2 className="mt-3 font-display text-xl font-bold text-slate-950">
                  {article.title}
                </h2>
                <p className="mt-3 line-clamp-4 flex-1 text-sm leading-relaxed text-slate-600">
                  {article.metaDescription}
                </p>
                {article.publishedAt && (
                  <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    <time dateTime={article.publishedAt}>
                      {new Date(article.publishedAt).toLocaleDateString('en-LK', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </p>
                )}
                <a
                  href={`/insights/${encodeURIComponent(article.slug)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(`/insights/${encodeURIComponent(article.slug)}`);
                  }}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  Read article <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900">New insights are in progress</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Our team is preparing practical articles and project stories. Please check back soon.
            </p>
          </div>
        )}
      </SectionContainer>
    </main>
  );
};
