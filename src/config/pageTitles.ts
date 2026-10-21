import { DIVISION_SEO } from './divisionSeo.js';
import { SITE_NAME } from './site.js';

/**
 * Browser-tab and search-result titles for the fixed pages, in the form
 * "Careers - Mahdev (Pvt) Ltd". Shared by the app (set on every route change, so
 * a page never keeps the previous page's title), SEOHead and the build-time
 * prerendered HTML, so the tab and Google always show the same title.
 */
export const formatPageTitle = (pageName: string) => `${pageName} - ${SITE_NAME}`;

const PAGE_NAMES: Record<string, string> = {
  '/about': 'About Us',
  '/contact': 'Contact Us',
  '/services': 'Services',
  '/gallery': 'Gallery',
  '/careers': 'Careers',
  '/testimonials': 'Client Reviews',
  '/milestones': 'Our Milestones',
  '/clients': 'Clients & Partners',
  '/portfolio': 'Portfolio',
  '/insights': 'Insights',
  '/catalog': 'Product Catalogue',
  '/book': 'Book a Service',
  '/promotions': 'Promotions',
  '/divisions': 'Our Divisions',
  '/privacy-policy': 'Privacy Policy',
  '/terms-and-conditions': 'Terms & Conditions',
  '/refund-policy': 'Refund Policy',
  '/shipping-policy': 'Shipping Policy',
  '/cookie-policy': 'Cookie Policy',
  '/login': 'Sign In',
  '/register': 'Create Account',
  '/forgot-password': 'Reset Password',
  '/checkout': 'Checkout',
  '/cart': 'Cart',
  '/account': 'My Account',
  '/bookings': 'My Bookings',
  '/orders': 'My Orders',
  '/order': 'Track Order',
  '/track-order': 'Track Order',
};

// Other URLs the app serves for the same pages.
const PAGE_ALIASES: Record<string, string> = {
  '/about-us': '/about',
  '/company': '/about',
  '/featured-services': '/services',
  '/media': '/gallery',
  '/projects': '/portfolio',
  '/work': '/portfolio',
  '/journey': '/milestones',
  '/reviews': '/testimonials',
  '/jobs': '/careers',
  '/partners': '/clients',
  '/companies': '/clients',
  '/promotion': '/promotions',
};

/**
 * Title for a fixed page or division page, or null for pages that set their own
 * (home, a single service, project, article or CMS page).
 */
export function getPageTitle(path: string): string | null {
  const normalized = `/${(path || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '').toLowerCase()}`;
  const route = PAGE_ALIASES[normalized] || normalized;
  const division = DIVISION_SEO[route.slice(1) as keyof typeof DIVISION_SEO];
  if (division) return division.title;
  if (route.startsWith('/services/category/')) return formatPageTitle('Services');
  if (route.startsWith('/account/')) return formatPageTitle('My Account');
  return PAGE_NAMES[route] ? formatPageTitle(PAGE_NAMES[route]) : null;
}
