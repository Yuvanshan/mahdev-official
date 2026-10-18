import React from 'react';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import { SectionContainer } from '../ui/SectionContainer';
import { H2, H3, Body } from '../ui/Heading';
import { ScrollReveal } from '../motion/MotionWrappers';
import { SWS_BUSINESS, SWS_FAQS, SWS_SERVICE_HIGHLIGHTS } from '../../data/swsLocalSeo';

/**
 * Local search section for /sws: keyword service headings, the exact business
 * name/address/phone from the Google Business Profile, an embedded map of the
 * Trincomalee pin and a local FAQ. Content comes from src/data/swsLocalSeo.ts,
 * which also feeds the page's structured data.
 */
export const SWSLocalSection: React.FC = () => {
  // Coordinates of the Trincomalee Google Maps pin. google.com is already allowed in the CSP frame-src.
  const mapEmbedUrl = `https://www.google.com/maps?q=${SWS_BUSINESS.trincomalee.latitude},${SWS_BUSINESS.trincomalee.longitude}&z=16&output=embed`;

  return (
    <>
      <SectionContainer background="white" paddingY="xl" id="sws-event-services">
        <ScrollReveal>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Trincomalee &amp; Colombo</p>
          <p className="font-editorial text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Event decoration and styling services</p>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {SWS_SERVICE_HIGHLIGHTS.map((service) => (
              <article key={service.heading} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                {/* Each service is its own h2 so search engines see the local service keywords. */}
                <h2 className="text-lg font-semibold leading-snug text-slate-900">{service.heading}</h2>
                <Body className="mt-2 text-slate-600">{service.body}</Body>
              </article>
            ))}
          </div>
        </ScrollReveal>
      </SectionContainer>

      <SectionContainer background="subtle" paddingY="xl" id="sws-visit-us">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <ScrollReveal>
            <H2 className="text-slate-900">Visit or contact SWS Event Management</H2>
            <address className="mt-6 space-y-4 not-italic text-slate-700">
              <p className="font-semibold text-slate-900">{SWS_BUSINESS.displayName}</p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <span><strong>Trincomalee:</strong> {SWS_BUSINESS.trincomalee.full}</span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <span><strong>Colombo:</strong> {SWS_BUSINESS.colombo.full}</span>
              </p>
              <p className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                <span>
                  <strong>Hotline / WhatsApp:</strong>{' '}
                  <a className="text-blue-700 underline" href={`tel:${SWS_BUSINESS.phoneInternational}`}>{SWS_BUSINESS.phoneDisplay}</a>
                </span>
              </p>
            </address>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={SWS_BUSINESS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp us
              </a>
              <a
                href={SWS_BUSINESS.trincomalee.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" /> Open in Google Maps
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <iframe
                title="SWS Event Management, Trincomalee on Google Maps"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-80 w-full border-0"
              />
            </div>
          </ScrollReveal>
        </div>
      </SectionContainer>

      <SectionContainer background="white" paddingY="xl" id="sws-faq">
        <ScrollReveal>
          <H2 className="text-slate-900">Frequently asked questions</H2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {SWS_FAQS.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-slate-900">
                  <H3 className="text-base">{faq.question}</H3>
                </summary>
                <Body className="mt-3 text-slate-600">{faq.answer}</Body>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </SectionContainer>
    </>
  );
};
