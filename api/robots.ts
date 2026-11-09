import type { IncomingMessage, ServerResponse } from 'node:http';
import robotsHandler from '../backend/api/handlers/robots.js';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  robotsHandler(req, res);
}
