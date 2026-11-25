/**
 * Service-and-city landing pages under /sws, one per search people actually make.
 * Shared by the SWS view, the build-time prerender (backend/seo/publicRoutes.ts)
 * and the sitemap. Text uses only facts already published on the site (services,
 * areas, phone, offices). No prices are stated: add a "from" price here once the
 * real starting prices are confirmed.
 */
export interface SwsLandingPage {
  slug: string;
  title: string;
  description: string;
  heading: string;
  paragraphs: readonly string[];
}

const QUOTE =
  'The price depends on the venue, the design and the size of the event, so message us on WhatsApp on 075 092 8078 with your date and venue for a free quote.';

export const SWS_LANDING_PAGES: readonly SwsLandingPage[] = [
  {
    slug: 'wedding-decoration-trincomalee',
    title: 'Wedding Decoration in Trincomalee | SWS Event Management',
    description: 'Manavarai, Poruwa, floral stage and hall wedding decoration in Trincomalee by SWS Event Management. Call 075 092 8078 for a free quote.',
    heading: 'Wedding Decoration in Trincomalee',
    paragraphs: [
      'SWS Event Management decorates weddings across Trincomalee, from Manavarai and Poruwa stages to floral backdrops, entrance arches and reception table settings. Our team is based at Iluppaikkulam, Kanniya Road, so we know the local halls, hotels and homes well.',
      'Tell us your theme, colours and guest numbers and we design the stage, seating and lighting to match. We can also arrange chairs, tables, sound and photography with our U1 Studio team, so one team looks after the whole day.',
      `Book early for weekend and festival dates, because they fill quickly. ${QUOTE}`,
    ],
  },
  {
    slug: 'wedding-decoration-colombo',
    title: 'Wedding Decorators in Colombo | SWS Event Management',
    description: 'Wedding decorators in Colombo for stage, floral, Poruwa and hall decoration. SWS Event Management, Kotahena. Call 075 092 8078 for a quote.',
    heading: 'Wedding Decorators in Colombo',
    paragraphs: [
      'Our Colombo office at Pickerings Road, Kotahena, serves weddings and engagements across Colombo and nearby areas. We style stages, floral entrances, Poruwa setups, head tables and reception halls to your theme.',
      'Whether it is a hotel ballroom, a banquet hall or a family venue, we visit or review the space, agree the design with you and set up before your guests arrive. Lighting, seating and rentals can be added to the same booking.',
      `Send us your date, venue and ideas to begin. ${QUOTE}`,
    ],
  },
  {
    slug: 'beach-wedding-decoration-nilaveli',
    title: 'Beach Wedding Decoration in Nilaveli | SWS Event Management',
    description: 'Beach wedding decoration in Nilaveli and Uppuveli: arches, aisles, seating and lighting by SWS Event Management. Call 075 092 8078.',
    heading: 'Beach Wedding Decoration in Nilaveli',
    paragraphs: [
      'Nilaveli and Uppuveli beaches are popular for sunset ceremonies. SWS Event Management builds beach wedding setups with floral arches, aisle styling, guest seating, lanterns and lighting that suit sand, sea breeze and evening light.',
      'We plan around tide times, wind and sunset so the set looks right on the day. Our Trincomalee team travels the short distance to Nilaveli and Uppuveli, and can also arrange the reception décor at a nearby hotel or hall.',
      `Contact us early to plan the date and the permissions your venue needs. ${QUOTE}`,
    ],
  },
  {
    slug: 'birthday-decoration-trincomalee',
    title: 'Birthday Decoration in Trincomalee | SWS Event Management',
    description: 'Birthday decoration in Trincomalee: balloon backdrops, cake tables and themed party styling. SWS Event Management. Call 075 092 8078.',
    heading: 'Birthday Decoration in Trincomalee',
    paragraphs: [
      'From first birthdays and kids’ theme parties to milestone and surprise celebrations, SWS Event Management styles birthdays at homes, halls and hotels in Trincomalee. We provide balloon decoration, backdrops, cake tables and venue styling.',
      'Choose a character or colour theme and we build the set around it, including photo corners and table settings. For bigger parties we can add seating, sound and photography.',
      `Tell us the age, theme and venue to get started. ${QUOTE}`,
    ],
  },
  {
    slug: 'puberty-ceremony-decoration',
    title: 'Puberty Ceremony Decoration | SWS Event Management',
    description: 'Traditional puberty ceremony (Manjal Neerattu Vizha) stage and floral decoration in Trincomalee and Colombo. Call 075 092 8078.',
    heading: 'Puberty Ceremony Decoration in Trincomalee & Colombo',
    paragraphs: [
      'A puberty ceremony, also called Manjal Neerattu Vizha, is a family celebration, and SWS Event Management decorates it with traditional stage styling, floral backdrops, seating and lighting in Trincomalee and Colombo.',
      'We follow your family’s customs, so tell us about the colours, the ritual layout and the number of guests. We set up the stage and seating at your home or hall and can add Ponnurukku decoration if you need it.',
      `Contact us a few weeks ahead where possible so we can plan with you. ${QUOTE}`,
    ],
  },
  {
    slug: 'cradle-ceremony-decoration',
    title: 'Cradle Ceremony Decoration | SWS Event Management',
    description: 'Cradle and naming ceremony decoration in Trincomalee, Colombo and across Sri Lanka: cradles, backdrops and seating. Call 075 092 8078.',
    heading: 'Cradle Ceremony Decoration in Sri Lanka',
    paragraphs: [
      'Cradle and naming ceremonies are a baby’s first big family event. SWS Event Management decorates the cradle and the space around it with floral and fabric backdrops, stage styling and seating, in Trincomalee, Colombo and across Sri Lanka.',
      'Share your colour choices and the venue, whether a home, a temple hall or a function room, and we plan a calm, traditional setup that is easy for the family to enjoy.',
      `Message us with the ceremony date to check availability. ${QUOTE}`,
    ],
  },
  {
    slug: 'corporate-event-planner-colombo',
    title: 'Corporate Event Planner in Colombo | SWS Event Management',
    description: 'Corporate event planner in Colombo: product launches, AGMs, award nights and conferences, with stage, branding and rentals. Call 075 092 8078.',
    heading: 'Corporate Event Planner in Colombo',
    paragraphs: [
      'SWS Event Management plans and decorates corporate events in Colombo and Trincomalee: product launches, annual general meetings, award nights, conferences and school or institutional functions. We provide branded stage builds, digital backdrops, registration desks, seating and VIP lounges.',
      'We can supply chairs, tables, sound, lighting and LED wall rentals, plus photography and videography with our U1 Studio team, so your event runs with one point of contact.',
      `Send us your event type, date, venue and expected guests to begin. ${QUOTE}`,
    ],
  },
] as const;

export const getSwsLandingPage = (slug: string): SwsLandingPage | undefined =>
  SWS_LANDING_PAGES.find((page) => page.slug === slug);
