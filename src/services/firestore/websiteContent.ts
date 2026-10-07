import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from '../../lib/tursoFirestore';
import { db } from '../../lib/firebase';
import {
  AboutUsContent,
  LegalDocument,
  LegalSection,
} from '../../types/websiteContent';

const WEBSITE_CONTENT_COLLECTION = 'websiteContent';
const LEGAL_PAGES_COLLECTION = 'legalPages';

export const DEFAULT_ABOUT_US_CONTENT: AboutUsContent = {
  id: 'aboutUs',
  hero: {
    title: 'About MAHDEV Pvt Ltd',
    subtitle: 'Creating Moments. Capturing Memories. Delivering Innovation',
    description:
      'MAHDEV Pvt Ltd is a Sri Lankan company bringing creativity, technology, travel, and everyday solutions together through a growing range of business divisions.',
    buttonText: 'Explore Our Services',
    buttonRoute: '/services',
  },
  companyIntro: {
    heading: 'Who We Are',
    description:
      'MAHDEV Pvt Ltd is a Sri Lankan company built around creativity, innovation, and meaningful experiences. Through our growing range of divisions, we bring together event management, creative studio services, information technology, travel, and online commerce under one brand.\n\nWe believe every great idea deserves thoughtful planning, quality execution, and a commitment to customer satisfaction. Whether we are creating a memorable celebration, developing a digital solution, supporting a travel experience, or connecting customers with products, our goal is to deliver services that make a lasting difference.',
  },
  vision: {
    heading: 'Our Vision',
    description:
      'To build a trusted, innovative, and customer-focused business that creates meaningful experiences and delivers practical solutions across different industries.',
  },
  mission: {
    heading: 'Our Mission',
    description:
      'To provide creative, reliable, and accessible services through our diverse business divisions while continuously improving our quality, technology, and customer experience.',
  },
  values: [
    {
      id: 'val-1',
      title: 'Customer Focus',
      description: 'Understanding customer needs and building lasting relationships.',
      order: 1,
      enabled: true,
      iconName: 'Users',
    },
    {
      id: 'val-2',
      title: 'Innovation',
      description: 'Exploring new ideas and technology to improve our services.',
      order: 2,
      enabled: true,
      iconName: 'Lightbulb',
    },
    {
      id: 'val-3',
      title: 'Integrity',
      description: 'Working with honesty, responsibility, and transparency.',
      order: 3,
      enabled: true,
      iconName: 'ShieldCheck',
    },
    {
      id: 'val-4',
      title: 'Quality',
      description: 'Striving for professional results in everything we do.',
      order: 4,
      enabled: true,
      iconName: 'Award',
    },
  ],
  divisions: [
    {
      id: 'sws',
      name: 'SWS Event Management',
      tagline: 'Events & Celebration Artistry',
      description:
        'SWS Event Management is our event and celebration division, helping customers create memorable occasions through professional event planning, decorations, photography, and related services.',
      services: [
        'Weddings',
        'Birthdays',
        'Cradle ceremonies',
        'Puberty ceremonies',
        'Mehendi functions',
        'Baby showers',
        'Surprise events',
        'Registration ceremonies',
        'Decorations',
        'Photography',
        'Makeup',
        'Cakes',
        'Buffet arrangements',
        'Chairs',
        'Themed decorations',
      ],
      route: '/sws',
      order: 1,
      enabled: true,
    },
    {
      id: 'u1',
      name: 'U1 Studio',
      tagline: 'Visual Storytelling & Creative Media',
      description:
        'U1 Studio is our creative studio division, focused on photography, visual storytelling, and creative media services. We aim to preserve important moments and transform creative ideas into meaningful visual experiences.',
      services: [
        'Wedding Cinematography',
        'Portraiture & Studio Shoots',
        'Commercial Visual Storytelling',
        'Event Coverage',
        'Editorial Photography',
        'Aerial Drone Filming',
      ],
      route: '/u1',
      order: 2,
      enabled: true,
    },
    {
      id: 'it',
      name: 'Mahdev IT and Solutions',
      tagline: 'Modern Enterprise Technology',
      description:
        'Mahdev IT and Solutions delivers technology-focused services designed to help individuals and businesses improve their digital operations.',
      services: [
        'Software development',
        'Website development',
        'Mobile applications',
        'Business systems',
        'Digital solutions',
        'Technology services',
      ],
      route: '/it',
      order: 3,
      enabled: true,
    },
    {
      id: 'travels',
      name: 'Mahdev Travels',
      tagline: 'Journeys & Destination Expeditions',
      description:
        'Mahdev Travels is our travel division, focused on helping customers explore destinations and access travel-related services and experiences.',
      services: [
        'Custom Sri Lanka Itineraries',
        'Luxury Vehicle Fleet',
        'Airport Transfers & Chauffeur Services',
        'Corporate Retreats',
        'Cultural & Wildlife Tours',
      ],
      route: '/travels',
      order: 4,
      enabled: true,
    },
    {
      id: 'mart',
      name: 'Mahdev Online Mart',
      tagline: 'Convenient Online Commerce',
      description:
        'Mahdev Online Mart is our online commerce division, created to connect customers with products and convenient shopping experiences.',
      services: [
        'Curated Consumer Tech',
        'Event Accessories & Decor Items',
        'Fast Nationwide Islandwide Delivery',
        'Verified Direct Warranties',
        'Secure Order Tracking',
      ],
      route: '/mart',
      order: 5,
      enabled: true,
    },
  ],
  timeline: [
    {
      id: 'time-2022',
      year: '2022',
      title: 'SWS Event Management begins',
      description: 'SWS Event Management started in Trincomalee on 1 January 2022.',
      order: 1,
      enabled: true,
    },
    {
      id: 'time-2023',
      year: '2023',
      title: 'Creative Studio Expansion',
      description: 'Expanded into studio and creative media services.',
      order: 2,
      enabled: true,
    },
    {
      id: 'time-2024',
      year: '2024',
      title: 'Growing Event Services',
      description: 'Expanded decoration services and customer reach.',
      order: 3,
      enabled: true,
    },
    {
      id: 'time-2025',
      year: '2025',
      title: 'Technology Division Introduced',
      description: 'Expanded into IT and digital solutions.',
      order: 4,
      enabled: true,
    },
    {
      id: 'time-2026',
      year: '2026',
      title: 'Business Expansion',
      description:
        'Expanded into Colombo operations, company registration, and travel-related services.',
      order: 5,
      enabled: true,
    },
  ],
  locations: [
    {
      id: 'loc-colombo',
      city: 'Colombo',
      address: '41/22 Pickings Road, Colombo 13, Sri Lanka',
      phone: '075 092 8078 / 076 898 8970',
      email: 'info.mahdev.lk@gmail.com',
      mapUrl: 'https://maps.google.com/?q=41/22+Pickings+Road,+Colombo+13,+Sri+Lanka',
      order: 1,
      enabled: true,
    },
    {
      id: 'loc-trincomalee',
      city: 'Trincomalee',
      address: '95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      phone: '075 092 8078 / 076 898 8970',
      email: 'info.mahdev.lk@gmail.com',
      mapUrl: 'https://maps.google.com/?q=95/15+Iluppaikkulam,+Kanniya+Road,+Trincomalee,+Sri+Lanka',
      order: 2,
      enabled: true,
    },
  ],
  cta: {
    title: "Let's Create Something Meaningful",
    description:
      'Whether you are planning an unforgettable celebration, looking for a technology solution, exploring travel opportunities, or searching for products and services, MAHDEV is here to help.',
    primaryButtonText: 'Explore Our Services',
    primaryButtonRoute: '/services',
    secondaryButtonText: 'Contact Us',
    secondaryButtonRoute: '/contact',
  },
  status: 'published',
  version: 1,
  lastUpdated: 'March 2026',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: '2026-03-01T00:00:00.000Z',
  updatedBy: 'info.mahdev.lk@gmail.com',
};

export const DEFAULT_TERMS_CONTENT: LegalDocument = {
  id: 'termsAndConditions',
  slug: 'terms-and-conditions',
  title: 'Terms and Conditions',
  subtitle: 'Official Terms of Engagement, Service Governance, and Commercial Agreement for MAHDEV Pvt Ltd.',
  lastUpdated: 'March 2026',
  effectiveDate: '1 January 2026',
  version: '1.0.0',
  status: 'published',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: '2026-03-01T00:00:00.000Z',
  updatedBy: 'info.mahdev.lk@gmail.com',
  sections: [
    {
      id: 'section-1',
      number: 1,
      heading: 'Introduction',
      order: 1,
      content: [
        'Welcome to MAHDEV Pvt Ltd ("MAHDEV", "Company", "we", "our", or "us"). These Terms and Conditions govern your access to and use of our official website, digital platforms, service consultation channels, and all commercial engagements across our business divisions.',
        'By accessing, browsing, submitting inquiries, or booking services through our website, you agree to be bound by these Terms and Conditions in full. If you do not agree with any part of these terms, you must refrain from using our website and services.',
      ],
    },
    {
      id: 'section-2',
      number: 2,
      heading: 'About MAHDEV',
      order: 2,
      content: [
        'MAHDEV Pvt Ltd is a company duly incorporated and operating under the laws of the Democratic Socialist Republic of Sri Lanka, with primary branches located at 41/22 Pickings Road, Colombo 13, and 95/15 Iluppaikkulam, Kanniya Road, Trincomalee.',
        'MAHDEV operates five core business divisions: SWS Event Management, U1 Studio, Mahdev IT and Solutions, Mahdev Travels, and Mahdev Online Mart. Each division provides specialized offerings under this unified corporate governance.',
      ],
    },
    {
      id: 'section-3',
      number: 3,
      heading: 'Website Use',
      order: 3,
      content: [
        'You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else’s use and enjoyment of the website.',
        'Prohibited behavior includes transmitting defamatory, offensive, or obscene content, attempting unauthorized access to administrative portals or server infrastructure, introducing viruses or malicious code, or scraping website data without explicit written permission.',
      ],
    },
    {
      id: 'section-4',
      number: 4,
      heading: 'Website Information',
      order: 4,
      content: [
        'While we strive to ensure that all information on this website—including service descriptions, division details, package pricing, and portfolio items—is accurate and current, content is provided on an "as is" and "as available" basis without warranties of any kind.',
        'We reserve the right to modify, update, or discontinue any feature, content, or service on the website at any time without prior notice.',
      ],
    },
    {
      id: 'section-5',
      number: 5,
      heading: 'Services and Inquiries',
      order: 5,
      content: [
        'Submitting an inquiry, quotation request, or booking form through our website constitutes an expression of interest and does not form a binding contract until confirmed in writing by an authorized MAHDEV representative.',
        'Our team reviews all incoming inquiries promptly and transmits official proposals, scope documents, and quotation agreements to the contact email or phone provided by the user.',
      ],
    },
    {
      id: 'section-6',
      number: 6,
      heading: 'Event Management and Photography Services',
      order: 6,
      content: [
        'SWS Event Management provides professional planning, decorations, setup, catering arrangements, and event coordination for weddings, birthdays, cradle ceremonies, puberty ceremonies, and corporate functions.',
        'U1 Studio provides creative photography, visual storytelling, and cinematography. Delivery timelines for finalized photo galleries, edited cinematic films, and raw footage are established in individual service agreements.',
        'Clients must provide safe venue access, reasonable preparation windows, and necessary permissions required for event setups and creative recording.',
      ],
    },
    {
      id: 'section-7',
      number: 7,
      heading: 'IT and Digital Solutions',
      order: 7,
      content: [
        'Mahdev IT and Solutions delivers software engineering, website development, mobile applications, business systems, and cloud digital solutions.',
        'Software deliverables are developed in accordance with approved milestone specifications. Client sign-off and deployment follow standard staging review procedures.',
      ],
    },
    {
      id: 'section-8',
      number: 8,
      heading: 'Travel Services',
      order: 8,
      content: [
        'Mahdev Travels coordinates travel itineraries, vehicular transport, tour planning, and destination experiences across Sri Lanka.',
        'Travelers are responsible for holding valid personal identification, visas, and health documentation. Route changes due to adverse weather or safety advisories will be communicated promptly.',
      ],
    },
    {
      id: 'section-9',
      number: 9,
      heading: 'Online Mart and Purchases',
      order: 9,
      content: [
        'Mahdev Online Mart facilitates the purchase and tracked islandwide delivery of commercial products, accessories, and gear.',
        'Product availability, specifications, and estimated dispatch times are displayed per item. We reserve the right to cancel orders in the event of pricing errors or inventory unavailability, with immediate notification and refund.',
      ],
    },
    {
      id: 'section-10',
      number: 10,
      heading: 'Payments',
      order: 10,
      content: [
        'All prices are listed in Sri Lankan Rupees (LKR) unless explicitly indicated otherwise. Payment schedules for division services typically include an initial booking deposit with milestone or completion balances as detailed in formal quotes.',
        'Payments may be remitted via approved bank transfer, direct deposit, or official digital payment gateways configured on our platform.',
      ],
    },
    {
      id: 'section-11',
      number: 11,
      heading: 'Cancellations, Refunds and Changes',
      order: 11,
      content: [
        'Event and studio reservations involve dedicated staff scheduling and custom procurement. Cancellation requests must be submitted in writing. Deposit refunds depend on the advance notice provided and any non-recoverable supplier costs incurred.',
        'For Online Mart orders, unopened items may be returned within 7 days of verified delivery in accordance with our return guidelines.',
      ],
    },
    {
      id: 'section-12',
      number: 12,
      heading: 'Intellectual Property',
      order: 12,
      content: [
        'All intellectual property rights in the website, including text, graphics, trademarks, logos, photographs, video material, code, and software, belong to MAHDEV Pvt Ltd or its licensors.',
        'You may not reproduce, distribute, modify, create derivative works from, or publicly display any material from this site without our prior written consent.',
      ],
    },
    {
      id: 'section-13',
      number: 13,
      heading: 'User Submitted Content',
      order: 13,
      content: [
        'Any material, feedback, reviews, or inquiries submitted by users through our forms must be accurate, respectful, and not violate any third-party privacy or intellectual property rights.',
        'By submitting reviews or project testimonials, you grant MAHDEV a non-exclusive license to publish such feedback on our website.',
      ],
    },
    {
      id: 'section-14',
      number: 14,
      heading: 'Third-Party Links and Services',
      order: 14,
      content: [
        'Our website may contain hyperlinks to external websites, social media platforms, or mapping utilities (such as Google Maps). MAHDEV does not endorse and is not responsible for the content, security, or privacy policies of third-party platforms.',
      ],
    },
    {
      id: 'section-15',
      number: 15,
      heading: 'Website Availability and Security',
      order: 15,
      content: [
        'We aim to maintain continuous, uninterrupted availability of our web portals. However, maintenance windows, server updates, or unforeseen network outages may occasionally occur.',
        'We implement industry-standard SSL encryption and security practices, but cannot guarantee that the website is completely immune to cyber threats or interruptions.',
      ],
    },
    {
      id: 'section-16',
      number: 16,
      heading: 'Disclaimers',
      order: 16,
      content: [
        'To the fullest extent permitted by Sri Lankan law, MAHDEV Pvt Ltd disclaims all express or implied warranties, including merchantability, fitness for a particular purpose, and non-infringement.',
      ],
    },
    {
      id: 'section-17',
      number: 17,
      heading: 'Limitation of Liability',
      order: 17,
      content: [
        'Under no circumstances shall MAHDEV Pvt Ltd, its directors, employees, or division managers be liable for indirect, incidental, special, or consequential damages resulting from website use or service delays caused by force majeure events.',
      ],
    },
    {
      id: 'section-18',
      number: 18,
      heading: 'Indemnity',
      order: 18,
      content: [
        'You agree to indemnify, defend, and hold harmless MAHDEV Pvt Ltd and its affiliates against any claims, liabilities, damages, and expenses arising from your violation of these Terms or misuse of our digital services.',
      ],
    },
    {
      id: 'section-19',
      number: 19,
      heading: 'Privacy',
      order: 19,
      content: [
        'Your use of our website is also governed by our Privacy Policy, which details our collection, processing, and safeguarding of customer information.',
      ],
    },
    {
      id: 'section-20',
      number: 20,
      heading: 'Changes to Terms',
      order: 20,
      content: [
        'We reserve the right to revise these Terms and Conditions at our discretion. Updated versions will be published on this page with an updated "Last Updated" revision date.',
        'Continued usage of our website and services following any revisions indicates your acceptance of the updated Terms.',
      ],
    },
    {
      id: 'section-21',
      number: 21,
      heading: 'Governing Law',
      order: 21,
      content: [
        'These Terms and Conditions shall be governed by and construed in accordance with the substantive laws of the Democratic Socialist Republic of Sri Lanka.',
        'Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of Sri Lanka.',
      ],
    },
    {
      id: 'section-22',
      number: 22,
      heading: 'Contact Information',
      order: 22,
      content: [
        'For inquiries regarding these Terms and Conditions, corporate contracts, or service engagements, please reach out to our legal and administrative desk:',
        'Email: info.mahdev.lk@gmail.com\nTelephone: 075 092 8078 / 076 898 8970\nColombo Branch: 41/22 Pickings Road, Colombo 13, Sri Lanka\nTrincomalee Branch: 95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      ],
    },
    {
      id: 'section-23',
      number: 23,
      heading: 'Dispute Resolution',
      order: 23,
      content: [
        'In the event of any controversy or disagreement, the parties agree to first seek amicable resolution through good-faith executive consultation before initiating formal legal proceedings.',
      ],
    },
    {
      id: 'section-24',
      number: 24,
      heading: 'Entire Agreement & Severability',
      order: 24,
      content: [
        'These Terms, together with any specific written service contracts or quotations, constitute the entire agreement between you and MAHDEV Pvt Ltd regarding website usage and initial service engagements.',
        'If any provision of these Terms is deemed unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.',
      ],
    },
  ],
};

export const DEFAULT_PRIVACY_CONTENT: LegalDocument = {
  id: 'privacyPolicy',
  slug: 'privacy-policy',
  title: 'Privacy Policy',
  subtitle: 'Official Privacy Notice, Data Protection Guidelines, and Transparency Statement for MAHDEV Pvt Ltd.',
  lastUpdated: 'March 2026',
  effectiveDate: '1 January 2026',
  version: '1.0.0',
  status: 'published',
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
  publishedAt: '2026-03-01T00:00:00.000Z',
  updatedBy: 'info.mahdev.lk@gmail.com',
  sections: [
    {
      id: 'priv-1',
      number: 1,
      heading: 'Introduction',
      order: 1,
      content: [
        'MAHDEV Pvt Ltd ("MAHDEV", "we", "our", or "us") respects your personal privacy and is committed to safeguarding the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and protect your information when you interact with our website, online portals, and business divisions.',
        'Please read this Privacy Policy carefully to understand our data practices and how we handle your personal data.',
      ],
    },
    {
      id: 'priv-2',
      number: 2,
      heading: 'Who We Are',
      order: 2,
      content: [
        'MAHDEV Pvt Ltd is a Sri Lankan company operating five integrated business divisions: SWS Event Management, U1 Studio, Mahdev IT and Solutions, Mahdev Travels, and Mahdev Online Mart.',
        'Our registered operational branches are located at 41/22 Pickings Road, Colombo 13, and 95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka. Contact email: info.mahdev.lk@gmail.com.',
      ],
    },
    {
      id: 'priv-3',
      number: 3,
      heading: 'Information We Collect',
      order: 3,
      content: [
        'We collect information that identifies or relates to you ("Personal Data") only when necessary to fulfill your inquiries, execute contracts, process orders, or optimize your website experience.',
        'We do not collect sensitive demographic or biometric information unless specifically required for event execution (e.g. customized makeup allergies or dietary restrictions for catered banquets).',
      ],
    },
    {
      id: 'priv-4',
      number: 4,
      heading: 'Information Users Provide',
      order: 4,
      content: [
        'When you submit contact forms, request quotations, book appointments, or place orders, you may provide:',
        '• Contact Details: Full Name, Email Address, Mobile and WhatsApp Phone Numbers.',
        '• Location Details: Delivery Addresses, Venue Locations, City, and Postal Code.',
        '• Event Details: Event dates, estimated guest counts, preferred decoration themes, and photography packages.',
        '• Technical & Business Requirements: IT project specifications, feature requirements, and timeline expectations.',
        '• Travel Information: Desired travel dates, group size, vehicle preferences, and itinerary notes.',
      ],
    },
    {
      id: 'priv-5',
      number: 5,
      heading: 'Automatically Collected Information',
      order: 5,
      content: [
        'When you browse our website, our server and hosting systems may automatically collect non-personally identifiable diagnostic information, such as your IP address, browser type, device type, operating system, referring URL, and pages visited.',
        'This technical information is used exclusively for performance monitoring, cybersecurity threat mitigation, and interface optimization.',
      ],
    },
    {
      id: 'priv-6',
      number: 6,
      heading: 'Cookies and Similar Technologies',
      order: 6,
      content: [
        'We use minimal, privacy-conscious functional cookies and browser storage to maintain session states, preserve your preferred website theme (light/dark mode), and remember shopping cart contents.',
        'We do not deploy intrusive third-party cross-site advertising cookies. You can manage or disable cookie storage through your browser settings at any time.',
      ],
    },
    {
      id: 'priv-7',
      number: 7,
      heading: 'How We Use Information',
      order: 7,
      content: [
        'We use the information we collect to:',
        '• Respond promptly to customer inquiries and service requests.',
        '• Prepare and deliver formal quotation proposals and service contracts.',
        '• Coordinate event planning, photography sessions, travel bookings, and product orders.',
        '• Send email notifications regarding inquiry receipts, quotation updates, and order confirmations to info.mahdev.lk@gmail.com and the client.',
        '• Provide ongoing client support, invoice delivery, and warranty fulfillment.',
        '• Comply with statutory legal, accounting, and tax regulations in Sri Lanka.',
      ],
    },
    {
      id: 'priv-8',
      number: 8,
      heading: 'Legal Basis for Processing',
      order: 8,
      content: [
        'We process personal data based on one or more of the following lawful grounds: your explicit consent when submitting website forms; the necessity of processing to perform a service contract or quotation requested by you; our legitimate business interest in delivering high-quality client services; and compliance with applicable legal obligations under Sri Lankan law.',
      ],
    },
    {
      id: 'priv-9',
      number: 9,
      heading: 'Sharing Personal Information',
      order: 9,
      content: [
        'We strictly do not sell, rent, trade, or monetize your personal information to third parties.',
        'We share client information only with trusted internal division coordinators (e.g. SWS event managers, U1 camera crews, logistics couriers) who require the details strictly to carry out your booked service.',
      ],
    },
    {
      id: 'priv-10',
      number: 10,
      heading: 'Third-Party Services',
      order: 10,
      content: [
        'To operate our digital infrastructure, we integrate with established enterprise service providers, including Google Cloud, Firebase Firestore, and secure email relay services.',
        'These providers process data strictly on our behalf under secure confidentiality agreements and industry security certifications.',
      ],
    },
    {
      id: 'priv-11',
      number: 11,
      heading: 'Firebase/Cloud Storage',
      order: 11,
      content: [
        'Our website utilizes Google Firebase (Firestore and Storage) to securely persist public CMS content, client inquiries, and verified gallery assets. Data is encrypted both in transit (via HTTPS/TLS) and at rest on secure cloud servers.',
      ],
    },
    {
      id: 'priv-12',
      number: 12,
      heading: 'Data Security',
      order: 12,
      content: [
        'We implement organizational and technical security measures—including role-based access control, cryptographic password hashing, SSL/TLS data encryption, and regular system audits—to protect your personal information against unauthorized access, loss, or alteration.',
      ],
    },
    {
      id: 'priv-13',
      number: 13,
      heading: 'Data Retention',
      order: 13,
      content: [
        'We retain personal information only for as long as necessary to fulfill the purposes for which it was collected, support active customer relationships, deliver warranty support, and satisfy applicable accounting or legal recordkeeping periods.',
      ],
    },
    {
      id: 'priv-14',
      number: 14,
      heading: 'User Rights',
      order: 14,
      content: [
        'Under applicable privacy principles, you have the right to request access to the personal data we hold about you, request corrections of any inaccuracies, request deletion of your information (subject to statutory recordkeeping requirements), or withdraw consent for marketing communications.',
        'To exercise any of these rights, contact us at info.mahdev.lk@gmail.com.',
      ],
    },
    {
      id: 'priv-15',
      number: 15,
      heading: 'Marketing Communications',
      order: 15,
      content: [
        'We send promotional updates or newsletters only to individuals who have expressly opted in. You may opt out of promotional emails at any time by clicking the unsubscribe link or contacting our support team.',
      ],
    },
    {
      id: 'priv-16',
      number: 16,
      heading: "Children's Privacy",
      order: 16,
      content: [
        'Our website and commercial services are directed at adults and corporate clients. We do not knowingly solicit or collect personal information from children under the age of 16 without parental or guardian consent.',
      ],
    },
    {
      id: 'priv-17',
      number: 17,
      heading: 'International Data Transfers',
      order: 17,
      content: [
        'While our primary corporate operations are based in Sri Lanka, cloud servers hosting our databases and email services may reside in secure international data centers (such as Google Cloud regions). We ensure all cross-border data handling meets recognized data protection standards.',
      ],
    },
    {
      id: 'priv-18',
      number: 18,
      heading: 'External Websites and Social Media',
      order: 18,
      content: [
        'Our website may feature links to external social media accounts (Instagram, Facebook, LinkedIn, YouTube). We encourage you to review the privacy policies of any third-party platforms you visit through those links.',
      ],
    },
    {
      id: 'priv-19',
      number: 19,
      heading: 'Changes to Privacy Policy',
      order: 19,
      content: [
        'We may update this Privacy Policy periodically to reflect operational changes or evolving legal requirements. Any modifications will be posted directly to this page along with the updated "Last Updated" date.',
      ],
    },
    {
      id: 'priv-20',
      number: 20,
      heading: 'Contact Us',
      order: 20,
      content: [
        'If you have questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact our Data Governance Officer:',
        'Email: info.mahdev.lk@gmail.com\nTelephone: 075 092 8078 / 076 898 8970\nColombo Office: 41/22 Pickings Road, Colombo 13, Sri Lanka\nTrincomalee Office: 95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      ],
    },
  ],
};

/**
 * Sanitizes text to remove unsafe HTML or script tags
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '');
}

/**
 * Sanitizes all sections in a legal document
 */
export function sanitizeSections(sections: LegalSection[]): LegalSection[] {
  return sections.map((sec, idx) => ({
    ...sec,
    number: idx + 1,
    heading: sanitizeText(sec.heading),
    content: sec.content.map(sanitizeText),
    subsections: sec.subsections?.map((sub) => ({
      title: sanitizeText(sub.title),
      text: sanitizeText(sub.text),
    })),
  }));
}

/**
 * Firestore Service for Website Content & Legal Pages
 */
export const websiteContentService = {
  /**
   * Fetch About Us content from Firestore (creates default seed if doc doesn't exist)
   */
  async getAboutUsContent(): Promise<AboutUsContent> {
    try {
      const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as AboutUsContent;
        return {
          ...DEFAULT_ABOUT_US_CONTENT,
          ...data,
          hero: { ...DEFAULT_ABOUT_US_CONTENT.hero, ...(data.hero || {}) },
          companyIntro: { ...DEFAULT_ABOUT_US_CONTENT.companyIntro, ...(data.companyIntro || {}) },
          vision: { ...DEFAULT_ABOUT_US_CONTENT.vision, ...(data.vision || {}) },
          mission: { ...DEFAULT_ABOUT_US_CONTENT.mission, ...(data.mission || {}) },
          cta: { ...DEFAULT_ABOUT_US_CONTENT.cta, ...(data.cta || {}) },
          values: Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULT_ABOUT_US_CONTENT.values,
          divisions: Array.isArray(data.divisions) && data.divisions.length > 0 ? data.divisions : DEFAULT_ABOUT_US_CONTENT.divisions,
          timeline: Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEFAULT_ABOUT_US_CONTENT.timeline,
          locations: Array.isArray(data.locations) && data.locations.length > 0 ? data.locations : DEFAULT_ABOUT_US_CONTENT.locations,
        };
      }

      // First run: Seed Firestore with authentic defaults
      await setDoc(docRef, {
        ...DEFAULT_ABOUT_US_CONTENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return DEFAULT_ABOUT_US_CONTENT;
    } catch (err) {
      console.warn('[WebsiteContentService] Error fetching About Us content from Firestore, using baseline:', err);
      return DEFAULT_ABOUT_US_CONTENT;
    }
  },

  /**
   * Save / Update About Us content
   */
  async saveAboutUsContent(data: Partial<AboutUsContent>, userEmail?: string): Promise<void> {
    const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
    const updatePayload: any = {
      ...data,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
      status: 'published',
    };
    if (userEmail) {
      updatePayload.updatedBy = userEmail;
    }
    await setDoc(docRef, updatePayload, { merge: true });
  },

  /**
   * Subscribe to real-time updates for About Us content
   */
  subscribeAboutUsContent(callback: (content: AboutUsContent) => void): () => void {
    const docRef = doc(db, WEBSITE_CONTENT_COLLECTION, 'aboutUs');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AboutUsContent;
          callback({
            ...DEFAULT_ABOUT_US_CONTENT,
            ...data,
            hero: { ...DEFAULT_ABOUT_US_CONTENT.hero, ...(data.hero || {}) },
            companyIntro: { ...DEFAULT_ABOUT_US_CONTENT.companyIntro, ...(data.companyIntro || {}) },
            vision: { ...DEFAULT_ABOUT_US_CONTENT.vision, ...(data.vision || {}) },
            mission: { ...DEFAULT_ABOUT_US_CONTENT.mission, ...(data.mission || {}) },
            cta: { ...DEFAULT_ABOUT_US_CONTENT.cta, ...(data.cta || {}) },
            values: Array.isArray(data.values) && data.values.length > 0 ? data.values : DEFAULT_ABOUT_US_CONTENT.values,
            divisions: Array.isArray(data.divisions) && data.divisions.length > 0 ? data.divisions : DEFAULT_ABOUT_US_CONTENT.divisions,
            timeline: Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline : DEFAULT_ABOUT_US_CONTENT.timeline,
            locations: Array.isArray(data.locations) && data.locations.length > 0 ? data.locations : DEFAULT_ABOUT_US_CONTENT.locations,
          });
        } else {
          callback(DEFAULT_ABOUT_US_CONTENT);
        }
      },
      (err) => {
        console.warn('[WebsiteContentService] Error on About Us snapshot listener:', err);
        callback(DEFAULT_ABOUT_US_CONTENT);
      }
    );
  },

  /**
   * Get Legal Document (Terms or Privacy)
   */
  async getLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    includeDraft = false
  ): Promise<LegalDocument> {
    const defaultDoc = docId === 'privacyPolicy' ? DEFAULT_PRIVACY_CONTENT : DEFAULT_TERMS_CONTENT;
    try {
      const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as LegalDocument;
        const baseDoc = {
          ...defaultDoc,
          ...data,
          sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : defaultDoc.sections,
        };

        if (includeDraft && data.draftSections && data.draftSections.length > 0) {
          return {
            ...baseDoc,
            sections: data.draftSections,
            hasUnpublishedChanges: true,
          };
        }
        return baseDoc;
      }

      // Seed if not exists
      await setDoc(docRef, {
        ...defaultDoc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return defaultDoc;
    } catch (err) {
      console.warn(`[WebsiteContentService] Error fetching legal doc ${docId}, using baseline:`, err);
      return defaultDoc;
    }
  },

  /**
   * Save Legal Document Draft
   */
  async saveLegalDraft(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    sections: LegalSection[],
    userEmail?: string
  ): Promise<void> {
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
    const sanitized = sanitizeSections(sections);
    await setDoc(
      docRef,
      {
        draftSections: sanitized,
        hasUnpublishedChanges: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || 'admin',
      },
      { merge: true }
    );
  },

  /**
   * Publish Legal Document
   */
  async publishLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    sections: LegalSection[],
    userEmail?: string,
    newVersion?: string
  ): Promise<LegalDocument> {
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);
    const sanitized = sanitizeSections(sections);
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

    const snap = await getDoc(docRef);
    let currentVersion = '1.0.0';
    if (snap.exists()) {
      const existing = snap.data() as LegalDocument;
      currentVersion = existing.version || '1.0.0';
    }

    // Auto-increment version if not explicitly supplied
    let computedVersion = newVersion;
    if (!computedVersion) {
      const parts = currentVersion.split('.').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        computedVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
      } else {
        computedVersion = `${currentVersion}.1`;
      }
    }

    const payload: Partial<LegalDocument> = {
      sections: sanitized,
      draftSections: sanitized,
      hasUnpublishedChanges: false,
      status: 'published',
      version: computedVersion,
      lastUpdated: formattedDate,
      publishedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      updatedBy: userEmail || 'admin',
    };

    await setDoc(docRef, payload, { merge: true });

    return {
      ...(docId === 'privacyPolicy' ? DEFAULT_PRIVACY_CONTENT : DEFAULT_TERMS_CONTENT),
      ...(snap.exists() ? (snap.data() as LegalDocument) : {}),
      ...payload,
    } as LegalDocument;
  },

  /**
   * Subscribe to real-time updates for Legal Document
   */
  subscribeLegalDocument(
    docId: 'termsAndConditions' | 'privacyPolicy' | string,
    callback: (doc: LegalDocument) => void,
    includeDraft = false
  ): () => void {
    const defaultDoc = docId === 'privacyPolicy' ? DEFAULT_PRIVACY_CONTENT : DEFAULT_TERMS_CONTENT;
    const docRef = doc(db, LEGAL_PAGES_COLLECTION, docId);

    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as LegalDocument;
          const baseDoc = {
            ...defaultDoc,
            ...data,
            sections: Array.isArray(data.sections) && data.sections.length > 0 ? data.sections : defaultDoc.sections,
          };

          if (includeDraft && data.draftSections && data.draftSections.length > 0) {
            callback({
              ...baseDoc,
              sections: data.draftSections,
              hasUnpublishedChanges: true,
            });
          } else {
            callback(baseDoc);
          }
        } else {
          callback(defaultDoc);
        }
      },
      (err) => {
        console.warn(`[WebsiteContentService] Error in snapshot for ${docId}:`, err);
        callback(defaultDoc);
      }
    );
  },
};
