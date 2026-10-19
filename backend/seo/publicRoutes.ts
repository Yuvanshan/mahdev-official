/**
 * Public route metadata shared by the build-time prerender step
 * (scripts/prerender-seo.ts) and the HTML route function (api /page-shell).
 *
 * Prerendered pages give crawlers the correct title, description, canonical
 * URL and a real <h1> in the initial HTML, instead of every route inheriting
 * the home page's head. The React app still takes over in the browser.
 */

import { getSwsStructuredData, SWS_BUSINESS, SWS_PRIMARY_HEADING } from '../../src/data/swsLocalSeo.js';

export const SITE_ORIGIN = 'https://mahdev-official.vercel.app';

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Extra JSON-LD blocks added to this page's prerendered <head>. */
  structuredData?: Array<Record<string, unknown>>;
}

// /gallery is not listed: the app renders it as the /services page and declares
// /services as its canonical URL, so a separate prerendered head would conflict.
export const PRERENDERED_ROUTES: RouteSeo[] = [
  {
    path: '/divisions',
    title: 'Mahdev Divisions | Events, Studio, IT, Travel & Mart',
    description: 'Explore the five Mahdev divisions in Sri Lanka: SWS Event Management, U1 Studio, Mahdev IT Solutions, Mahdev Travels and Mahdev Online Mart.',
    heading: 'Mahdev divisions',
    intro: 'Mahdev brings together event management, photography and cinema, technology, travel and online retail under one Sri Lankan group.',
  },
  {
    path: '/sws',
    title: 'SWS Event Management | Wedding & Party Decorators in Trincomalee & Colombo',
    description: 'SWS Event Management: luxury wedding, Manavarai and Poruwa decoration, birthday party styling, Manjal Neerattu Vizha ceremonies, photography and catering in Trincomalee and Colombo. Call or WhatsApp 075 092 8078.',
    heading: SWS_PRIMARY_HEADING,
    intro: `${SWS_BUSINESS.displayName}. Trincomalee: ${SWS_BUSINESS.trincomalee.full}. Colombo: ${SWS_BUSINESS.colombo.full}. Hotline / WhatsApp: ${SWS_BUSINESS.phoneDisplay}.`,
    structuredData: getSwsStructuredData(),
  },
  {
    path: '/u1',
    title: 'U1 Studio | Photography, 4K Cinema & Creative Studio',
    description: 'U1 Studio by Mahdev: editorial photography, 4K wedding films, fashion portraits, product imaging and heirloom albums in Sri Lanka.',
    heading: 'U1 Studio',
    intro: 'Every frame tells a story. U1 Studio delivers photography and cinema for weddings, brands and events.',
  },
  {
    path: '/it',
    title: 'Mahdev IT Solutions | Software, Cloud & AI Engineering',
    description: 'Web and mobile applications, custom ERP and POS systems, cloud infrastructure and AI solutions by Mahdev IT Solutions in Sri Lanka.',
    heading: 'Mahdev IT Solutions',
    intro: 'Enterprise software, cloud and AI engineered for scale, with ongoing support and maintenance.',
  },
  {
    path: '/travels',
    title: 'Mahdev Travels | Private Tours & Holidays in Sri Lanka',
    description: 'Private tours, rail journeys, wildlife safaris, airport transfers and tailored holiday itineraries across Sri Lanka by Mahdev Travels.',
    heading: 'Mahdev Travels',
    intro: 'Bespoke journeys across Sri Lanka, from tea country to wildlife safaris and coastal escapes.',
  },
  {
    path: '/mart',
    title: 'Mahdev Online Mart | Event & Home Decor, Lighting & Tech',
    description: 'Shop event and home decor, ambient lighting, smart electronics and creator tech from Mahdev Online Mart, with island-wide delivery in Sri Lanka.',
    heading: 'Mahdev Online Mart',
    intro: 'Curated event and home decor, ambient lighting and smart tech, delivered across Sri Lanka.',
  },
  {
    path: '/services',
    title: 'Explore Services, Gallery & Products | Mahdev Sri Lanka',
    description: 'Browse Mahdev services, event and studio gallery projects, and products in one place: events, photography, IT, travel and production equipment.',
    heading: 'Explore services, gallery and products',
    intro: 'Search Mahdev services, gallery projects and products across every division in one place.',
  },
  {
    path: '/insights',
    title: 'Insights | Mahdev',
    description: "Practical insights, project learnings and guidance from Mahdev's event, media, technology, travel and production teams in Sri Lanka.",
    heading: 'Insights',
    intro: 'Learnings and guidance from the Mahdev teams.',
  },
  {
    path: '/catalog',
    title: 'Mahdev Mart Product Catalogue | Event Decor, Gifts & More in Sri Lanka',
    description: 'Browse the Mahdev Mart product catalogue: event and home decor, foil balloons, gifts and more, with island-wide delivery in Sri Lanka. Order easily on WhatsApp.',
    heading: 'Mahdev Mart product catalogue',
    intro: 'Search Mahdev Mart products by name or category and order directly on WhatsApp with island-wide delivery.',
  },
  {
    path: '/book',
    title: 'Book a Service | Mahdev Sri Lanka',
    description: 'Book Mahdev event, studio, IT and travel services online in a few simple steps.',
    heading: 'Book a service',
    intro: 'Choose a service and request a booking with the Mahdev team.',
  },
  {
    path: '/about',
    title: 'About Mahdev (Pvt) Ltd | Our Story, Vision & Divisions',
    description: 'Learn about Mahdev (Pvt) Ltd, our vision, mission, business divisions, journey and services across Sri Lanka.',
    heading: 'About Mahdev',
    intro: 'Creating moments, capturing memories and delivering innovation across Sri Lanka since 2022.',
  },
  {
    path: '/portfolio',
    title: 'Portfolio & Case Studies | Mahdev Sri Lanka',
    description: 'Explore Mahdev projects and case studies across events, studio production, technology and travel.',
    heading: 'Portfolio',
    intro: 'Selected projects and case studies from across the Mahdev group.',
  },
  {
    path: '/milestones',
    title: 'Our Milestones & Achievements | Mahdev (Pvt) Ltd',
    description: 'Explore the Mahdev journey from its 2022 foundation to island-wide expansion and hundreds of delivered projects.',
    heading: 'Our milestones',
    intro: 'Key moments in the growth of Mahdev (Pvt) Ltd.',
  },
  {
    path: '/testimonials',
    title: 'Client Reviews & Testimonials | Mahdev (Pvt) Ltd',
    description: 'Read verified Google reviews and client feedback for Mahdev across our Trincomalee and Colombo branches.',
    heading: 'Client reviews',
    intro: 'What our clients say about working with Mahdev.',
  },
  {
    path: '/careers',
    title: 'Careers | Join the Mahdev Team',
    description: 'Explore current career opportunities at Mahdev and apply securely with your CV.',
    heading: 'Careers at Mahdev',
    intro: 'Join our event, studio, technology and travel teams.',
  },
  {
    path: '/clients',
    title: 'Partners & Clients | Mahdev (Pvt) Ltd',
    description: 'Discover the enterprises, brands and institutions that trust Mahdev for events, cinematography, technology, travel and equipment.',
    heading: 'Partners and clients',
    intro: 'Organisations that work with the Mahdev group.',
  },
  {
    path: '/contact',
    title: 'Contact Mahdev | Trincomalee & Colombo, Sri Lanka',
    description: 'Contact the Mahdev team for events, photography, IT solutions, travel and equipment enquiries. Call, WhatsApp or send a message.',
    heading: 'Contact Mahdev',
    intro: 'Send an enquiry to the Mahdev team and we will get back to you.',
  },
  {
    path: '/promotions',
    title: 'Promotions & Offers | Mahdev Sri Lanka',
    description: 'Current promotions and special offers across Mahdev events, studio, IT, travel and online mart.',
    heading: 'Promotions',
    intro: 'Current offers from across the Mahdev group.',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Mahdev (Pvt) Ltd',
    description: 'How Mahdev (Pvt) Ltd collects, uses and protects your personal information.',
    heading: 'Privacy policy',
    intro: 'How we handle and protect your personal information.',
  },
  {
    path: '/terms-and-conditions',
    title: 'Terms & Conditions | Mahdev (Pvt) Ltd',
    description: 'Terms and conditions for using Mahdev (Pvt) Ltd websites, services and online purchases.',
    heading: 'Terms and conditions',
    intro: 'The terms that apply to our websites and services.',
  },
  {
    path: '/refund-policy',
    title: 'Refund Policy | Mahdev (Pvt) Ltd',
    description: 'Refund and cancellation policy for Mahdev (Pvt) Ltd services and products.',
    heading: 'Refund policy',
    intro: 'How refunds and cancellations work.',
  },
  {
    path: '/shipping-policy',
    title: 'Shipping Policy | Mahdev (Pvt) Ltd',
    description: 'Delivery and shipping policy for Mahdev Online Mart orders across Sri Lanka.',
    heading: 'Shipping policy',
    intro: 'How and when we deliver your orders.',
  },
  {
    path: '/cookie-policy',
    title: 'Cookie Policy | Mahdev (Pvt) Ltd',
    description: 'How Mahdev (Pvt) Ltd uses cookies and similar technologies on its websites.',
    heading: 'Cookie policy',
    intro: 'How we use cookies on our websites.',
  },
];

/**
 * First path segments the React app routes itself. A URL whose first segment
 * is not listed here, and is not a published CMS page slug, is a 404.
 * Kept deliberately broad so no valid page is ever answered with a 404.
 */
export const APP_ROUTE_SEGMENTS = new Set([
  '', 'about', 'about-us', 'account', 'admin-yuvan1709', 'articles', 'blog', 'book', 'bookings', 'careers', 'cart',
  'catalog', 'checkout', 'cinema', 'clients', 'companies', 'company', 'contact', 'cookie-policy', 'decor',
  'decorations', 'division', 'divisions', 'event-management', 'events', 'events-management', 'featured-services',
  'forgot-password', 'gallery', 'insights', 'it', 'it-services', 'it-solutions', 'jobs', 'journey', 'login',
  'mahdev-it', 'mahdev-mart', 'mahdev-travels', 'mart', 'media', 'milestones', 'online-mart', 'order', 'orders',
  'partners', 'photography', 'portfolio', 'post', 'posts', 'privacy-policy', 'product', 'products', 'project',
  'projects', 'promotion', 'promotions', 'refund-policy', 'register', 'reviews', 'service', 'services',
  'shipping-policy', 'shop', 'software', 'solutions', 'store', 'studio', 'sws', 'sws-event', 'sws-event-management',
  'sws-events', 'terms-and-conditions', 'testimonials', 'tourism', 'tours', 'track-order', 'travel', 'travels',
  'u1', 'u1-cinema', 'u1-studio', 'work',
]);

/** Retired admin entry points: always a 404, never a redirect. */
export const RETIRED_ADMIN_SEGMENTS = new Set(['admin', 'admin-login', 'adminlogin', 'adminportal', 'admin-portal']);
