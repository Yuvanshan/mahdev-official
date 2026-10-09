import handler from '../../backend/api/handlers/upload/media.js';

export default function media(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
