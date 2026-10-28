import { useFirestoreDataContext } from '../context/FirestoreDataContext';

/**
 * Whether "Book online" is switched on (Admin → Settings → Commerce).
 * On by default: only an explicit `false` turns it off.
 */
export function useOnlineBookingEnabled(): boolean {
  const { siteSettings } = useFirestoreDataContext();
  return siteSettings?.onlineBookingEnabled !== false;
}
