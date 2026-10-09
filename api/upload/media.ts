import handler from '../../backend/api/handlers/upload/media';

export default function media(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
