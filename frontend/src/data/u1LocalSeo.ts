/**
 * U1 Studio local SEO copy, shared by the /u1 page, its image alt text and the
 * build-time prerendered HTML, so crawlers see the same headings with or
 * without JavaScript. Mirrors src/data/swsLocalSeo.ts.
 */

import { keywordImageAlt, type ImageAltKeyword } from '../utils/keywordImageAlt.js';

export const U1_PRIMARY_HEADING = 'U1 Studio – Wedding Photographers Trincomalee & Colombo';

/** Visible summary under the service headings, naming the searches the page should match. */
export const U1_SERVICE_AREA_SUMMARY =
  'U1 Studio offers wedding photography and videography, pre-shoots, birthday and event photography, portrait and studio sessions, product photography and photo albums in Trincomalee, Nilaveli, Uppuveli and Colombo, Sri Lanka.';

// Each heading is rendered as an <h2> on /u1 and in the prerendered HTML, so
// each one leads with the search phrase people type ("wedding photography trincomalee").
export const U1_SERVICE_HIGHLIGHTS = [
  {
    heading: 'Wedding Photography & Videography in Trincomalee & Colombo – Cinematic 4K Wedding Films',
    body: 'Editorial wedding photography and cinematic 4K wedding films for every wedding tradition, including Manavarai and Poruwa ceremonies, finished with heirloom albums.',
  },
  {
    heading: 'Pre-Shoot Photography Sri Lanka – Couple Love Stories & Cinematic Reels',
    body: 'Pre-wedding and engagement shoots on Trincomalee beaches, in Colombo and at destinations across Sri Lanka, with styled concepts and short cinematic reels.',
  },
  {
    heading: 'Birthday & Event Photography in Trincomalee & Colombo – Ceremonies, Galas & Concerts',
    body: 'Photography and videography for birthdays, cradle and puberty ceremonies, corporate galas, concerts and summits.',
  },
  {
    heading: 'Portrait & Studio Photography Trincomalee – Headshots, Fashion & Editorial Portraits',
    body: 'Executive headshots and fashion and editorial portraits on our infinity cyclorama with controlled studio lighting.',
  },
  {
    heading: 'Product Photography Colombo & Trincomalee – E-Commerce & Advertising',
    body: 'Catalogue, e-commerce, food and fashion product photography and short commercial videos for brands and online stores.',
  },
  {
    heading: 'Photo Albums, Frames & Post Production in Sri Lanka',
    body: 'Handcrafted flush-mount wedding albums, framed and canvas wall art, colour grading and professional retouching.',
  },
] as const;

// Local search phrase for each kind of image, checked in order; the first match goes into the alt text.
// Pre-shoots come before weddings so a "pre-wedding" image gets the pre-shoot phrase.
const U1_IMAGE_ALT_KEYWORDS: readonly ImageAltKeyword[] = [
  { pattern: /pre-?shoot|pre-?wedding|love story|couple|romance|engagement/i, phrase: 'Pre-Shoot Photography Sri Lanka' },
  { pattern: /wedding|bridal|manavarai|poruwa/i, phrase: 'Wedding Photographers Trincomalee & Colombo' },
  { pattern: /product|commercial|catalog|e-?commerce|food/i, phrase: 'Product Photography Colombo & Trincomalee' },
  { pattern: /portrait|headshot|fashion|studio|editorial/i, phrase: 'Portrait Photography Trincomalee' },
  { pattern: /birthday|event|gala|concert|summit|ceremony|cradle|puberty/i, phrase: 'Event Photography Trincomalee & Colombo' },
  { pattern: /album|frame|canvas|print/i, phrase: 'Photo Albums Sri Lanka' },
  { pattern: /video|film|cinema|reel|drone/i, phrase: 'Videography Trincomalee & Colombo' },
];

/** Alt text for a U1 image: its own title plus the local search phrase that fits what it shows. */
export function getU1ImageAlt(title: string, ...context: Array<string | undefined>): string {
  return keywordImageAlt(U1_IMAGE_ALT_KEYWORDS, 'U1 Studio Photography, Trincomalee & Colombo', title, ...context);
}
