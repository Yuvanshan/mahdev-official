import handler from '../../../backend/api/handlers/admin/auth/verify';

export default function verify(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
