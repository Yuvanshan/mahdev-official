/**
 * SWS Event Management local SEO data, shared by the /sws page, the runtime
 * structured data and the build-time prerendered HTML. Keep these details
 * identical to the Google Business Profile listing (name, address, phone):
 * Google compares them when deciding whether the website represents the
 * listing.
 */

export const SWS_BUSINESS = {
  parentName: 'MAHDEV Pvt. Ltd.',
  name: 'SWS Event Management',
  displayName: 'SWS Event Management (Division of MAHDEV Pvt. Ltd.)',
  phoneDisplay: '075 092 8078',
  phoneInternational: '+94750928078',
  whatsappUrl: 'https://wa.me/94750928078',
  url: 'https://mahdev-official.vercel.app/sws',
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

export const SWS_PRIMARY_HEADING = 'SWS Event Management – Premier Wedding & Party Decorators in Trincomalee & Colombo';

export const SWS_SERVICE_HIGHLIGHTS = [
  {
    heading: 'Luxury Wedding, Manavarai, Poruwa & Beach Wedding Decoration in Trincomalee',
    body: 'Complete wedding styling from Manavarai and Poruwa stages to floral backdrops, entrance arches, table settings and beach wedding setups in Trincomalee, Nilaveli and Uppuveli.',
  },
  {
    heading: '1st Birthday, Milestone Birthday & Surprise Party Styling',
    body: 'Themed balloon decor, backdrops, cake tables and venue styling for first birthdays, milestone celebrations and surprise parties at homes, halls and hotels.',
  },
  {
    heading: 'Traditional Puberty Ceremony (Manjal Neerattu Vizha) & Cradle Decor',
    body: 'Traditional stage decoration, floral backdrops and seating for Manjal Neerattu Vizha (puberty ceremonies), Ponnurukku and cradle ceremonies.',
  },
  {
    heading: 'Event Photography, Videography & Full-Service Event Catering',
    body: 'Photography and videography with our U1 Studio team, plus full-service catering, so your whole event is handled by one trusted team.',
  },
] as const;

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
      image: 'https://mahdev-official.vercel.app/assets/images/sws_logo.jpeg',
      logo: 'https://mahdev-official.vercel.app/assets/images/sws_logo.jpeg',
      priceRange: '$$',
      parentOrganization: { '@id': 'https://mahdev-official.vercel.app/#organization' },
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
      sameAs: [...SWS_BUSINESS.sameAs],
    },
  ];
}
