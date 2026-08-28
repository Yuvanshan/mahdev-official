import { NavigationLink, FooterSection } from '../types';

export const MAIN_NAV_ITEMS: NavigationLink[] = [
  {
    id: 'divisions',
    label: 'Divisions & Services',
    href: '#divisions',
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
        label: 'U1 Studio',
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
        description: 'Bespoke holiday curation, corporate offsites, and luxury transport.',
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
    id: 'catalog',
    label: 'Master Catalog',
    href: '/catalog',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    href: '/portfolio',
  },
  {
    id: 'about',
    label: 'About Mahdev',
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
    title: 'Customer Hub',
    links: [
      { label: 'Customer Sign In', href: '/login' },
      { label: 'Account Dashboard', href: '/account' },
      { label: 'My Orders & Deliveries', href: '/account/orders' },
      { label: 'My Service Bookings', href: '/account/bookings' },
      { label: 'Invoices & Billing', href: '/account/invoices' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Mahdev', href: '/about' },
      { label: 'Corporate Leadership', href: '/about' },
      { label: 'Historical Milestones', href: '/about' },
      { label: 'Portfolio & Case Studies', href: '/portfolio' },
      { label: 'Corporate Inquiries', href: '/contact' },
      { label: 'Admin Portal', href: '/admin', badge: 'Secure' },
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
    title: 'Services & Store',
    links: [
      { label: 'Master Catalog & Pricing', href: '/catalog' },
      { label: 'Universal Service Booking', href: '/book' },
      { label: 'Shopping Cart', href: '/checkout' },
      { label: 'Track Order Status', href: '/orders' },
    ],
  },
  {
    title: 'Legal & Compliance',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
    ],
  },
];
