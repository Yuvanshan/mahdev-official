import handler from '../../backend/api/handlers/admin/customers';

export default function customers(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
