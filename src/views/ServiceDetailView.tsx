import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, MessageCircle } from 'lucide-react';
import { SEOHead } from '../components/layout/SEOHead';
import { SectionContainer } from '../components/ui/SectionContainer';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { DIVISIONS } from '../config/divisions';
import { firestoreServicesService } from '../services/firestore/services';
import { analyticsService } from '../services/analyticsService';
import { FirestoreService } from '../types/firestore';
import { openWhatsAppInquiry } from '../utils/whatsapp';
import { NotFoundView } from './NotFoundView';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { serviceSeo } from '../config/itemSeo';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import { getImageAlt } from '../config/imageAlt';

interface ServiceDetailViewProps {
  slug: string;
  onNavigate: (route: string) => void;
}

const SITE_ORIGIN = CANONICAL_SITE_ORIGIN;

function findService(services: FirestoreService[], slug: string): FirestoreService | null {
  const normalizedSlug = slug.toLowerCase();
  return services.find((service) =>
    service.isPublished !== false &&
    service.status !== 'inactive' &&
    service.status !== 'draft' &&
    (service.slug?.toLowerCase() === normalizedSlug ||
      service.id?.toLowerCase() === normalizedSlug ||
      service.sku?.toLowerCase() === normalizedSlug)
  ) || null;
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ slug, onNavigate }) => {
  const { services } = useFirestoreDataContext();
  const [loadedService, setLoadedService] = useState<FirestoreService | null>(null);
  const [hasResolved, setHasResolved] = useState(false);
  const service = useMemo(
    () => findService(services, slug) || loadedService,
    [services, slug, loadedService]
  );

  useEffect(() => {
    let active = true;
    setHasResolved(false);
    setLoadedService(null);
    void firestoreServicesService.getServices()
      .then((records) => {
        if (active) setLoadedService(findService(records, slug));
      })
      .catch((error: unknown) => {
        console.error(`[ServiceDetailView] Could not load service "${slug}":`, error);
      })
      .finally(() => {
        if (active) setHasResolved(true);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!service) return;
    const route = `/services/${encodeURIComponent(service.slug || service.id)}`;
    analyticsService.trackEvent('service_view', route, {
      serviceId: service.id,
      serviceName: service.title || service.name,
      category: service.category || '',
    }, String(service.divisionId || service.division || ''));
  }, [service]);

  if (!service) {
    if (!hasResolved) {
      return (
        <main className="flex min-h-[55vh] items-center justify-center bg-slate-50 px-4">
          <div role="status" className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
        </main>
      );
    }
    return <NotFoundView onNavigate={onNavigate} resourceType="service" attemptedSlug={slug} />;
  }

  const divisionId = String(service.divisionId || service.division || '');
  const division = DIVISIONS[divisionId as keyof typeof DIVISIONS];
  const divisionName = service.divisionName || division?.name || 'Mahdev';
  const title = service.title || service.name;
  const description = (service.description || `${title} from ${divisionName} in Sri Lanka.`).trim().slice(0, 300);
  const canonicalPath = `/services/${encodeURIComponent(service.slug || service.id)}`;
  // Same head the page shell sends crawlers for this URL (src/config/itemSeo.ts).
  const seo = serviceSeo(service as unknown as Record<string, unknown>, service.id);
  const price = Number(service.startingPrice || service.price || 0);
  // Every photo of the service (main image first), shown in the slider below.
  const serviceImages = [service.imageUrl, ...(service.images || [])].filter((url): url is string => Boolean(url));
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description,
    serviceType: service.category || title,
    provider: {
      '@type': 'Organization',
      name: divisionName,
      url: `${SITE_ORIGIN}${division?.route || '/'}`,
    },
    areaServed: { '@type': 'Country', name: 'Sri Lanka' },
    url: `${SITE_ORIGIN}${canonicalPath}`,
    ...(price > 0 ? {
      offers: {
        '@type': 'Offer',
        price: String(price),
        priceCurrency: service.currency || 'LKR',
        availability: 'https://schema.org/InStock',
        url: `${SITE_ORIGIN}${canonicalPath}`,
      },
    } : {}),
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-24">
      <SEOHead
        title={seo.title}
        description={seo.description}
        canonicalUrl={`${SITE_ORIGIN}${seo.path}`}
        keywords={[title, service.category || '', divisionName, 'Sri Lanka'].filter(Boolean)}
      />
      <script type="application/ld+json">
        {JSON.stringify(serviceSchema).replace(/</g, '\\u003c')}
      </script>
      <SectionContainer background="white" paddingY="sm">
        <button
          type="button"
          onClick={() => onNavigate('/services')}
          className="inline-flex items-center gap-2 py-3 text-sm font-semibold text-blue-800 hover:text-blue-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All services
        </button>
      </SectionContainer>
      <SectionContainer background="subtle" paddingY="lg">
        <article className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <ImageCarousel images={serviceImages} alt={getImageAlt(title, divisionName, service.category)} />
          <div className="p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              {divisionName}{service.category ? ` · ${service.category}` : ''}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-7 text-slate-600">
              {description}
            </p>
            {service.features?.length ? (
              <section className="mt-8" aria-labelledby="service-features">
                <h2 id="service-features" className="text-lg font-bold text-slate-900">What this service includes</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {service.features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pricing and delivery</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {price > 0 ? `From ${service.currency || 'LKR'} ${price.toLocaleString()}` : 'Request a tailored quote'}
                </p>
                {service.turnaroundTime && (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" /> {service.turnaroundTime}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openWhatsAppInquiry({
                    title,
                    category: service.category,
                    serviceId: service.id,
                    divisionName,
                    description,
                    price: price || undefined,
                    type: 'service',
                  })}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <MessageCircle aria-hidden="true" className="h-4 w-4" /> Ask on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(`/book/service/${encodeURIComponent(service.id)}`)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Book this service <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </div>
            {division?.route && (
              <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
                Part of{' '}
                <a className="font-semibold text-blue-700 hover:underline" href={division.route}>
                  {divisionName}
                </a>
                {' '}services in Sri Lanka.
              </p>
            )}
          </div>
        </article>
      </SectionContainer>
    </main>
  );
};
