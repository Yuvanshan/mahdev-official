/**
 * Search titles and descriptions for the division pages, shared by the
 * build-time prerendered HTML (backend/seo/publicRoutes.ts) and the React views,
 * so Google sees the same title before and after JavaScript runs.
 *
 * Titles lead with the division name and its primary service/location intent;
 * descriptions cover the broader service area and contact details.
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
    title: 'SWS Event Management | Event Planner in Trincomalee',
    description:
      'SWS Events (SWS Event Management) is an event planner in Trincomalee, Sri Lanka, for weddings, birthdays, cultural ceremonies and corporate events. Serving Trincomalee, Colombo and nearby areas. Call or WhatsApp 075 092 8078.',
  },
  u1: {
    name: 'U1 Studio',
    title: 'U1 Studio – Wedding Photographers Trincomalee & Colombo',
    description:
      'Wedding photography and 4K wedding films, pre-shoots, birthday and event photography, portraits, product photography and albums by U1 Studio in Trincomalee and Colombo, Sri Lanka.',
  },
  it: {
    name: 'Mahdev IT Solutions',
    title: 'Mahdev IT Solutions – Software & Web, Trincomalee & Colombo',
    description:
      'Websites, web and mobile apps, custom ERP and POS systems, cloud and AI solutions by Mahdev IT Solutions in Trincomalee and Colombo, Sri Lanka.',
  },
  travels: {
    name: 'Mahdev Travels',
    title: 'Mahdev Travels – Sri Lanka Tours from Trincomalee & Colombo',
    description:
      'Private tours, rail journeys, wildlife safaris, airport transfers and tailored holidays across Sri Lanka by Mahdev Travels, from Trincomalee and Colombo.',
  },
  mart: {
    name: 'Mahdev Online Mart',
    title: 'Mahdev Online Mart – Event & Home Decor, Trincomalee & Colombo',
    description:
      'Shop event and home decor, lighting, smart electronics and creator tech from Mahdev Online Mart in Trincomalee and Colombo, with island-wide delivery in Sri Lanka.',
  },
} satisfies Record<'sws' | 'u1' | 'it' | 'travels' | 'mart', DivisionSeo>;
