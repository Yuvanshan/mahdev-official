/**
 * Public route metadata shared by the build-time prerender step
 * (scripts/prerender-seo.ts) and the HTML route function (api /page-shell).
 *
 * Prerendered pages give crawlers the correct title, description, canonical
 * URL and a real <h1> in the initial HTML, instead of every route inheriting
 * the home page's head. The React app still takes over in the browser.
 */

import { CANONICAL_SITE_ORIGIN, SITE_NAME } from '../../src/config/site.js';
import { DIVISION_SEO } from '../../src/config/divisionSeo.js';
import { getPageTitle } from '../../src/config/pageTitles.js';
import { withServiceArea } from '../../src/config/itemSeo.js';
import { CAREERS_PAGE_SEO } from '../../src/config/careerSeo.js';
import { getSwsStructuredData, SWS_BUSINESS, SWS_PRIMARY_HEADING, SWS_SERVICE_AREA_SUMMARY, SWS_SERVICE_HIGHLIGHTS } from '../../src/data/swsLocalSeo.js';
import { U1_PRIMARY_HEADING, U1_SERVICE_AREA_SUMMARY, U1_SERVICE_HIGHLIGHTS } from '../../src/data/u1LocalSeo.js';

export const SITE_ORIGIN = CANONICAL_SITE_ORIGIN;

export interface RouteSeo {
  path: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  /** Section headings written as crawlable <h2>s under the <h1>. */
  subheadings?: readonly string[];
  /** 1200x630 share image (path) for Facebook/WhatsApp/X; defaults to the site image. */
  ogImage?: string;
  /** Extra JSON-LD blocks added to this page's prerendered <head>. */
  structuredData?: Array<Record<string, unknown>>;
}

// Same "Careers - Mahdev (Pvt) Ltd" title the app shows in the browser tab.
const titleFor = (path: string) => getPageTitle(path) ?? SITE_NAME;

/**
 * BreadcrumbList for a division page ("Mahdev (Pvt) Ltd > SWS Event Management"),
 * which Google can show in place of the bare URL path.
 */
function divisionBreadcrumb(key: keyof typeof DIVISION_SEO): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: DIVISION_SEO[key].name, item: `${SITE_ORIGIN}/${key}` },
    ],
  };
}

/**
 * The division as a service of the Mahdev organisation that serves Trincomalee and
 * Colombo, so local searches ("photography colombo") can match it. Branch addresses
 * live on the Organization in index.html and on SWS's own LocalBusiness listing.
 */
function divisionService(key: Exclude<keyof typeof DIVISION_SEO, 'sws'>, type: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: DIVISION_SEO[key].name,
    description: DIVISION_SEO[key].description,
    url: `${SITE_ORIGIN}/${key}`,
    parentOrganization: { '@id': `${SITE_ORIGIN}/#organization` },
    areaServed: [
      { '@type': 'City', name: 'Trincomalee' },
      { '@type': 'City', name: 'Colombo' },
      { '@type': 'Country', name: 'Sri Lanka' },
    ],
  };
}

// /gallery is not listed: the app renders it as the /services page and declares
// /services as its canonical URL, so a separate prerendered head would conflict.
const ROUTES: RouteSeo[] = [
  {
    path: '/divisions',
    title: titleFor('/divisions'),
    description: 'Explore the five Mahdev divisions in Sri Lanka: SWS Event Management, U1 Studio, Mahdev IT Solutions, Mahdev Travels and Mahdev Online Mart.',
    heading: 'Mahdev divisions',
    intro: 'Mahdev brings together event management, photography and cinema, technology, travel and online retail under one Sri Lankan group.',
  },
  {
    path: '/sws',
    ogImage: '/assets/og/og-sws.jpg',
    title: DIVISION_SEO.sws.title,
    description: DIVISION_SEO.sws.description,
    heading: SWS_PRIMARY_HEADING,
    subheadings: SWS_SERVICE_HIGHLIGHTS.map((service) => service.heading),
    intro: `${SWS_SERVICE_AREA_SUMMARY} ${SWS_BUSINESS.displayName}. Trincomalee: ${SWS_BUSINESS.trincomalee.full}. Colombo: ${SWS_BUSINESS.colombo.full}. Hotline / WhatsApp: ${SWS_BUSINESS.phoneDisplay}.`,
    structuredData: [...getSwsStructuredData(), divisionBreadcrumb('sws')],
  },
  {
    path: '/u1',
    ogImage: '/assets/og/og-u1.jpg',
    title: DIVISION_SEO.u1.title,
    description: DIVISION_SEO.u1.description,
    heading: U1_PRIMARY_HEADING,
    subheadings: U1_SERVICE_HIGHLIGHTS.map((service) => service.heading),
    intro: U1_SERVICE_AREA_SUMMARY,
    structuredData: [divisionService('u1', 'ProfessionalService'), divisionBreadcrumb('u1')],
  },
  {
    path: '/it',
    title: DIVISION_SEO.it.title,
    description: DIVISION_SEO.it.description,
    heading: 'Mahdev IT Solutions',
    intro: 'Enterprise software, cloud and AI engineered for scale, with ongoing support and maintenance.',
    structuredData: [divisionService('it', 'ProfessionalService'), divisionBreadcrumb('it')],
  },
  {
    path: '/travels',
    title: DIVISION_SEO.travels.title,
    description: DIVISION_SEO.travels.description,
    heading: 'Mahdev Travels',
    intro: 'Bespoke journeys across Sri Lanka, from tea country to wildlife safaris and coastal escapes.',
    structuredData: [divisionService('travels', 'TravelAgency'), divisionBreadcrumb('travels')],
  },
  {
    path: '/mart',
    title: DIVISION_SEO.mart.title,
    description: DIVISION_SEO.mart.description,
    heading: 'Mahdev Online Mart',
    intro: 'Curated event and home decor, ambient lighting and smart tech, delivered across Sri Lanka.',
    structuredData: [divisionService('mart', 'OnlineStore'), divisionBreadcrumb('mart')],
  },
  {
    path: '/services',
    title: titleFor('/services'),
    description: 'Browse Mahdev services, event and studio gallery projects, and products in one place: events, photography, IT, travel and production equipment.',
    heading: 'Explore services, gallery and products',
    intro: 'Search Mahdev services, gallery projects and products across every division in one place.',
  },
  {
    path: '/insights',
    title: titleFor('/insights'),
    description: "Practical insights, project learnings and guidance from Mahdev's event, media, technology, travel and production teams in Sri Lanka.",
    heading: 'Insights',
    intro: 'Learnings and guidance from the Mahdev teams.',
  },
  {
    path: '/catalog',
    title: titleFor('/catalog'),
    description: 'Browse the Mahdev Mart product catalogue: event and home decor, foil balloons, gifts and more, with island-wide delivery in Sri Lanka. Order easily on WhatsApp.',
    heading: 'Mahdev Mart product catalogue',
    intro: 'Search Mahdev Mart products by name or category and order directly on WhatsApp with island-wide delivery.',
  },
  {
    path: '/book',
    title: titleFor('/book'),
    description: 'Book Mahdev event, studio, IT and travel services online in a few simple steps.',
    heading: 'Book a service',
    intro: 'Choose a service and request a booking with the Mahdev team.',
  },
  {
    path: '/about',
    title: titleFor('/about'),
    description: 'Learn about Mahdev (Pvt) Ltd, our vision, mission, business divisions, journey and services across Sri Lanka.',
    heading: 'About Mahdev',
    intro: 'Creating moments, capturing memories and delivering innovation across Sri Lanka since 2022.',
  },
  {
    path: '/portfolio',
    title: titleFor('/portfolio'),
    description: 'Explore Mahdev projects and case studies across events, studio production, technology and travel.',
    heading: 'Portfolio',
    intro: 'Selected projects and case studies from across the Mahdev group.',
  },
  {
    path: '/milestones',
    title: titleFor('/milestones'),
    description: 'Explore the Mahdev journey from its 2022 foundation to island-wide expansion and hundreds of delivered projects.',
    heading: 'Our milestones',
    intro: 'Key moments in the growth of Mahdev (Pvt) Ltd.',
  },
  {
    path: '/testimonials',
    title: titleFor('/testimonials'),
    description: 'Read verified Google reviews and client feedback for Mahdev across our Trincomalee and Colombo branches.',
    heading: 'Client reviews',
    intro: 'What our clients say about working with Mahdev.',
  },
  {
    path: '/careers',
    title: titleFor('/careers'),
    description: CAREERS_PAGE_SEO.description,
    heading: CAREERS_PAGE_SEO.heading,
    intro: CAREERS_PAGE_SEO.intro,
    subheadings: ['Open positions in Trincomalee and Colombo', 'Apply online with your CV', 'Check your application status'],
    // Each published opening's JobPosting is added in the browser (src/views/CareersView.tsx).
    structuredData: [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Careers', item: `${SITE_ORIGIN}/careers` },
      ],
    }],
  },
  {
    path: '/clients',
    title: titleFor('/clients'),
    description: 'Discover the enterprises, brands and institutions that trust Mahdev for events, cinematography, technology, travel and equipment.',
    heading: 'Partners and clients',
    intro: 'Organisations that work with the Mahdev group.',
  },
  {
    path: '/contact',
    title: titleFor('/contact'),
    description: 'Contact the Mahdev team for events, photography, IT solutions, travel and equipment enquiries. Call, WhatsApp or send a message.',
    heading: 'Contact Mahdev',
    intro: 'Send an enquiry to the Mahdev team and we will get back to you.',
  },
  {
    path: '/promotions',
    title: titleFor('/promotions'),
    description: 'Current promotions and special offers across Mahdev events, studio, IT, travel and online mart.',
    heading: 'Promotions',
    intro: 'Current offers from across the Mahdev group.',
  },
  {
    path: '/privacy-policy',
    title: titleFor('/privacy-policy'),
    description: 'How Mahdev (Pvt) Ltd collects, uses and protects your personal information.',
    heading: 'Privacy policy',
    intro: 'How we handle and protect your personal information.',
  },
  {
    path: '/terms-and-conditions',
    title: titleFor('/terms-and-conditions'),
    description: 'Terms and conditions for using Mahdev (Pvt) Ltd websites, services and online purchases.',
    heading: 'Terms and conditions',
    intro: 'The terms that apply to our websites and services.',
  },
  {
    path: '/refund-policy',
    title: titleFor('/refund-policy'),
    description: 'Refund and cancellation policy for Mahdev (Pvt) Ltd services and products.',
    heading: 'Refund and cancellation policy',
    intro: 'How refunds and cancellations work.',
  },
  {
    path: '/shipping-policy',
    title: titleFor('/shipping-policy'),
    description: 'Delivery and shipping policy for Mahdev Online Mart orders across Sri Lanka.',
    heading: 'Shipping and delivery policy',
    intro: 'How and when we deliver your orders.',
  },
  {
    path: '/cookie-policy',
    title: titleFor('/cookie-policy'),
    description: 'How Mahdev (Pvt) Ltd uses cookies and similar technologies on its websites.',
    heading: 'Cookie policy',
    intro: 'How we use cookies on our websites.',
  },
];

// Every description names the Trincomalee and Colombo branches (src/config/itemSeo.ts),
// matching what SEOHead sets once the app runs.
export const PRERENDERED_ROUTES: RouteSeo[] = ROUTES.map((route) => ({
  ...route,
  description: withServiceArea(route.description),
}));

/**
 * First path segments the React app routes itself. A URL whose first segment
 * is not listed here, and is not a published CMS page slug, is a 404.
 * Kept deliberately broad so no valid page is ever answered with a 404.
 */
export const APP_ROUTE_SEGMENTS = new Set([
  '', 'about', 'about-us', 'account', 'admin-yuvan1709', 'articles', 'auth', 'blog', 'book', 'bookings', 'careers', 'cart',
  'catalog', 'checkout', 'cinema', 'clients', 'companies', 'company', 'confirm-order', 'contact', 'cookie-policy', 'decor',
  'decorations', 'division', 'divisions', 'event-management', 'events', 'events-management', 'featured-services',
  'forgot-password', 'gallery', 'insights', 'it', 'it-services', 'it-solutions', 'jobs', 'journey', 'login',
  'mahdev-it', 'mahdev-mart', 'mahdev-travels', 'mart', 'media', 'milestones', 'online-mart', 'order', 'orders',
  'partners', 'photography', 'portfolio', 'post', 'posts', 'privacy-policy', 'product', 'products', 'project',
  'projects', 'promotion', 'promotions', 'refund-policy', 'register', 'reviews', 'service', 'services',
  'shipping-policy', 'shop', 'software', 'solutions', 'store', 'studio', 'sws', 'sws-event', 'sws-event-management',
  'sws-events', 'terms-and-conditions', 'testimonials', 'tourism', 'tours', 'track-order', 'travel', 'travels',
  'u1', 'u1-cinema', 'u1-studio', 'work',
]);

/**
 * Signed-in, checkout and one-time-link pages: served normally but marked noindex in
 * the HTML itself, so crawlers that do not run JavaScript keep them out of results too.
 */
export const PRIVATE_ROUTE_SEGMENTS = new Set([
  'account', 'admin-yuvan1709', 'auth', 'bookings', 'cart', 'checkout', 'confirm-order', 'forgot-password', 'login', 'order', 'orders',
  'register', 'track-order',
]);

/** Retired admin entry points: always a 404, never a redirect. */
export const RETIRED_ADMIN_SEGMENTS = new Set(['admin', 'admin-login', 'adminlogin', 'adminportal', 'admin-portal']);
