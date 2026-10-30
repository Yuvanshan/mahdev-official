/**
 * SWS Event Management local SEO data, shared by the /sws page, the runtime
 * structured data and the build-time prerendered HTML. Keep these details
 * identical to the Google Business Profile listing (name, address, phone):
 * Google compares them when deciding whether the website represents the
 * listing.
 */

import { CANONICAL_SITE_ORIGIN } from '../config/site.js';
import { keywordImageAlt, type ImageAltKeyword } from '../utils/keywordImageAlt.js';

export const SWS_BUSINESS = {
  parentName: 'MAHDEV Pvt. Ltd.',
  name: 'SWS Event Management',
  displayName: 'SWS Event Management (Division of MAHDEV Pvt. Ltd.)',
  phoneDisplay: '075 092 8078',
  phoneInternational: '+94750928078',
  whatsappUrl: 'https://wa.me/94750928078',
  url: `${CANONICAL_SITE_ORIGIN}/sws`,
  trincomalee: {
    streetAddress: 'No 95/15, Iluppaikkulam, Kanniya Road',
    locality: 'Trincomalee',
    postalCode: '31006',
    full: 'No 95/15, Iluppaikkulam, Kanniya Road, Trincomalee 31006',
    latitude: 8.6350857,
    longitude: 81.1988273,
    mapsUrl: 'https://maps.google.com/maps?cid=11092678752787023184',
  },
  colombo: {
    streetAddress: '41/22, Pickerings Road, Kotahena',
    locality: 'Colombo',
    full: '41/22, Pickerings Road, Kotahena, Colombo 13',
  },
  sameAs: [
    'https://maps.google.com/maps?cid=11092678752787023184',
    'https://web.facebook.com/SWSEventsManagement',
    'https://www.instagram.com/sws_event_management/',
  ],
} as const;

export const SWS_PRIMARY_HEADING = 'SWS Event Management – Event Decorators in Trincomalee';

/** Visible summary under the service headings, naming the searches the page should match. */
export const SWS_SERVICE_AREA_SUMMARY =
  'SWS Event Management decorates every kind of event: wedding decoration, birthday decoration, cradle ceremony decoration, puberty ceremony decoration, engagement, homecoming, anniversary, baby shower and corporate event decoration in Trincomalee, Nilaveli, Uppuveli and Colombo, Sri Lanka.';

// Each heading is rendered as an <h2> on /sws and in the prerendered HTML, so
// each one leads with the search phrase people type ("birthday decoration trincomalee").
export const SWS_SERVICE_HIGHLIGHTS = [
  {
    heading: 'Wedding Decorators Colombo & Trincomalee – Manavarai, Poruwa & Beach Wedding Decoration',
    body: 'Complete wedding decoration in Trincomalee and Colombo, from Manavarai and Poruwa stages to floral backdrops, entrance arches, table settings and beach wedding setups in Nilaveli and Uppuveli.',
  },
  {
    heading: 'Birthday Decoration in Trincomalee & Colombo – 1st Birthday, Milestone & Surprise Parties',
    body: 'Themed balloon decoration, backdrops, cake tables and venue styling for first birthdays, kids’ parties, milestone birthdays and surprise parties at homes, halls and hotels.',
  },
  {
    heading: 'Cradle Ceremony Decoration Sri Lanka – Traditional Cradle & Naming Ceremony Decor',
    body: 'Decorated cradles, floral and fabric backdrops, stage and seating for cradle ceremonies and naming ceremonies in Trincomalee, Colombo and across Sri Lanka.',
  },
  {
    heading: 'Puberty Ceremony Decoration Trincomalee & Colombo – Manjal Neerattu Vizha & Ponnurukku',
    body: 'Traditional stage decoration, floral backdrops and seating for Manjal Neerattu Vizha (puberty ceremonies) and Ponnurukku.',
  },
  {
    heading: 'Engagement, Homecoming & Anniversary Decoration in Trincomalee & Colombo',
    body: 'Romantic ring-ceremony stages, homecoming setups, anniversary dinners and candle-lit walkways styled to your theme.',
  },
  {
    heading: 'Baby Shower, Housewarming & Religious Event Decoration in Sri Lanka',
    body: 'Baby showers, gender reveals, housewarmings, poojas and temple or church functions decorated with flowers, drapes, balloons and lighting.',
  },
  {
    heading: 'Corporate Event Planner Trincomalee – Product Launches, Summits & Award Galas',
    body: 'Branded stage builds, digital backdrops, exhibition booths, registration desks and VIP lounges for annual general meetings, product launches and award banquets in Trincomalee and Colombo.',
  },
  {
    heading: 'Stage Decoration, Event Rentals, Photography & Catering in Trincomalee & Colombo',
    body: 'Stage and venue decoration, chairs, tables, sound, lighting and LED wall rentals, photography and videography with our U1 Studio team, and full-service catering, all from one trusted team.',
  },
] as const;

// Local search phrase for each kind of image, checked in order; the first match goes into the alt text.
// Specific ceremonies come before "wedding" so a "pre-wedding cradle" image still gets the cradle phrase.
const SWS_IMAGE_ALT_KEYWORDS: readonly ImageAltKeyword[] = [
  { pattern: /cradle|naming ceremony/i, phrase: 'Cradle Ceremony Decoration Sri Lanka' },
  { pattern: /puberty|manjal|ponnurukku|saree ceremony/i, phrase: 'Puberty Ceremony Decoration Trincomalee & Colombo' },
  { pattern: /birthday|kids|balloon|party/i, phrase: 'Birthday Decoration Trincomalee & Colombo' },
  { pattern: /baby shower|gender reveal|housewarming|pooja|puja|temple|church/i, phrase: 'Event Decoration Sri Lanka' },
  { pattern: /corporate|conference|summit|launch|business|executive|gala|award|agm/i, phrase: 'Corporate Event Planner Trincomalee' },
  { pattern: /engagement|homecoming|anniversary/i, phrase: 'Engagement & Homecoming Decoration Trincomalee & Colombo' },
  { pattern: /wedding|manavarai|poruwa|bridal/i, phrase: 'Wedding Decorators Colombo & Trincomalee' },
  { pattern: /stage|venue|backdrop/i, phrase: 'Stage Decoration Trincomalee & Colombo' },
];

/** Alt text for an SWS image: its own title plus the local search phrase that fits what it shows. */
export function getSwsImageAlt(title: string, ...context: Array<string | undefined>): string {
  return keywordImageAlt(SWS_IMAGE_ALT_KEYWORDS, `${SWS_BUSINESS.name}, Trincomalee & Colombo`, title, ...context);
}

export const SWS_FAQS = [
  {
    question: 'Who are the best event decorators in Trincomalee?',
    answer: 'SWS Event Management specialises in luxury wedding decorating, Manavarai setups, birthday party styling and cultural ceremonies across Trincomalee, Nilaveli and Uppuveli.',
  },
  {
    question: 'Do you handle traditional ceremonies like Manjal Neerattu Vizha?',
    answer: 'Yes. We offer traditional stage decoration, floral backdrops and seating arrangements for puberty ceremonies (Manjal Neerattu Vizha), Ponnurukku and cradle ceremonies.',
  },
  {
    question: 'How can I book SWS Event Management for my wedding?',
    answer: 'You can reach us 24/7 on WhatsApp at 075 092 8078, or visit our office at No 95/15, Iluppaikkulam, Kanniya Road, Trincomalee.',
  },
] as const;

/** FAQPage JSON-LD for any page showing SWS_FAQS (e.g. /contact). */
export function getFaqStructuredData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SWS_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** JSON-LD for the /sws page: the SWS EventPlanner (Trincomalee branch). FAQ schema is added at runtime from admin-managed FAQs. */
export function getSwsStructuredData(): Array<Record<string, unknown>> {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'EventPlanner',
      '@id': `${SWS_BUSINESS.url}#business`,
      name: `${SWS_BUSINESS.name} Trincomalee`,
      url: SWS_BUSINESS.url,
      telephone: SWS_BUSINESS.phoneInternational,
      image: `${CANONICAL_SITE_ORIGIN}/assets/images/sws_logo.jpeg`,
      logo: `${CANONICAL_SITE_ORIGIN}/assets/images/sws_logo.jpeg`,
      priceRange: '$$',
      parentOrganization: { '@id': `${CANONICAL_SITE_ORIGIN}/#organization` },
      address: {
        '@type': 'PostalAddress',
        streetAddress: SWS_BUSINESS.trincomalee.streetAddress,
        addressLocality: SWS_BUSINESS.trincomalee.locality,
        postalCode: SWS_BUSINESS.trincomalee.postalCode,
        addressCountry: 'LK',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: SWS_BUSINESS.trincomalee.latitude,
        longitude: SWS_BUSINESS.trincomalee.longitude,
      },
      hasMap: SWS_BUSINESS.trincomalee.mapsUrl,
      areaServed: ['Trincomalee', 'Nilaveli', 'Uppuveli', 'Colombo'],
      // The decoration services by name, so searches like "cradle ceremony decoration sri lanka" match the listing.
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Event decoration services',
        itemListElement: SWS_SERVICE_HIGHLIGHTS.map((service) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: service.heading, description: service.body },
        })),
      },
      sameAs: [...SWS_BUSINESS.sameAs],
    },
  ];
}
