import handler from '../backend/api/handlers/database';

export default function database(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
