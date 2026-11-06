import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CANONICAL_SITE_ORIGIN, SITE_NAME } from '../src/config/site.js';

const sourcePath = path.resolve('public/robots.txt');
const outputPath = path.resolve('dist/robots.txt');
const source = (await readFile(sourcePath, 'utf8')).replace(
  /^# Robots\.txt for .*$/m,
  `# Robots.txt for ${SITE_NAME} (${CANONICAL_SITE_ORIGIN})`
);
const sitemapLine = `Sitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml`;
const robots = /^Sitemap:.*$/m.test(source)
  ? source.replace(/^Sitemap:.*$/m, sitemapLine)
  : `${source.trimEnd()}\n\n${sitemapLine}\n`;

await writeFile(outputPath, robots, 'utf8');
console.log(`[Robots] Wrote ${outputPath}`);
