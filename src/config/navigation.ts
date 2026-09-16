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
    title: 'Company',
    links: [
      { label: 'About Mahdev', href: '/about' },
      { label: 'Our Divisions', href: '/#divisions' },
      { label: 'Projects & Portfolio', href: '/portfolio' },
      { label: 'Contact Us', href: '/contact' },
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
    title: 'Legal Provisions',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
  },
];
