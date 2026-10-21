import { SITE_NAME } from './site.js';

/**
 * Search titles and descriptions for the division pages, shared by the
 * build-time prerendered HTML (backend/seo/publicRoutes.ts) and the React views,
 * so Google sees the same title before and after JavaScript runs.
 *
 * Format: "<Division> – <what it does> | Mahdev (Pvt) Ltd". The division name
 * comes first and the whole title stays within ~60 characters, the point where
 * Google truncates titles with "...". Divisions whose name already says Mahdev
 * skip the suffix to avoid repeating it.
 */
export interface DivisionSeo {
  /** Division name as shown in breadcrumbs. */
  name: string;
  title: string;
  description: string;
}

export const DIVISION_SEO = {
  sws: {
    name: 'SWS Event Management',
    title: `SWS Event Management – Wedding Decorators | ${SITE_NAME}`,
    description:
      'SWS Event Management: luxury wedding, Manavarai and Poruwa decoration, birthday party styling, Manjal Neerattu Vizha ceremonies, photography and catering in Trincomalee and Colombo. Call or WhatsApp 075 092 8078.',
  },
  u1: {
    name: 'U1 Studio',
    title: `U1 Studio – Photography & 4K Cinema | ${SITE_NAME}`,
    description:
      'U1 Studio by Mahdev: editorial photography, 4K wedding films, fashion portraits, product imaging and heirloom albums in Sri Lanka.',
  },
  it: {
    name: 'Mahdev IT Solutions',
    title: 'Mahdev IT Solutions – Software, Cloud & AI Engineering',
    description:
      'Web and mobile applications, custom ERP and POS systems, cloud infrastructure and AI solutions by Mahdev IT Solutions in Sri Lanka.',
  },
  travels: {
    name: 'Mahdev Travels',
    title: 'Mahdev Travels – Private Tours & Holidays in Sri Lanka',
    description:
      'Private tours, rail journeys, wildlife safaris, airport transfers and tailored holiday itineraries across Sri Lanka by Mahdev Travels.',
  },
  mart: {
    name: 'Mahdev Online Mart',
    title: 'Mahdev Online Mart – Event & Home Decor, Lighting & Tech',
    description:
      'Shop event and home decor, ambient lighting, smart electronics and creator tech from Mahdev Online Mart, with island-wide delivery in Sri Lanka.',
  },
} satisfies Record<'sws' | 'u1' | 'it' | 'travels' | 'mart', DivisionSeo>;
