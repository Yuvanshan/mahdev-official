import handler from '../../../backend/api/handlers/admin/auth/login';

export default function login(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
