import handler from '../../../backend/api/handlers/admin/auth/login.js';

export default function login(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
