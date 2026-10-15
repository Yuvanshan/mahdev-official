import type { IncomingMessage, ServerResponse } from 'node:http';
import sitemapHandler from '../backend/api/handlers/sitemap.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  await sitemapHandler(req, res);
}
