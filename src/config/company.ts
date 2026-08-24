export interface OfficeLocation {
  id: 'colombo' | 'trincomalee';
  name: string;
  city: string;
  address: string;
  fullAddress: string;
  street: string;
  area: string;
  country: string;
  isHeadquarters: boolean;
  mapQuery: string;
}

export interface CompanyInformation {
  name: string;
  legalName: string;
  registrationNumber?: string;
  tagline: string;
  description: string;
  domain: string;
  email: string;
  phones: string[];
  primaryPhone: string;
  secondaryPhone: string;
  offices: {
    colombo: OfficeLocation;
    trincomalee: OfficeLocation;
  };
  socials: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  workingHours: {
    weekdays: string;
    weekends: string;
    support: string;
  };
}

export const COMPANY_INFO: CompanyInformation = {
  name: 'Mahdev',
  legalName: 'Mahdev Pvt Ltd',
  registrationNumber: 'PV-00289410',
  tagline: 'Creating Moments. Capturing Memories. Delivering Innovation.',
  description:
    'Premier multi-division enterprise ecosystem delivering 360° event engineering, cinema studio production, software architectures, luxury travel expeditions, and curated e-commerce.',
  domain: 'mahdev.lk',
  email: 'info.mahdev.lk@gmail.com',
  phones: ['076 898 8970', '075 092 8078'],
  primaryPhone: '076 898 8970',
  secondaryPhone: '075 092 8078',
  offices: {
    colombo: {
      id: 'colombo',
      name: 'Colombo Office',
      city: 'Colombo',
      address: '41/22, Pickerings Road, Kotahena, Colombo 13, Sri Lanka',
      fullAddress: '41/22, Pickerings Road, Kotahena, Colombo 13, Sri Lanka',
      street: '41/22, Pickerings Road',
      area: 'Kotahena, Colombo 13',
      country: 'Sri Lanka',
      isHeadquarters: true,
      mapQuery: '41/22 Pickerings Road, Kotahena, Colombo 13, Sri Lanka',
    },
    trincomalee: {
      id: 'trincomalee',
      name: 'Trincomalee Office',
      city: 'Trincomalee',
      address: '95/15, Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      fullAddress: '95/15, Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
      street: '95/15, Iluppaikkulam',
      area: 'Kanniya Road',
      country: 'Sri Lanka',
      isHeadquarters: false,
      mapQuery: '95/15 Iluppaikkulam, Kanniya Road, Trincomalee, Sri Lanka',
    },
  },
  socials: {
    linkedin: 'https://linkedin.com/company/mahdev',
    facebook: 'https://facebook.com/mahdev',
    instagram: 'https://instagram.com/mahdev',
    youtube: 'https://youtube.com/@mahdev',
    whatsapp: 'https://wa.me/94750928078?text=Hello%20Mahdev%20Pvt%20Ltd',
  },
  workingHours: {
    weekdays: 'Monday – Friday: 8:30 AM – 6:00 PM',
    weekends: 'Saturday: 9:00 AM – 2:00 PM',
    support: '24/7 Dedicated Event & Cloud Infrastructure Support',
  },
};

export const OFFICE_LIST: OfficeLocation[] = [
  COMPANY_INFO.offices.colombo,
  COMPANY_INFO.offices.trincomalee,
];

// Helper to format clean tel: href
export function getTelLink(phone: string): string {
  // Convert 075 092 8078 to +94750928078 or local 0750928078
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `tel:+94${digits.substring(1)}`;
  }
  if (digits.startsWith('94')) {
    return `tel:+${digits}`;
  }
  return `tel:${digits}`;
}

// Helper to format clean mailto: href
export function getMailtoLink(email: string = COMPANY_INFO.email, subject?: string): string {
  if (subject) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }
  return `mailto:${email}`;
}

// Helper to format Google Maps search query link
export function getMapSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Helper to format clean WhatsApp click-to-chat link
export function getWhatsAppUrl(phone: string = COMPANY_INFO.primaryPhone, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('0') ? `94${digits.substring(1)}` : digits.startsWith('94') ? digits : `94${digits}`;
  if (text) {
    return `https://wa.me/${international}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${international}`;
}
