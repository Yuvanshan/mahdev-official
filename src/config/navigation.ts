import { NavigationLink, FooterSection } from '../types';

export const MAIN_NAV_ITEMS: NavigationLink[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
  },
  {
    id: 'divisions',
    label: 'Divisions',
    href: '/divisions',
    children: [
      {
        id: 'sws',
        label: 'SWS Event Management',
        href: '/sws',
        description: 'Audio-visual production, luxury galas, and concert staging.',
        badge: 'Events',
        iconName: 'Sparkles',
      },
      {
        id: 'u1',
        label: 'Studio U2 Photography',
        href: '/u1',
        description: 'Cinematography, editorial photography, and aerial filming.',
        badge: 'Media',
        iconName: 'Camera',
      },
      {
        id: 'it',
        label: 'IT & Solutions',
        href: '/it',
        description: 'Enterprise software, cloud systems, and mobile applications.',
        badge: 'Technology',
        iconName: 'Cpu',
      },
      {
        id: 'travels',
        label: 'Mahdev Travels',
        href: '/travels',
        description: 'Bespoke holiday curation, executive retreats, and luxury transport.',
        badge: 'Travel',
        iconName: 'Plane',
      },
      {
        id: 'mart',
        label: 'Mahdev Online Mart',
        href: '/mart',
        description: 'Curated e-commerce, professional tech gear, and lifestyle products.',
        badge: 'Commerce',
        iconName: 'ShoppingBag',
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    href: '/projects',
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
  },
  {
    id: 'contact',
    label: 'Contact',
    href: '/contact',
  },
];

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Customer Portal',
    links: [
      { label: 'Customer Sign In', href: '/login' },
      { label: 'Create Account', href: '/register' },
      { label: 'Account Hub', href: '/account' },
      { label: 'My Orders & Deliveries', href: '/account/orders' },
      { label: 'My Service Bookings', href: '/account/bookings' },
      { label: 'Payment Transactions', href: '/account/payments' },
      { label: 'Commercial Tax Invoices', href: '/account/invoices' },
      { label: 'Profile & Preferences', href: '/account/profile' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Mahdev', href: '/about' },
      { label: 'Executive Leadership', href: '/about#leadership' },
      { label: 'Our Milestones', href: '/#milestones' },
      { label: 'Portfolio & Case Studies', href: '/portfolio' },
      { label: 'Partner Companies', href: '/#companies' },
      { label: 'Careers & Culture', href: '/contact', badge: 'Hiring' },
      { label: 'Administrative Console', href: '/admin', badge: 'Secure' },
    ],
  },
  {
    title: 'Divisions',
    links: [
      { label: 'SWS Event Management', href: '/sws' },
      { label: 'U1 Studio Media', href: '/u1' },
      { label: 'Mahdev IT & Solutions', href: '/it' },
      { label: 'Mahdev Travels', href: '/travels' },
      { label: 'Mahdev Online Mart', href: '/mart' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Universal Booking & Reservations', href: '/book' },
      { label: 'Master Enterprise Catalog', href: '/catalog' },
      { label: 'Cart & Checkout', href: '/checkout' },
      { label: 'Track Order & Status', href: '/orders' },
      { label: 'Security & Compliance', href: '/privacy-policy' },
    ],
  },
  {
    title: 'Legal & Policies',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
];
