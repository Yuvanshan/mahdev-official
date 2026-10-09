import handler from '../../backend/api/handlers/admin/customers.js';

export default function customers(...args: Parameters<typeof handler>): ReturnType<typeof handler> {
  return handler(...args);
}
