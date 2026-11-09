import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const fileEnv = loadEnv('production', process.cwd(), '');
process.env.VITE_SITE_URL ||= fileEnv.VITE_SITE_URL || fileEnv.PUBLIC_SITE_URL || '';

const [
  { CANONICAL_SITE_ORIGIN },
  { COMPANY_INFO },
  { BRAND_CONFIG },
  { getDivisionSiteUrl },
  { SWS_BUSINESS, SWS_SERVICE_AREA_SUMMARY, SWS_SERVICE_HIGHLIGHTS },
] = await Promise.all([
  import('../src/config/site.js'),
  import('../src/config/company.js'),
  import('../src/config/brand.js'),
  import('../src/config/divisionSites.js'),
  import('../src/data/swsLocalSeo.js'),
]);

const pages = [
  ['Home', '/', 'Company overview and links to Mahdev divisions.'],
  ['About Mahdev', '/about', 'Company background, mission and business information.'],
  ['Services', '/services', 'Public services across the Mahdev divisions.'],
  ['Projects', '/portfolio', 'Selected public project and case-study records.'],
  ['Gallery', '/gallery', 'Public photography and visual work.'],
  ['Contact', '/contact', 'Public contact and enquiry information.'],
  ['Careers', '/careers', 'Current job opportunities and applications.'],
  ['SWS Event Management', '/sws', 'SWS Events, an event planner in Trincomalee for wedding, birthday, cultural ceremony and corporate event decoration in Trincomalee, Colombo and nearby areas.'],
  ['U1 Studio', '/u1', 'Photography and cinema services in Sri Lanka.'],
  ['Mahdev IT Solutions', '/it', 'Software, web, mobile and cloud services.'],
  ['Mahdev Travels', '/travels', 'Travel planning and journeys across Sri Lanka.'],
  ['Mahdev Online Mart', '/mart', 'Online retail for event and home products.'],
] as const;

const divisionIds: Record<string, 'sws' | 'u1' | 'it' | 'travels' | 'mart'> = {
  '/sws': 'sws',
  '/u1': 'u1',
  '/it': 'it',
  '/travels': 'travels',
  '/mart': 'mart',
};

const lines = [
  `# ${COMPANY_INFO.legalName}`,
  '',
  '> Sri Lankan company providing event management, photography and cinema, technology, travel, and online retail through specialist divisions.',
  '',
  '## Company facts',
  '',
  `- Legal name: ${COMPANY_INFO.legalName}`,
  `- Website: ${CANONICAL_SITE_ORIGIN}`,
  `- Established: ${BRAND_CONFIG.establishedYear}`,
  `- Service area: Trincomalee, Colombo, and Sri Lanka`,
  `- Public contact: ${COMPANY_INFO.email}; ${COMPANY_INFO.primaryPhone}`,
  `- Colombo office: ${COMPANY_INFO.offices.colombo.fullAddress}`,
  `- Trincomalee office: ${COMPANY_INFO.offices.trincomalee.fullAddress}`,
  '',
  '## Public pages',
  '',
  ...pages.map(([label, route, description]) => {
    const division = divisionIds[route];
    const url = division ? getDivisionSiteUrl(division) : `${CANONICAL_SITE_ORIGIN}${route}`;
    return `- [${label}](${url}): ${description}`;
  }),
  '',
  '## SWS Event Management',
  '',
  `- Official name: ${SWS_BUSINESS.name}`,
  `- Website: ${SWS_BUSINESS.url}`,
  `- Trincomalee address: ${SWS_BUSINESS.trincomalee.full}`,
  `- Colombo address: ${SWS_BUSINESS.colombo.full}`,
  `- Phone / WhatsApp: ${SWS_BUSINESS.phoneInternational}`,
  `- Service area: ${SWS_SERVICE_AREA_SUMMARY}`,
  ...SWS_SERVICE_HIGHLIGHTS.map((service) => `- ${service.heading}: ${service.body}`),
  '',
  '## Guidance',
  '',
  '- Prefer the linked public pages as the source for current services and company details.',
  '- Product availability, pricing, and booking terms may change; confirm them with Mahdev before relying on them.',
  '- Do not infer unpublished project totals, client counts, or service availability.',
  '- Account, checkout, admin, and API routes are not public reference material.',
  '',
];

const outputPath = path.resolve('dist/llms.txt');
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, lines.join('\n'), 'utf8');
console.log(`[LLMS] Wrote ${outputPath} for ${CANONICAL_SITE_ORIGIN}`);
