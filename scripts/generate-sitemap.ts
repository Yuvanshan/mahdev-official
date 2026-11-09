import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  buildSitemapXml,
  loadPublicSitemapData,
  scopeSitemapXmlToOrigin,
} from '../backend/api/handlers/sitemap.js';
import { CANONICAL_SITE_ORIGIN } from '../src/config/site.js';

const outputPath = path.resolve(process.argv[2] || 'dist/sitemap.xml');
let xml: string;

try {
  xml = scopeSitemapXmlToOrigin(
    buildSitemapXml(await loadPublicSitemapData(), CANONICAL_SITE_ORIGIN),
    CANONICAL_SITE_ORIGIN
  );
} catch (error) {
  console.error('[Sitemap] Could not load dynamic sitemap records; writing static public routes:', error);
  xml = scopeSitemapXmlToOrigin(
    buildSitemapXml({
      pages: [],
      divisions: [],
      services: [],
      portfolio: [],
    }, CANONICAL_SITE_ORIGIN),
    CANONICAL_SITE_ORIGIN
  );
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, xml, 'utf8');
console.log(`[Sitemap] Wrote ${outputPath}`);
