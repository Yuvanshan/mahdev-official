import { CANONICAL_SITE_ORIGIN, ORGANIZATION_LEGAL_NAME } from './site.js';
import { DIVISION_SEO } from './divisionSeo.js';

/**
 * Search metadata for the Careers page and its job openings, shared by the
 * React view, the admin editor and the prerendered page head
 * (backend/seo/publicRoutes.ts). Every opening is tagged with the Trincomalee
 * and Colombo branches unless the admin names another place.
 */

/** Default work location for new openings: both branches. */
export const CAREER_DEFAULT_LOCATION = 'Trincomalee & Colombo';

export const CAREERS_PAGE_SEO = {
  title: 'Careers at Mahdev | Jobs in Trincomalee & Colombo',
  description:
    'Jobs at Mahdev in Trincomalee & Colombo, Sri Lanka: event management, photography, IT, travel and retail roles. View open positions and apply online with your CV.',
  heading: 'Careers at Mahdev',
  intro: 'Join our event, studio, technology, travel and retail teams in Trincomalee and Colombo, Sri Lanka.',
  keywords: [
    'jobs in Trincomalee',
    'jobs in Colombo',
    'careers Sri Lanka',
    'event management jobs Sri Lanka',
    'photography jobs Sri Lanka',
    'IT jobs Trincomalee',
    'Mahdev careers',
  ],
} as const;

/** Fields of a career opening that the SEO helpers read. */
export interface CareerOpeningSeoInput {
  id?: string;
  title: string;
  divisionId: string;
  location?: string;
  employmentType?: string;
  experience?: string;
  description?: string;
  responsibilities?: string[];
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

const SEO_DESCRIPTION_LIMIT = 160;

const divisionName = (id: string) =>
  DIVISION_SEO[id as keyof typeof DIVISION_SEO]?.name || 'Mahdev Group';

/** The opening's location, with an empty or Colombo-only value widened to both branches. */
export function careerLocation(location: string | undefined): string {
  const value = location?.trim() || '';
  if (!value || /^colombo(,?\s*sri lanka)?$/i.test(value)) return CAREER_DEFAULT_LOCATION;
  return value;
}

/**
 * Meta description for an opening (~160 characters): role, division and location
 * first, then as many whole sentences of the job description as fit. Always names
 * Trincomalee and Colombo unless the opening is based somewhere else.
 */
export function buildCareerSeoDescription(opening: CareerOpeningSeoInput): string {
  const title = opening.title.trim();
  if (!title) return '';
  const type = opening.employmentType?.trim();
  let text = `${type ? `${type} ` : ''}${title} job at ${divisionName(opening.divisionId)}, ${careerLocation(opening.location)}, Sri Lanka.`;
  const sentences = (opening.description || '').replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]?/g) || [];
  for (const sentence of sentences) {
    const next = `${text} ${sentence.trim()}`;
    if (next.length > SEO_DESCRIPTION_LIMIT) break;
    text = next;
  }
  if (text.length <= SEO_DESCRIPTION_LIMIT) return text;
  // Cut at a word boundary when even the opening line is too long.
  const cut = text.slice(0, SEO_DESCRIPTION_LIMIT - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40)).replace(/[\s,;:–-]+$/, '')}…`;
}

/** Shareable URL of one opening on the Careers page. */
export function careerOpeningPath(id: string): string {
  return `/careers?role=${encodeURIComponent(id)}`;
}

// Google Jobs accepts these values for employmentType.
const EMPLOYMENT_TYPES: Array<[RegExp, string]> = [
  [/full/i, 'FULL_TIME'],
  [/part/i, 'PART_TIME'],
  [/contract|freelance/i, 'CONTRACTOR'],
  [/intern/i, 'INTERN'],
  [/temp|seasonal/i, 'TEMPORARY'],
  [/volunteer/i, 'VOLUNTEER'],
];

const BRANCH_PLACES = {
  trincomalee: { locality: 'Trincomalee', region: 'Eastern Province' },
  colombo: { locality: 'Colombo', region: 'Western Province' },
} as const;

const place = (locality: string, region?: string) => ({
  '@type': 'Place',
  address: { '@type': 'PostalAddress', addressLocality: locality, ...(region ? { addressRegion: region } : {}), addressCountry: 'LK' },
});

/** jobLocation for the opening: each branch it names (both by default), or the place the admin typed. */
function jobLocations(location: string): Array<Record<string, unknown>> {
  const branches = (Object.keys(BRANCH_PLACES) as Array<keyof typeof BRANCH_PLACES>).filter((key) => new RegExp(key, 'i').test(location));
  if (branches.length) return branches.map((key) => place(BRANCH_PLACES[key].locality, BRANCH_PLACES[key].region));
  return [place(location.replace(/,?\s*sri lanka$/i, '').trim() || 'Sri Lanka')];
}

/** Escapes text for the HTML allowed in a JobPosting description. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * schema.org JobPosting for a published opening, so it can appear in Google's job
 * search with its Trincomalee / Colombo location.
 */
export function jobPostingStructuredData(opening: CareerOpeningSeoInput & { id: string }): Record<string, unknown> {
  const location = careerLocation(opening.location);
  const isRemote = /remote|work from home|wfh/i.test(location);
  const responsibilities = (opening.responsibilities || []).map((item) => item.trim()).filter(Boolean);
  const description = [
    ...(opening.description || '').split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`),
    ...(responsibilities.length ? [`<ul>${responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`] : []),
  ].join('');
  const employmentType = EMPLOYMENT_TYPES.find(([pattern]) => pattern.test(opening.employmentType || ''))?.[1];
  const datePosted = (opening.createdAt || opening.updatedAt || new Date().toISOString()).slice(0, 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: opening.title.trim(),
    description: description || `<p>${escapeHtml(buildCareerSeoDescription(opening))}</p>`,
    datePosted,
    ...(employmentType ? { employmentType } : {}),
    ...(opening.experience?.trim() ? { experienceRequirements: opening.experience.trim() } : {}),
    hiringOrganization: {
      '@type': 'Organization',
      '@id': `${CANONICAL_SITE_ORIGIN}/#organization`,
      name: ORGANIZATION_LEGAL_NAME,
      sameAs: CANONICAL_SITE_ORIGIN,
      logo: `${CANONICAL_SITE_ORIGIN}/logo.png`,
    },
    ...(isRemote
      ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'Country', name: 'Sri Lanka' } }
      : { jobLocation: jobLocations(location) }),
    industry: divisionName(opening.divisionId),
    directApply: true,
    url: `${CANONICAL_SITE_ORIGIN}${careerOpeningPath(opening.id)}`,
    identifier: { '@type': 'PropertyValue', name: ORGANIZATION_LEGAL_NAME, value: opening.id },
  };
}
