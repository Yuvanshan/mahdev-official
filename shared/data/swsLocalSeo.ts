/**
 * SWS Event Management local SEO data, shared by the /sws page, the runtime
 * structured data and the build-time prerendered HTML. Keep these details
 * identical to the Google Business Profile listing (name, address, phone):
 * Google compares them when deciding whether the website represents the
 * listing.
 */

import { CANONICAL_SITE_ORIGIN } from '../config/site.js';
import { SOCIAL_PROFILES } from '../config/company.js';
import { getDivisionSiteUrl } from '../config/divisionSites.js';
import { keywordImageAlt, type ImageAltKeyword } from '../domain/keywordImageAlt.js';

export const SWS_BUSINESS = {
  parentName: 'MAHDEV Pvt. Ltd.',
  name: 'SWS Event Management',
  displayName: 'SWS Event Management (Division of MAHDEV Pvt. Ltd.)',
  phoneDisplay: '075 092 8078',
  phoneInternational: '+94750928078',
  whatsappUrl: 'https://wa.me/94750928078',
  url: getDivisionSiteUrl('sws'),
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
    postalCode: '01300',
    latitude: 6.9500542,
    longitude: 79.8587206,
    mapsUrl: 'https://maps.google.com/maps?cid=5377861460541524515',
  },
  sameAs: [
    'https://maps.google.com/maps?cid=11092678752787023184',
    // The brand profiles (not the parent company's LinkedIn page) all link to this /sws page.
    ...SOCIAL_PROFILES.filter(({ label }) => label !== 'LinkedIn').map(({ url }) => url),
  ],
} as const;

export const SWS_PRIMARY_HEADING = 'SWS Event Management – Event Planner in Trincomalee';

/** Visible summary under the service headings, naming the searches the page should match. */
export const SWS_SERVICE_AREA_SUMMARY =
  'SWS Event Management decorates every kind of event: wedding decoration, birthday decoration, cradle ceremony decoration, puberty ceremony decoration, engagement, homecoming, anniversary, baby shower and corporate event decoration in Trincomalee, Nilaveli, Uppuveli and Colombo, Sri Lanka.';

export const SWS_TARGET_KEYWORDS = [
  'event planner in Trincomalee',
  'best event planner in Trincomalee',
  'event management company in Trincomalee',
  'wedding decorators in Trincomalee',
  'wedding decoration in Colombo',
  'birthday decoration in Trincomalee',
  'beach wedding decoration in Nilaveli',
  'corporate event planner in Colombo',
  'cultural ceremony decoration in Sri Lanka',
  'event rentals in Trincomalee',
] as const;

/** Services as listed on the Google Business Profile (category: Event management company). Keep in step with it. */
export const SWS_PROFILE_SERVICES = [
  'Event planning', 'Weddings', 'Wedding and engagement', 'Wedding florist services', 'Birthday party planning',
  "Children's party planning", 'Baby shower planning', 'Anniversary party planning', 'Retirement party planning',
  'Theme parties', 'Event decor design', 'Corporate events', 'Corporate and conference', 'School event',
  'Religious event', 'Quinceanera', 'Catering', 'Photography',
] as const;

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
    question: 'Who is the best event planner in Trincomalee?',
    answer: 'If you are looking for an event planner in Trincomalee, SWS Event Management plans and decorates weddings, birthdays, cultural ceremonies and corporate events in Trincomalee, Nilaveli, Uppuveli and Colombo. Compare recent work, services, availability and quotations to find the right planner for your event.',
  },
  {
    question: 'What types of wedding decorations do you offer?',
    answer: 'We provide wedding styling including traditional Hindu Manavarai stages, Poruwa setups, floral backdrops, bridal walkways, table centerpieces, lighting and outdoor beach wedding arrangements.',
  },
  {
    question: 'How much does wedding or birthday decoration cost in Trincomalee?',
    answer: 'Decoration packages are quoted based on the venue, design, materials and event requirements. Message SWS Event Management on WhatsApp at 075 092 8078 with your reference image, venue and event date to discuss a quotation.',
  },
  {
    question: 'Do you offer birthday party decorations in Trincomalee and Colombo?',
    answer: 'Yes. SWS can style first birthdays, children’s themed parties, milestone birthdays and surprise celebrations with balloon arrangements, backdrops, cake tables and themed decor at homes, halls and hotels.',
  },
  {
    question: 'Can you recreate a decoration design from a reference photo?',
    answer: 'Share your reference photos and event details with our team. We can discuss the colours, backdrop, floral styling and materials and provide a design proposal suited to your event and budget.',
  },
  {
    question: 'Can I book SWS Event Management for a last-minute event?',
    answer: 'Short-notice bookings may be possible depending on the date, venue and setup requirements. Contact us as soon as possible to check availability.',
  },
  {
    question: 'Do you decorate traditional Tamil and Sri Lankan cultural ceremonies?',
    answer: 'Yes. SWS can provide decor for cultural and family ceremonies such as Manjal Neerattu Vizha, Ponnurukku, cradle ceremonies, baby showers, engagements, Mehendi functions and housewarmings.',
  },
  {
    question: 'Do you provide event rentals like chairs, marquees and buffet sets in Trincomalee?',
    answer: 'Event rental options include marquee tents, canopies, chairs, tables, buffet setups, stage platforms, sound and lighting equipment. Availability depends on your event date and location.',
  },
  {
    question: 'Does SWS Event Management also provide wedding photography and videography?',
    answer: 'Photography and videography can be coordinated through our U1 Studio media team, including wedding photography, event coverage and video production. Contact us to confirm the package and availability.',
  },
  {
    question: 'Do you organize corporate events and conferences in Trincomalee and Colombo?',
    answer: 'Yes. SWS plans and styles corporate events, conferences, product launches, annual dinners and team events, with stage backdrops, audio-visual setup and on-site coordination.',
  },
  {
    question: 'Which areas in Sri Lanka do you serve?',
    answer: 'SWS is based in Trincomalee and Colombo. The team serves Trincomalee, Nilaveli, Uppuveli, Kanniya, Kinniya, Mutur, Kantale and Greater Colombo, and can discuss travel for events elsewhere in Sri Lanka.',
  },
  {
    question: 'How far in advance should I book wedding or event decoration?',
    answer: 'For weddings and large receptions, contact us one to three months ahead when possible. For birthdays, engagements and smaller functions, one to two weeks’ notice is helpful. Availability varies, so ask us about your date.',
  },
  {
    question: 'Do you handle outdoor and beach wedding setups in Nilaveli and Uppuveli?',
    answer: 'Yes. SWS can plan outdoor wedding decor such as ceremony arches, reception canopies, lighting walkways and seaside dining arrangements. The design and setup depend on the venue and weather conditions.',
  },
  {
    question: 'Can you arrange cakes, catering and makeup as part of a full event package?',
    answer: 'We can discuss coordinating cakes, catering, makeup and entertainment with your event setup. Tell us which services you need so we can confirm availability and the providers for your date.',
  },
  {
    question: 'How do I book or get a quotation from SWS Event Management?',
    answer: 'Call or WhatsApp 075 092 8078 or 076 898 8970. Share your event type, date, venue and reference images so our team can discuss availability and a tailored quotation.',
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

/** JSON-LD for the SWS site: the SWS EventPlanner (Trincomalee branch). */
export function getSwsStructuredData(): Array<Record<string, unknown>> {
  const swsOrigin = new URL(SWS_BUSINESS.url).origin;
  const parentOrganization = { '@id': `${CANONICAL_SITE_ORIGIN}/#organization` };
  const openingHoursSpecification = {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '00:00',
    closes: '23:59',
  };
  const makeBranch = (
    id: string,
    name: string,
    address: {
      streetAddress: string;
      locality: string;
      region: string;
      postalCode: string;
      latitude: number;
      longitude: number;
      mapsUrl: string;
    },
    areaServed: Array<{ '@type': string; name: string }>,
    catalogName: string,
    offers: Array<{ name: string; description: string }>,
  ): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': ['EventPlanner', 'LocalBusiness'],
    '@id': `${SWS_BUSINESS.url}#${id}`,
    name,
    alternateName: ['SWS Events'],
    description: `${name} is an event planning and decoration service in Sri Lanka, specializing in weddings, birthdays, cultural ceremonies and corporate events.`,
    url: SWS_BUSINESS.url,
    telephone: SWS_BUSINESS.phoneInternational,
    image: `${swsOrigin}/assets/images/sws_logo.jpeg`,
    logo: `${swsOrigin}/assets/images/sws_logo.jpeg`,
    priceRange: '$$',
    currenciesAccepted: 'LKR',
    paymentAccepted: ['Cash', 'Bank Transfer', 'Online Payment'],
    parentOrganization,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      addressLocality: address.locality,
      addressRegion: address.region,
      postalCode: address.postalCode,
      addressCountry: 'LK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: address.latitude,
      longitude: address.longitude,
    },
    hasMap: address.mapsUrl,
    openingHoursSpecification,
    areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: catalogName,
      itemListElement: offers.map((offer) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', ...offer },
      })),
    },
    sameAs: [...SWS_BUSINESS.sameAs],
  });

  return [
    makeBranch(
      'trincomalee',
      SWS_BUSINESS.name,
      {
        ...SWS_BUSINESS.trincomalee,
        region: 'Eastern Province',
      },
      [
        { '@type': 'City', name: 'Trincomalee' },
        { '@type': 'Place', name: 'Nilaveli' },
        { '@type': 'Place', name: 'Uppuveli' },
        { '@type': 'Place', name: 'Kanniya' },
        { '@type': 'City', name: 'Kinniya' },
        { '@type': 'City', name: 'Mutur' },
        { '@type': 'City', name: 'Kantale' },
      ],
      'Trincomalee Event Planning & Decoration Services',
      [
        {
          name: 'Wedding Decoration & Planning',
          description: 'Custom wedding decorations, Manavarai and Poruwa bridal backdrops, floral setups and wedding planning in Trincomalee and Nilaveli.',
        },
        {
          name: 'Birthday Party Decoration',
          description: 'Custom birthday decorations with balloon arches, backdrops and lighting in Trincomalee.',
        },
        {
          name: 'Cultural & Traditional Ceremony Decor',
          description: 'Stage and home decorations for puberty ceremonies, cradle ceremonies, baby showers, engagements and Mehendi functions.',
        },
        {
          name: 'Event Photography & Rentals',
          description: 'Event photography and rentals including marquees, chairs, tables and buffet setups in Trincomalee.',
        },
      ],
    ),
    makeBranch(
      'colombo',
      'SWS Event Management Colombo',
      {
        streetAddress: SWS_BUSINESS.colombo.streetAddress,
        locality: 'Colombo 13',
        region: 'Western Province',
        postalCode: SWS_BUSINESS.colombo.postalCode,
        latitude: SWS_BUSINESS.colombo.latitude,
        longitude: SWS_BUSINESS.colombo.longitude,
        mapsUrl: SWS_BUSINESS.colombo.mapsUrl,
      },
      [
        { '@type': 'City', name: 'Colombo' },
        { '@type': 'City', name: 'Dehiwala-Mount Lavinia' },
        { '@type': 'City', name: 'Sri Jayawardenepura Kotte' },
        { '@type': 'Place', name: 'Nugegoda' },
        { '@type': 'Place', name: 'Battaramulla' },
        { '@type': 'Place', name: 'Maharagama' },
        { '@type': 'Place', name: 'Malabe' },
        { '@type': 'Place', name: 'Wellawatte' },
      ],
      'Colombo Event Planning & Decoration Services',
      [
        {
          name: 'Wedding Decoration & Planning in Colombo',
          description: 'Wedding stage decorations, floral backdrops, engagement setups and wedding coordination across Greater Colombo.',
        },
        {
          name: 'Birthday Party Decoration in Colombo',
          description: 'Themed birthday party setups with balloon arches, backdrops and table styling in Colombo.',
        },
        {
          name: 'Corporate Event & Conference Styling',
          description: 'Stage design, backdrop setups and event coordination for corporate functions and conferences in Colombo.',
        },
        {
          name: 'Wedding & Event Photography',
          description: 'Event coverage, wedding photography and milestone celebration photography across Colombo.',
        },
      ],
    ),
  ];
}
