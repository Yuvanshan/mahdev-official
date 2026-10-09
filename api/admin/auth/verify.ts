import handler from '../../../backend/api/handlers/admin/auth/verify.js';

export default function verify(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
