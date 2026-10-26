import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Tag } from 'lucide-react';
import { useAvailableCmsBanners } from '../hooks/useAvailableCmsBanners';

interface PromotionsViewProps {
  onNavigate: (route: string) => void;
  selectedOfferId?: string;
}

function formatOfferDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({ onNavigate, selectedOfferId }) => {
  const banners = useAvailableCmsBanners();
  const selectedOffer = banners.find((banner) => banner.id === selectedOfferId);

  const openOffer = (targetUrl: string) => {
    if (/^https?:\/\//i.test(targetUrl)) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`);
  };

  if (selectedOfferId) {
    if (!selectedOffer) {
      return (
        <div className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
          <Tag className="h-9 w-9 text-slate-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">This offer is no longer available</h1>
          <p className="mt-2 text-sm text-slate-600">It may have expired or been removed.</p>
          <button
            type="button"
            onClick={() => onNavigate('/promotion')}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
          >
            <ArrowLeft className="h-4 w-4" /> Browse current offers
          </button>
        </div>
      );
    }

    const endDate = formatOfferDate(selectedOffer.endDate);
    return (
      <div className="min-h-[70vh] bg-slate-50">
        <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <button
            type="button"
            onClick={() => onNavigate('/promotion')}
            className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4" /> All promotions
          </button>
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
            {selectedOffer.imageUrl ? (
              <img
                src={selectedOffer.imageUrl}
                alt={selectedOffer.title}
                className="max-h-[min(55vh,32rem)] w-full bg-slate-200 object-cover"
              />
            ) : (
              <div className="flex min-h-48 items-end bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-950 p-6 sm:min-h-64 sm:p-10">
                {selectedOffer.badgeText && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {selectedOffer.badgeText}
                  </span>
                )}
              </div>
            )}
            <div className="p-5 sm:p-8 lg:p-10">
              {selectedOffer.imageUrl && selectedOffer.badgeText && (
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-800">
                  {selectedOffer.badgeText}
                </span>
              )}
              <h1 className="mt-3 break-words text-2xl font-bold text-slate-950 sm:text-4xl">
                {selectedOffer.title}
              </h1>
              {selectedOffer.subtitle && (
                <p className="mt-4 whitespace-pre-line break-words text-base leading-7 text-slate-600 sm:text-lg">
                  {selectedOffer.subtitle}
                </p>
              )}
              {endDate && (
                <p className="mt-5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                  <CalendarDays className="h-4 w-4" /> Available through {endDate}
                </p>
              )}
              <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap">
                {selectedOffer.targetUrl && (
                  <button
                    type="button"
                    onClick={() => openOffer(selectedOffer.targetUrl)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                  >
                    {selectedOffer.buttonText || 'View offer'} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Explore all services <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-slate-50">
      <header className="bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-100">
            <Tag className="h-3.5 w-3.5" /> Current offers
          </div>
          <h1 className="break-words font-display text-3xl font-bold sm:text-5xl">Promotions &amp; Offers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Explore our currently available offers. Expired promotions are removed automatically.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {banners.length ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner) => {
              const endDate = formatOfferDate(banner.endDate);
              return (
                <article
                  key={banner.id}
                  className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl"
                >
                  {banner.imageUrl ? (
                    <div className="relative h-52 bg-slate-200">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
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
                    <h2 className="break-words text-lg font-bold text-slate-900 sm:text-xl">{banner.title}</h2>
                    {banner.subtitle && (
                      <p className="mt-2 break-words text-sm leading-6 text-slate-600">{banner.subtitle}</p>
                    )}
                    {endDate && (
                      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        <CalendarDays className="h-4 w-4" /> Available through {endDate}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate(`/promotion?offer=${encodeURIComponent(banner.id)}`)}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                    >
                      View offer <ArrowRight className="h-4 w-4" />
                    </button>
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
