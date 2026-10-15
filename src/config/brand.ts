import { BrandConfig } from '../types';
import { COMPANY_INFO } from './company';

export const BRAND_CONFIG: BrandConfig = {
  name: COMPANY_INFO.name,
  legalName: COMPANY_INFO.legalName,
  tagline: COMPANY_INFO.tagline,
  domain: COMPANY_INFO.domain,
  establishedYear: 2022,
  headquarters: 'Colombo, Sri Lanka',
  contactEmail: COMPANY_INFO.email,
  contactPhone: COMPANY_INFO.primaryPhone,
  socials: {
    linkedin: COMPANY_INFO.socials.linkedin || 'https://www.linkedin.com/company/mahdev-pvt-ltd/',
    facebook: COMPANY_INFO.socials.facebook || 'https://facebook.com/mahdev',
    instagram: COMPANY_INFO.socials.instagram || 'https://www.instagram.com/sws_event_management?exln=MW5kamxsczNlOXlxbg==',
    twitter: 'https://twitter.com/mahdev',
    youtube: COMPANY_INFO.socials.youtube || 'https://youtube.com/@mahdev',
  },
};
