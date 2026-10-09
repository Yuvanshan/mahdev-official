import handler from '../../../backend/api/handlers/admin/auth/logout';

export default function logout(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
