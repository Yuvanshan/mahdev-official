import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  LogIn,
  Mail,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { SEOHead } from '../components/layout/SEOHead';
import { AuthAlert, AuthField, AuthSubmit, PasswordField } from '../components/auth/AuthFields';
import { getServiceStartingPrice } from '../components/common/StartingPriceTag';
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from '../services/authService';
import { bookingService } from '../services/bookingService';
import { markAccountDataStale } from '../services/customerAccountService';
import { Booking, BookingLocation, BookingType } from '../types/booking';
import { FirestoreGallery, FirestoreProduct, FirestoreService } from '../types/firestore';
import { normaliseSriLankaPhone, parseNic } from '../utils/sriLankaIdentity';
import { formatCurrency } from '../utils/currency';
import {
  divisionIdFromName,
  onlineBookingPath,
  readOnlineBookingSnapshot,
  type OnlineBookingItem,
  type OnlineBookingKind,
} from '../utils/onlineBooking';
import { CANONICAL_SITE_ORIGIN } from '../config/site';
import { safeStorage } from '../utils/safeStorage';
import { useOnlineBookingEnabled } from '../hooks/useOnlineBookingEnabled';
import { openWhatsAppInquiry } from '../utils/whatsapp';

interface BookOnlineViewProps {
  kind: OnlineBookingKind;
  itemId: string;
  onNavigate: (path: string) => void;
}

interface BookingPackage {
  id: string;
  name: string;
  price: number;
  description?: string;
}

type FieldKey =
  | 'date'
  | 'address'
  | 'quantity'
  | 'fullName'
  | 'nic'
  | 'phone'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'agreeToTerms';
type FieldErrors = Partial<Record<FieldKey, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Booking details survive a trip to the sign-in page (this tab only; never NIC or passwords).
type BookingDraft = { packageId: string; date: string; time: string; address: string; quantity: number; notes: string };
const draftKey = (kind: OnlineBookingKind, id: string) => `mahdev_online_booking_draft:${kind}:${id.toLowerCase()}`;

function readDraft(kind: OnlineBookingKind, id: string): Partial<BookingDraft> {
  try {
    const raw = safeStorage.getItem(draftKey(kind, id));
    return raw ? (JSON.parse(raw) as Partial<BookingDraft>) : {};
  } catch {
    return {};
  }
}
const MAX_QUANTITY = 1000;

const DIVISION_NAMES: Record<string, string> = {
  sws: 'SWS Event Management',
  u1: 'U1 Studio',
  it: 'MAHDEV IT & Solutions',
  travels: 'MAHDEV Travels',
  mart: 'MAHDEV Online Mart',
};

const TIME_SLOTS = [
  'Morning (08:00 AM - 12:00 PM)',
  'Afternoon (12:00 PM - 04:00 PM)',
  'Evening (04:00 PM - 08:00 PM)',
  'Full day',
  'Flexible - please advise',
];

const BOOKING_TYPES: Record<string, BookingType> = {
  sws: 'event',
  u1: 'photography',
  travels: 'travel',
  it: 'it_service',
};

const KIND_LABELS: Record<OnlineBookingKind, string> = {
  service: 'Service',
  gallery: 'Design from our gallery',
  product: 'Product',
};

// Earliest bookable date is tomorrow, in the visitor's local time.
function tomorrowIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function divisionNameFor(divisionId?: string, fallback?: string): string {
  return (divisionId && DIVISION_NAMES[divisionId]) || fallback || 'MAHDEV Pvt Ltd';
}

/** Only short URLs are stored on the booking; inline data images are too large. */
function storableImageUrl(url?: string): string | undefined {
  return url && !url.startsWith('data:') ? url : undefined;
}

function fromService(service: FirestoreService): OnlineBookingItem {
  const divisionId = String(service.divisionId || service.division || '') || undefined;
  return {
    kind: 'service',
    id: service.id,
    title: service.title || service.name,
    images: [service.imageUrl, ...(service.images || [])].filter(Boolean) as string[],
    description: service.description,
    divisionId,
    divisionName: divisionNameFor(divisionId, service.divisionName),
    price: getServiceStartingPrice(service),
    sku: service.sku,
    features: service.features,
  };
}

function fromGallery(item: FirestoreGallery): OnlineBookingItem {
  const divisionId = String(item.division || '') || undefined;
  const cover = item.type === 'video' ? item.thumbnailUrl : item.url || item.mediaUrl;
  return {
    kind: 'gallery',
    id: item.id,
    title: item.title,
    images: (item.images?.length ? item.images : [cover, item.thumbnailUrl]).filter(Boolean) as string[],
    description: item.caption,
    divisionId,
    divisionName: divisionNameFor(divisionId),
    price: getServiceStartingPrice({ price: item.price }),
    sku: item.sku,
  };
}

function fromProduct(product: FirestoreProduct): OnlineBookingItem {
  const divisionId = String(product.divisionId || product.division || 'mart');
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
  return {
    kind: 'product',
    id: product.id,
    title: product.name,
    images: [...(product.images || []), product.imageUrl].filter(Boolean) as string[],
    description: product.shortDescription || product.description,
    divisionId,
    divisionName: divisionNameFor(divisionId),
    price: price > 0 ? price : null,
    sku: product.sku,
  };
}

/** Packages an admin set up on a service (metadata.packages), if any. */
function servicePackages(service?: FirestoreService): BookingPackage[] {
  const raw = (service?.metadata as { packages?: unknown } | undefined)?.packages;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((pkg): pkg is Record<string, unknown> => Boolean(pkg) && typeof pkg === 'object')
    .map((pkg, index) => ({
      id: String(pkg.id || `package-${index + 1}`),
      name: String(pkg.name || `Package ${index + 1}`),
      price: Number(pkg.price) || 0,
      description: typeof pkg.description === 'string' ? pkg.description : undefined,
    }));
}

export const BookOnlineView: React.FC<BookOnlineViewProps> = ({ kind, itemId, onNavigate }) => {
  const { user, isAuthenticated, isLoading: authLoading, register } = useAuth();
  const onlineBookingEnabled = useOnlineBookingEnabled();
  const { services, gallery, products, isServicesLoading, isGalleryLoading, isProductsLoading, isInitialLoading } =
    useFirestoreDataContext();

  // The live record wins; the snapshot covers items built from division data.
  // The router lowercases page addresses, so ids and slugs are compared without case.
  const sameId = (value?: string) => !!value && value.toLowerCase() === itemId.toLowerCase();
  const liveService = kind === 'service' ? services.find((s) => sameId(s.id) || sameId(s.slug)) : undefined;
  const item = useMemo<OnlineBookingItem | null>(() => {
    if (liveService) return fromService(liveService);
    if (kind === 'gallery') {
      const record = gallery.find((g) => sameId(g.id));
      if (record) return fromGallery(record);
    }
    if (kind === 'product') {
      const record = products.find((p) => sameId(p.id) || sameId(p.slug));
      if (record) return fromProduct(record);
    }
    return readOnlineBookingSnapshot(kind, itemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, itemId, liveService, gallery, products]);
  const packages = useMemo(() => servicePackages(liveService), [liveService]);
  const stillLoading = isInitialLoading || isServicesLoading || isGalleryLoading || isProductsLoading;

  const [activeImage, setActiveImage] = useState(0);
  const [form, setForm] = useState(() => ({
    packageId: '',
    date: '',
    time: TIME_SLOTS[0],
    address: '',
    quantity: 1,
    notes: '',
    ...readDraft(kind, itemId),
    fullName: '',
    nic: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  // Set when registration fails because the email or NIC already has an account.
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => setActiveImage(0), [kind, itemId]);
  useEffect(() => {
    if (confirmed) {
      safeStorage.removeItem(draftKey(kind, itemId));
      return;
    }
    const draft: BookingDraft = {
      packageId: form.packageId,
      date: form.date,
      time: form.time,
      address: form.address,
      quantity: form.quantity,
      notes: form.notes,
    };
    safeStorage.setItem(draftKey(kind, itemId), JSON.stringify(draft));
  }, [kind, itemId, confirmed, form.packageId, form.date, form.time, form.address, form.quantity, form.notes]);
  useEffect(() => {
    if (packages.length && !packages.some((pkg) => pkg.id === form.packageId)) {
      setForm((current) => ({ ...current, packageId: packages[0].id }));
    }
  }, [packages, form.packageId]);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const selectedPackage = packages.find((pkg) => pkg.id === form.packageId);
  const unitPrice = selectedPackage?.price || item?.price || 0;
  const quantity = kind === 'product' ? form.quantity : 1;
  const estimatedTotal = unitPrice * quantity;
  const minDate = tomorrowIso();
  const loginPath = `/login?redirect=${encodeURIComponent(onlineBookingPath(kind, itemId))}`;
  const addressLabel =
    kind === 'product'
      ? 'Delivery address'
      : item?.divisionId === 'travels'
        ? 'Pickup location'
        : item?.divisionId === 'it'
          ? 'Business address or "Online meeting"'
          : 'Event venue / address';
  const dateLabel = kind === 'product' ? 'Preferred delivery date' : 'Preferred date';

  const signedInMissing = useMemo(() => {
    if (!user) return [];
    return [!user.phone && 'contact number', !user.nic && 'NIC'].filter(Boolean) as string[];
  }, [user]);

  const validateBookingDetails = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.date) errors.date = 'Choose a date.';
    else if (form.date < minDate) errors.date = 'Choose a date from tomorrow onwards.';
    if (form.address.trim().length < 3) errors.address = `Enter the ${addressLabel.toLowerCase()}.`;
    if (kind === 'product' && (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > MAX_QUANTITY)) {
      errors.quantity = `Enter a quantity between 1 and ${MAX_QUANTITY}.`;
    }
    if (!form.agreeToTerms) errors.agreeToTerms = 'Please accept the Terms, Refund Policy and Privacy Policy.';
    return errors;
  };

  const validateNewCustomer = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.fullName.trim().length < 3) errors.fullName = 'Enter your full name.';
    if (!parseNic(form.nic)) errors.nic = 'Enter a valid NIC, e.g. 951234567V or 199512345678.';
    if (!normaliseSriLankaPhone(form.phone)) errors.phone = 'Enter a valid Sri Lankan number, e.g. 077 123 4567.';
    if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    const passwordProblem = passwordPolicyError(form.password);
    if (passwordProblem) errors.password = passwordProblem;
    if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
    return errors;
  };

  /** Saves the booking request against the signed-in account. */
  const submitBooking = async (customer: { fullName: string; email: string; phone: string }) => {
    if (!item) return;
    const divisionId = item.divisionId || divisionIdFromName(item.divisionName);
    const location: BookingLocation = {
      type: kind === 'product' ? 'client_premises' : divisionId === 'travels' ? 'travel_destination' : 'venue',
      address: form.address.trim(),
    };
    const now = new Date().toISOString();
    const lineName = selectedPackage ? `${item.title} - ${selectedPackage.name}` : item.title;
    const booking = await bookingService.submitOnlineBooking({
      customerId: user?.id || '',
      divisionId: (['sws', 'u1', 'travels', 'it'].includes(divisionId || '') ? divisionId : 'other') as Booking['divisionId'],
      divisionName: divisionNameFor(divisionId, item.divisionName),
      bookingType: BOOKING_TYPES[divisionId || ''] || 'other',
      serviceId: item.id,
      serviceName: item.title,
      serviceSku: item.sku,
      serviceImageUrl: storableImageUrl(item.images[0]),
      packageId: selectedPackage?.id || `${kind}-${item.id}`,
      packageName: selectedPackage?.name || KIND_LABELS[kind],
      date: form.date,
      time: form.time,
      location,
      customer: { ...customer, preferredContactMethod: 'whatsapp' },
      notes: form.notes.trim(),
      price: estimatedTotal,
      currency: 'LKR',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      source: 'online_booking',
      itemKind: kind,
      lineItems: [{ name: lineName, description: KIND_LABELS[kind], quantity, unitPrice }],
      subtotal: estimatedTotal,
    });
    markAccountDataStale();
    setConfirmed(booking);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setAccountExists(false);
    const errors = { ...validateBookingDetails(), ...validateNewCustomer() };
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      // 1. Create the account (the server refuses an email or NIC that is already registered).
      const registered = await register({
        fullName: form.fullName,
        nic: form.nic,
        phone: form.phone,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms: form.agreeToTerms,
        accountType: 'individual',
      });
      if (!registered.success) {
        const message = registered.error || 'Could not create your account. Please try again.';
        setAccountExists(/already|in use|registered|exists/i.test(message));
        if (/NIC/i.test(message)) setFieldErrors({ nic: message });
        else if (/email/i.test(message)) setFieldErrors({ email: message });
        else setErrorMessage(message);
        return;
      }
      // 2. Save the booking on the new account.
      await submitBooking({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: normaliseSriLankaPhone(form.phone) || form.phone.trim(),
      });
    } catch (error) {
      // The account exists now; the signed-in panel lets them retry the booking.
      setErrorMessage(
        error instanceof Error
          ? `Your account was created, but the booking could not be sent: ${error.message}`
          : 'Please try booking again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignedIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setErrorMessage(null);
    const errors = validateBookingDetails();
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSubmitting(true);
    try {
      await submitBooking({ fullName: user.fullName, email: user.email, phone: user.phone });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not send your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const seo = (
    <SEOHead
      title={item ? `Book ${item.title}` : 'Book Online'}
      description="Choose your date and details and book online with MAHDEV."
      canonicalUrl={`${CANONICAL_SITE_ORIGIN}${onlineBookingPath(kind, itemId)}`}
      noIndex
    />
  );

  // Switched off in the admin: an old link explains and offers WhatsApp instead.
  if (!onlineBookingEnabled && !confirmed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        {seo}
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="font-display text-lg font-bold text-slate-900">Online booking is currently unavailable</h1>
          <p className="text-sm text-slate-600">Please message us on WhatsApp or contact us, and our team will help you book{item ? ` ${item.title}` : ''}.</p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                openWhatsAppInquiry({
                  title: item?.title || 'Booking enquiry',
                  divisionName: item?.divisionName,
                  imageUrl: item?.images[0],
                  type: kind === 'product' ? 'product' : kind === 'gallery' ? 'gallery' : 'service',
                })
              }
              className="rounded-xl bg-emerald-600 text-white text-sm font-semibold py-3 hover:bg-emerald-700"
            >
              WhatsApp
            </button>
            <button type="button" onClick={() => onNavigate('/contact')} className="rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold py-3 hover:bg-slate-50">
              Contact us
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return stillLoading ? (
      <div className="min-h-[70vh] flex items-center justify-center">
        {seo}
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-label="Loading booking details" />
      </div>
    ) : (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        {seo}
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="font-display text-lg font-bold text-slate-900">This item is no longer available</h1>
          <p className="text-sm text-slate-600">It may have been removed or renamed. Browse our services and gallery to choose another.</p>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button type="button" onClick={() => onNavigate('/services')} className="rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
              Services
            </button>
            <button type="button" onClick={() => onNavigate('/gallery')} className="rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold py-3 hover:bg-slate-50">
              Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = item.images;
  const bookingFields = (
    <BookingDetailsFields
      form={form}
      update={update}
      errors={fieldErrors}
      minDate={minDate}
      dateLabel={dateLabel}
      addressLabel={addressLabel}
      showQuantity={kind === 'product'}
      packages={packages}
    />
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10 sm:py-14 px-4">
      {seo}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Item & price details */}
        <section className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {divisionNameFor(item.divisionId, item.divisionName)}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {KIND_LABELS[kind]}
                </span>
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900 mt-3">{item.title}</h1>
              {item.sku && <p className="text-xs text-slate-500 mt-1">Reference {item.sku}</p>}
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={images[activeImage] || images[0]} alt={item.title} className="w-full max-h-[480px] object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${index === activeImage ? 'border-blue-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        aria-label={`Show image ${index + 1}`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {item.description && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{item.description}</p>}

            {item.features && item.features.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {item.features.slice(0, 8).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" /> {feature}
                  </li>
                ))}
              </ul>
            )}

            {(form.date || form.address) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                {form.date && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                    {new Date(`${form.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {form.date && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" /> {form.time}
                  </div>
                )}
                {form.address && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" /> <span className="truncate">{form.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h2 className="font-display text-sm font-bold text-slate-900">Booking summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-mono font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{selectedPackage?.name || KIND_LABELS[kind]}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{unitPrice > 0 ? formatCurrency(unitPrice, 'LKR') : 'On quotation'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {unitPrice > 0 ? formatCurrency(estimatedTotal, 'LKR') : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>{unitPrice > 0 ? (kind === 'product' ? 'Estimated total' : 'Starting from') : 'Price'}</span>
                  <span className="font-mono text-[#0052FF]">{unitPrice > 0 ? formatCurrency(estimatedTotal, 'LKR') : 'On quotation'}</span>
                </div>
              </div>
            </div>
            <div className="mx-5 sm:mx-6 mb-5 text-xs text-slate-600 bg-amber-50/70 border border-amber-100 rounded-xl p-3 space-y-1">
              <p>No payment is taken now. Our team will check availability and confirm the final price, any advance and delivery or transport charges before your booking is confirmed.</p>
              <p>
                Cancellations and refunds follow our{' '}
                <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Refund and Cancellation Policy</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Booking panel */}
        <aside className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 lg:sticky lg:top-24 space-y-4">
            {confirmed ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-slate-900">Booking request received</h2>
                  <p className="text-sm text-slate-600">
                    Booking reference <strong className="font-mono">{confirmed.id}</strong>
                  </p>
                </div>
                <ol className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2 list-decimal list-inside">
                  <li>Our team checks availability for {new Date(`${confirmed.date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.</li>
                  <li>We confirm the final price and any advance on WhatsApp or email.</li>
                  <li>Your booking is confirmed once we accept it; you can follow it in your account.</li>
                </ol>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onNavigate('/account/bookings')} className="rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
                    Track my booking
                  </button>
                  <button type="button" onClick={() => onNavigate('/')} className="rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold py-3 hover:bg-slate-50">
                    Back to home
                  </button>
                </div>
              </div>
            ) : authLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : isAuthenticated && user ? (
              <form onSubmit={handleSignedIn} noValidate className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Book online</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Signed in as <strong>{user.fullName}</strong> ({user.email}).
                  </p>
                </div>
                <AuthAlert tone="error" message={errorMessage} />
                {signedInMissing.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Please add your {signedInMissing.join(' and ')} to your account before booking.</p>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/account/complete?redirect=${encodeURIComponent(onlineBookingPath(kind, itemId))}`)}
                      className="w-full rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700"
                    >
                      Complete my details
                    </button>
                  </div>
                ) : (
                  <>
                    {bookingFields}
                    <TermsCheckbox checked={form.agreeToTerms} onChange={(checked) => update('agreeToTerms', checked)} error={fieldErrors.agreeToTerms} />
                    <AuthSubmit busy={isSubmitting} busyLabel="Sending booking…">
                      <CalendarCheck className="h-4 w-4" /> Book online
                    </AuthSubmit>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleNewCustomer} noValidate className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">Book online</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose your date, then we will create your Mahdev account so you can follow your booking and download your invoice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(loginPath)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4" /> I already have an account
                </button>
                <AuthAlert tone="error" message={errorMessage} />
                {bookingFields}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 pt-2">Your details</h3>
                </div>
                <AuthField
                  label="Full name"
                  autoComplete="name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="As shown on your NIC"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  error={fieldErrors.fullName}
                />
                <AuthField
                  label="NIC number"
                  icon={<CreditCard className="h-4 w-4" />}
                  placeholder="951234567V or 199512345678"
                  autoComplete="off"
                  maxLength={14}
                  value={form.nic}
                  onChange={(e) => update('nic', e.target.value.toUpperCase())}
                  error={fieldErrors.nic}
                />
                <AuthField
                  label="Contact number (WhatsApp)"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="077 123 4567"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  error={fieldErrors.phone}
                />
                <AuthField
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={fieldErrors.email}
                />
                {accountExists && (
                  <button
                    type="button"
                    onClick={() => onNavigate(loginPath)}
                    className="w-full rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-semibold py-2.5 hover:bg-amber-100"
                  >
                    Sign in to book with your existing account
                  </button>
                )}
                <PasswordField
                  label="Create a password"
                  autoComplete="new-password"
                  placeholder={`${MIN_PASSWORD_LENGTH}+ characters, letters and numbers`}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  error={fieldErrors.password}
                  showStrength
                />
                <PasswordField
                  label="Confirm password"
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  error={fieldErrors.confirmPassword}
                />
                <TermsCheckbox checked={form.agreeToTerms} onChange={(checked) => update('agreeToTerms', checked)} error={fieldErrors.agreeToTerms} />
                <AuthSubmit busy={isSubmitting} busyLabel="Creating account & booking…">
                  <ShieldCheck className="h-4 w-4" /> Create account & book online
                </AuthSubmit>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/15';

/** Package, date, time, address, quantity and notes; shared by both booking forms. */
const BookingDetailsFields: React.FC<{
  form: { packageId: string; date: string; time: string; address: string; quantity: number; notes: string };
  update: (key: 'packageId' | 'date' | 'time' | 'address' | 'quantity' | 'notes', value: any) => void;
  errors: FieldErrors;
  minDate: string;
  dateLabel: string;
  addressLabel: string;
  showQuantity: boolean;
  packages: BookingPackage[];
}> = ({ form, update, errors, minDate, dateLabel, addressLabel, showQuantity, packages }) => (
  <div className="space-y-4">
    {packages.length > 0 && (
      <div className="space-y-1.5">
        <label htmlFor="book-package" className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Package className="h-3.5 w-3.5 text-slate-400" /> Package
        </label>
        <select id="book-package" value={form.packageId} onChange={(e) => update('packageId', e.target.value)} className={INPUT_CLASS}>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name}{pkg.price > 0 ? ` - ${formatCurrency(pkg.price, 'LKR')}` : ''}
            </option>
          ))}
        </select>
      </div>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AuthField
        label={dateLabel}
        type="date"
        min={minDate}
        icon={<CalendarDays className="h-4 w-4" />}
        value={form.date}
        onChange={(e) => update('date', e.target.value)}
        error={errors.date}
      />
      <div className="space-y-1.5">
        <label htmlFor="book-time" className="block text-xs font-semibold text-slate-700">Preferred time</label>
        <select id="book-time" value={form.time} onChange={(e) => update('time', e.target.value)} className={INPUT_CLASS}>
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
      </div>
    </div>
    <AuthField
      label={addressLabel}
      icon={<MapPin className="h-4 w-4" />}
      placeholder="Venue, street and city"
      value={form.address}
      onChange={(e) => update('address', e.target.value)}
      maxLength={300}
      error={errors.address}
    />
    {showQuantity && (
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-slate-700">Quantity</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => update('quantity', Math.max(1, form.quantity - 1))} className="h-11 w-11 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={MAX_QUANTITY}
            value={form.quantity}
            onChange={(e) => update('quantity', Math.floor(Number(e.target.value)) || 1)}
            className={`${INPUT_CLASS} w-24 text-center`}
            aria-label="Quantity"
          />
          <button type="button" onClick={() => update('quantity', Math.min(MAX_QUANTITY, form.quantity + 1))} className="h-11 w-11 rounded-xl border border-slate-300 flex items-center justify-center hover:bg-slate-50" aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errors.quantity && <p className="text-xs font-medium text-rose-600">{errors.quantity}</p>}
      </div>
    )}
    <div className="space-y-1.5">
      <label htmlFor="book-notes" className="block text-xs font-semibold text-slate-700">Notes for our team (optional)</label>
      <textarea
        id="book-notes"
        rows={3}
        maxLength={1000}
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
        className={INPUT_CLASS}
        placeholder="Guest count, colours, theme or anything we should know"
      />
    </div>
  </div>
);

const TermsCheckbox: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; error?: string }> = ({ checked, onChange, error }) => (
  <div>
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
      <span>
        I confirm the details above and agree to the{' '}
        <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Terms</a>,{' '}
        <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Refund Policy</a> and{' '}
        <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Privacy Policy</a>.
      </span>
    </label>
    {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
  </div>
);
