import React from 'react';
import { ArrowRight, CalendarDays, Tag } from 'lucide-react';
import { useAvailableCmsBanners } from '../hooks/useAvailableCmsBanners';

interface PromotionsViewProps {
  onNavigate: (route: string) => void;
}

function formatOfferDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({ onNavigate }) => {
  const banners = useAvailableCmsBanners();

  const openOffer = (targetUrl: string) => {
    if (/^https?:\/\//i.test(targetUrl)) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`);
  };

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <header className="bg-slate-950 px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
            <Tag className="h-3.5 w-3.5" /> Current offers
          </div>
          <h1 className="font-display text-3xl font-bold sm:text-5xl">Promotions &amp; Offers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Explore our currently available offers. Expired promotions are removed automatically.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {banners.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => {
              const endDate = formatOfferDate(banner.endDate);
              return (
                <article
                  key={banner.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  {banner.imageUrl ? (
                    <div className="relative h-52 bg-slate-200">
                      <img
                        src={banner.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {banner.badgeText && (
                        <span className="absolute left-4 top-4 rounded-full bg-blue-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          {banner.badgeText}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-40 items-end bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-950 p-5">
                      {banner.badgeText && (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          {banner.badgeText}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-slate-900">{banner.title}</h2>
                    {banner.subtitle && (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{banner.subtitle}</p>
                    )}
                    {endDate && (
                      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                        <CalendarDays className="h-4 w-4" /> Available through {endDate}
                      </p>
                    )}
                    {banner.targetUrl && (
                      <button
                        type="button"
                        onClick={() => openOffer(banner.targetUrl)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                      >
                        {banner.buttonText || 'View offer'} <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Tag className="mx-auto h-8 w-8 text-slate-400" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">No active offers right now</h2>
            <p className="mt-2 text-sm text-slate-600">Please check back soon for our latest promotions.</p>
          </div>
        )}
      </main>
    </div>
  );
};
