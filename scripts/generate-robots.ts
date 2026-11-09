import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CANONICAL_SITE_ORIGIN } from '../src/config/site.js';
import { buildRobotsTxt } from '../backend/api/handlers/robots.js';

const outputPath = path.resolve('dist/robots.txt');
await writeFile(outputPath, buildRobotsTxt(CANONICAL_SITE_ORIGIN), 'utf8');
console.log(`[Robots] Wrote ${outputPath}`);
