import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const fileEnv = loadEnv('production', process.cwd(), '');
process.env.VITE_SITE_URL ||= fileEnv.VITE_SITE_URL || fileEnv.PUBLIC_SITE_URL || '';

const [{ CANONICAL_SITE_ORIGIN }, { COMPANY_INFO }, { BRAND_CONFIG }] = await Promise.all([
  import('../src/config/site.js'),
  import('../src/config/company.js'),
  import('../src/config/brand.js'),
]);

const pages = [
  ['Home', '/', 'Company overview and links to Mahdev divisions.'],
  ['About Mahdev', '/about', 'Company background, mission and business information.'],
  ['Services', '/services', 'Public services across the Mahdev divisions.'],
  ['Projects', '/portfolio', 'Selected public project and case-study records.'],
  ['Gallery', '/gallery', 'Public photography and visual work.'],
  ['Contact', '/contact', 'Public contact and enquiry information.'],
  ['Careers', '/careers', 'Current job opportunities and applications.'],
  ['SWS Event Management', '/sws', 'Wedding, ceremony and corporate event decoration in Sri Lanka.'],
  ['U1 Studio', '/u1', 'Photography and cinema services in Sri Lanka.'],
  ['Mahdev IT Solutions', '/it', 'Software, web, mobile and cloud services.'],
  ['Mahdev Travels', '/travels', 'Travel planning and journeys across Sri Lanka.'],
  ['Mahdev Online Mart', '/mart', 'Online retail for event and home products.'],
] as const;

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
  ...pages.map(([label, route, description]) => `- [${label}](${CANONICAL_SITE_ORIGIN}${route}): ${description}`),
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
