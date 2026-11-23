import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CalendarDays } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { BlurredImageFrame } from '../components/common/BlurredImageFrame';
import { CmsPage } from '../types/cms';
import { cmsService } from '../services/cmsService';
import { CANONICAL_SITE_ORIGIN } from '../config/site';

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
    <section className="min-h-screen bg-white pt-24 pb-16">
      <SEOHead
        title="Mahdev Blog | Event, Media & Business Guides"
        description="Practical event planning, wedding decoration, photography, technology and travel guides from the Mahdev teams in Sri Lanka."
        canonicalUrl={`${CANONICAL_SITE_ORIGIN}/blog`}
        keywords={['Mahdev blog', 'event planner Trincomalee', 'wedding decoration Sri Lanka', 'event management Colombo']}
      />
      <SectionContainer background="subtle" paddingY="lg" hasBorderBottom>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            Mahdev Blog
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Guides and stories from our teams
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Read practical event planning, decoration and project guides published by Mahdev teams across Sri Lanka.
          </p>
          <a
            href="/catalog"
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onNavigate('/catalog');
            }}
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#861F31] px-5 text-sm font-semibold text-white transition hover:bg-[#6e1427]"
          >
            Explore services &amp; decorations <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </SectionContainer>

      <SectionContainer background="white" paddingY="lg">
        {articles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
            {articles.map((article) => (
              <article key={article.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <BlurredImageFrame
                  src={article.heroImageUrl}
                  alt={article.title}
                  className="!aspect-[4/3] w-full"
                  imageWidth={640}
                  imageSizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1280px) 22vw, 18vw"
                />
                <div className="flex flex-1 flex-col items-center p-3 text-center sm:p-4">
                  <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700 sm:text-xs">
                    {article.heroSubheading || 'Mahdev Blog'}
                  </p>
                  <h2 className="mt-2 line-clamp-2 font-display text-sm font-bold leading-snug text-slate-950 sm:text-base">
                    {article.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {article.metaDescription}
                  </p>
                  {article.publishedAt && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] text-slate-500 sm:text-xs">
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      <time dateTime={article.publishedAt}>
                        {new Date(article.publishedAt).toLocaleDateString('en-LK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    </p>
                  )}
                  <a
                    href={`/blog/${encodeURIComponent(article.slug)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      onNavigate(`/blog/${encodeURIComponent(article.slug)}`);
                    }}
                    className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 sm:text-sm"
                  >
                    Read <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h2 className="font-display text-xl font-bold text-slate-900">New blog posts are in progress</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Our team is preparing practical guides and project stories. Please check back soon.
            </p>
          </div>
        )}
      </SectionContainer>
    </section>
  );
};
