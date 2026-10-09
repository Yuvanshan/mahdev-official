import handler from '../backend/api/handlers/health.js';

export default function health(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
