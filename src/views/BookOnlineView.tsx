import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
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
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFirestoreDataContext } from '../context/FirestoreDataContext';
import { SEOHead } from '../components/layout/SEOHead';
import { AuthAlert, AuthField, AuthSubmit, PasswordField } from '../components/auth/AuthFields';
import { getServiceStartingPrice } from '../components/common/StartingPriceTag';
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from '../services/authService';
import { bookingService, newBookingReference, uploadPaymentSlip } from '../services/bookingService';
import { PaymentSlipField } from '../components/payment/PaymentSlipField';
import { markAccountDataStale } from '../services/customerAccountService';
import { Booking, BookingLineItem, BookingLocation, BookingPaymentSlip, BookingType } from '../types/booking';
import type { CartItem } from '../types/cart';
import { FirestoreGallery, FirestoreProduct, FirestoreService } from '../types/firestore';
import { normaliseSriLankaPhone, parseNic } from '../utils/sriLankaIdentity';
import { startAccountRecovery, verifyAccountRecovery } from '../services/accountRecoveryService';
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
import { BANK_DETAILS } from '../config/company';

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
  | 'agreeToTerms'
  | 'slip'
  | 'slipAmount';
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
  cart: 'Products from your cart',
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

/** The cart as one bookable item: every product is a line of the booking. */
function fromCart(cartItems: CartItem[]): OnlineBookingItem | null {
  if (!cartItems.length) return null;
  const divisions = new Set(cartItems.map((line) => line.divisionId || 'mart'));
  const divisionId = divisions.size === 1 ? [...divisions][0] : 'mart';
  const count = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  return {
    kind: 'cart',
    id: 'cart',
    title: cartItems.length === 1 ? cartItems[0].name : `Your cart (${count} items)`,
    images: cartItems.map((line) => line.imageUrl).filter(Boolean),
    divisionId,
    divisionName: divisionNameFor(divisionId, cartItems[0].divisionName),
    price: null,
    sku: cartItems.length === 1 ? cartItems[0].sku : undefined,
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
  const { user, isAuthenticated, isLoading: authLoading, register, login } = useAuth();
  const { cartItems, appliedCoupon, clearCart } = useCart();
  // The cart is emptied once it is booked; the booked lines stay on screen.
  const [bookedCart, setBookedCart] = useState<CartItem[] | null>(null);
  const cartLines = kind === 'cart' ? bookedCart || cartItems : [];
  const isCart = kind === 'cart';
  // Products (one product, or the cart) are delivered rather than attended.
  const isProducts = kind === 'product' || isCart;
  const onlineBookingEnabled = useOnlineBookingEnabled();
  const { services, gallery, products, siteSettings, isServicesLoading, isGalleryLoading, isProductsLoading, isInitialLoading } =
    useFirestoreDataContext();

  // The live record wins; the snapshot covers items built from division data.
  // The router lowercases page addresses, so ids and slugs are compared without case.
  const sameId = (value?: string) => !!value && value.toLowerCase() === itemId.toLowerCase();
  const liveService = kind === 'service' ? services.find((s) => sameId(s.id) || sameId(s.slug)) : undefined;
  const item = useMemo<OnlineBookingItem | null>(() => {
    if (kind === 'cart') return fromCart(cartLines);
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
  }, [kind, itemId, liveService, gallery, products, cartLines]);
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
  // Step 1: booking and customer details. Step 2: pay the advance, upload the slip, confirm.
  const [step, setStep] = useState<'details' | 'payment'>('details');
  // Booking reference quoted on the transfer; the booking is saved under it.
  const [reference] = useState(newBookingReference);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipAmount, setSlipAmount] = useState('');
  // "Pay later": book now without a slip and upload it from My bookings afterwards.
  const [payLater, setPayLater] = useState(false);
  const [uploadedSlip, setUploadedSlip] = useState<BookingPaymentSlip | null>(null);
  // Set when the booking was saved but its slip upload failed (retry from the success panel).
  const [slipUploadError, setSlipUploadError] = useState<string | null>(null);
  const [accountMode, setAccountMode] = useState<'create' | 'login' | 'recover'>('create');
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryChallengeId, setRecoveryChallengeId] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  // The booking panel; on phones it sits below the item, so errors and the
  // success message are scrolled into view instead of staying off screen.
  const panelRef = useRef<HTMLDivElement>(null);
  const [revealTick, setRevealTick] = useState(0);
  const revealProblem = () => setRevealTick((tick) => tick + 1);

  // After a failed submit: scroll to the first field with an error, or the error message.
  useEffect(() => {
    if (revealTick === 0) return;
    const frame = window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target =
        panel?.querySelector<HTMLElement>('[aria-invalid="true"]') ||
        panel?.querySelector<HTMLElement>('[role="alert"]');
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target.matches('input, select, textarea')) target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [revealTick]);

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
  // What is booked: every product in the cart, or the one item.
  const lineItems: BookingLineItem[] = isCart
    ? cartLines.map((line) => ({
        name: line.selectedVariant ? `${line.name} - ${line.selectedVariant.name}` : line.name,
        description: line.sku ? `SKU ${line.sku}` : KIND_LABELS.product,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }))
    : item
      ? [{
          name: selectedPackage ? `${item.title} - ${selectedPackage.name}` : item.title,
          description: KIND_LABELS[kind],
          quantity,
          unitPrice,
        }]
      : [];
  const estimatedTotal = lineItems.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const hasPrice = estimatedTotal > 0;
  const depositPercent = siteSettings?.bookingDepositPercent ?? 30;
  const advanceEstimate = estimatedTotal > 0 ? Math.round((estimatedTotal * depositPercent) / 100) : 0;
  const minDate = tomorrowIso();
  const addressLabel =
    isProducts
      ? 'Delivery address'
      : item?.divisionId === 'travels'
        ? 'Pickup location'
        : item?.divisionId === 'it'
          ? 'Business address or "Online meeting"'
          : 'Event venue / address';
  const dateLabel = isProducts ? 'Preferred delivery date' : 'Preferred date';

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

  /** Saves the booking against the signed-in account, under the reference shown for the transfer. */
  const submitBooking = async (customer: { fullName: string; email: string; phone: string }): Promise<Booking | null> => {
    if (!item) return null;
    const divisionId = item.divisionId || divisionIdFromName(item.divisionName);
    const location: BookingLocation = {
      type: isProducts ? 'client_premises' : divisionId === 'travels' ? 'travel_destination' : 'venue',
      address: form.address.trim(),
    };
    const now = new Date().toISOString();
    const booking = await bookingService.submitOnlineBooking({
      customerId: user?.id || '',
      divisionId: (['sws', 'u1', 'travels', 'it'].includes(divisionId || '') ? divisionId : 'other') as Booking['divisionId'],
      divisionName: divisionNameFor(divisionId, item.divisionName),
      bookingType: BOOKING_TYPES[divisionId || ''] || 'other',
      serviceId: isCart ? 'cart' : item.id,
      serviceName: item.title,
      serviceSku: item.sku,
      serviceImageUrl: storableImageUrl(item.images[0]),
      packageId: selectedPackage?.id || (isCart ? 'cart' : `${kind}-${item.id}`),
      packageName: selectedPackage?.name || KIND_LABELS[kind],
      date: form.date,
      time: form.time,
      location,
      customer: { ...customer, preferredContactMethod: 'whatsapp' },
      // A cart coupon is not applied to the booking total; the team applies it when confirming.
      notes: [form.notes.trim(), isCart && appliedCoupon ? `Coupon code: ${appliedCoupon.code}` : '']
        .filter(Boolean)
        .join('\n'),
      price: estimatedTotal,
      currency: 'LKR',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      source: 'online_booking',
      itemKind: isCart ? 'product' : (kind as Exclude<OnlineBookingKind, 'cart'>),
      lineItems,
      subtotal: estimatedTotal,
    }, reference);
    markAccountDataStale();
    return booking;
  };

  /** Uploads the chosen slip to the saved booking; a failure can be retried from the success panel. */
  const sendSlip = async (booking: Booking) => {
    if (!slipFile || payLater) return;
    try {
      setUploadedSlip(await uploadPaymentSlip(booking.id, slipFile, Number(slipAmount)));
      setSlipUploadError(null);
      markAccountDataStale();
    } catch (error) {
      setSlipUploadError(error instanceof Error ? error.message : 'The slip could not be uploaded. Please try again.');
    }
  };

  const validateSlip = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (payLater) return errors;
    if (!slipFile) errors.slip = 'Upload the transfer slip, or tick "Pay later" to upload it from My bookings.';
    const amount = Number(slipAmount);
    if (slipFile && (!Number.isFinite(amount) || amount <= 0)) errors.slipAmount = 'Enter the amount you transferred.';
    else if (slipFile && estimatedTotal > 0 && amount > estimatedTotal) {
      errors.slipAmount = `The amount cannot be more than the total of ${formatCurrency(estimatedTotal, 'LKR')}.`;
    }
    return errors;
  };

  /** Step 1 done: show the bank account and ask for the advance slip. */
  const goToPayment = () => {
    if (!slipAmount && advanceEstimate > 0) setSlipAmount(String(advanceEstimate));
    setErrorMessage(null);
    setStep('payment');
  };

  // Show the payment step / success message (on phones the panel is below the item details).
  useEffect(() => {
    if (!confirmed && step === 'details') return;
    const frame = window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return () => window.cancelAnimationFrame(frame);
  }, [confirmed, step]);

  /** New customer, step 1: validate the booking and registration details before payment. */
  const handleNewCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const errors = { ...validateBookingDetails(), ...validateNewCustomer() };
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      revealProblem();
      return;
    }

    setIsSubmitting(true);
    try {
      goToPayment();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Please try again.');
      revealProblem();
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Signed-in customer, step 1: check the booking details before payment. */
  const handleSignedIn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setErrorMessage(null);
    const errors = validateBookingDetails();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      revealProblem();
      return;
    }
    goToPayment();
  };

  const handleExistingLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const email = form.email.trim();
    if (!EMAIL_PATTERN.test(email)) {
      setFieldErrors({ email: 'Enter the email address used for your account.' });
      return;
    }
    if (!form.password) {
      setFieldErrors({ password: 'Enter your password.' });
      return;
    }
    setIsSubmitting(true);
    const result = await login({ email, password: form.password });
    setIsSubmitting(false);
    if (!result.success) setErrorMessage(result.error || 'Sign-in failed. Please try again.');
  };

  const handleStartRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setRecoveryMessage('');
    if (!recoveryIdentifier.trim()) {
      setErrorMessage('Enter the email, phone number, or NIC from your account.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await startAccountRecovery(recoveryIdentifier);
      setRecoveryChallengeId(result.challengeId);
      setRecoveryCode('');
      setRecoveryMessage(result.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start account recovery.');
      revealProblem();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!/^\d{8}$/.test(recoveryCode.trim())) {
      setErrorMessage('Enter the 8-digit verification code from your email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyAccountRecovery(recoveryChallengeId, recoveryCode.trim());
      setForm((current) => ({ ...current, email: result.email, password: '' }));
      setAccountMode('login');
      setRecoveryChallengeId('');
      setRecoveryCode('');
      setRecoveryMessage('Email verified. Sign in with this account email and your password to continue booking.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not verify the code.');
      revealProblem();
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Step 2: create the account if needed, save the booking, then attach the slip. */
  const handleConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    const errors = validateSlip();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      revealProblem();
      return;
    }

    setIsSubmitting(true);
    let customer: { fullName: string; email: string; phone: string };
    if (isAuthenticated && user) {
      customer = { fullName: user.fullName, email: user.email, phone: user.phone };
    } else {
      // The server also refuses an email, phone or NIC that is already registered.
      const registered = await register({
        fullName: form.fullName,
        nic: form.nic,
        phone: form.phone,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        agreeToTerms: form.agreeToTerms,
        accountType: 'individual',
      }).catch((error: unknown) => ({ success: false, error: error instanceof Error ? error.message : undefined }));
      if (!registered.success) {
        // Back to the details so the customer can correct them.
        const message = registered.error || 'Could not create your account. Please try again.';
        const possibleExistingAccount = /already|in use|registered|exists/i.test(message);
        if (possibleExistingAccount) {
          setAccountMode('recover');
          setErrorMessage('An account already exists with one or more of those details. Verify your registered email to sign in, or check your details and try again.');
        } else if (/NIC/i.test(message)) setFieldErrors({ nic: message });
        else if (/phone|contact/i.test(message)) setFieldErrors({ phone: message });
        else if (/email/i.test(message)) setFieldErrors({ email: message });
        else setErrorMessage(message);
        setStep('details');
        setIsSubmitting(false);
        revealProblem();
        return;
      }
      customer = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: normaliseSriLankaPhone(form.phone) || form.phone.trim(),
      };
    }

    try {
      const booking = await submitBooking(customer);
      if (!booking) return;
      await sendSlip(booking);
      if (isCart) {
        setBookedCart(cartLines);
        clearCart();
      }
      setConfirmed(booking);
    } catch (error) {
      // A new account exists now; the signed-in payment step lets them retry.
      setErrorMessage(
        error instanceof Error ? `Your booking could not be sent: ${error.message}` : 'Could not send your booking. Please try again.'
      );
      revealProblem();
    } finally {
      setIsSubmitting(false);
    }
  };

  const retrySlipUpload = async () => {
    if (!confirmed) return;
    setIsSubmitting(true);
    await sendSlip(confirmed);
    setIsSubmitting(false);
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
                  type: isProducts ? 'product' : kind === 'gallery' ? 'gallery' : 'service',
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

  if (!item && isCart) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        {seo}
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <h1 className="font-display text-lg font-bold text-slate-900">Your cart is empty</h1>
          <p className="text-sm text-slate-600">Add products to your cart, then book them online or order on WhatsApp from the cart.</p>
          <button type="button" onClick={() => onNavigate('/catalog')} className="w-full rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
            Browse products
          </button>
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
                  {lineItems.map((line, index) => (
                    <tr key={`${line.name}-${index}`}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{line.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{isCart ? line.description : selectedPackage?.name || KIND_LABELS[kind]}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{line.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono">{line.unitPrice > 0 ? formatCurrency(line.unitPrice, 'LKR') : 'On quotation'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {line.unitPrice > 0 ? formatCurrency(line.unitPrice * line.quantity, 'LKR') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end">
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>{hasPrice ? (isProducts ? 'Estimated total' : 'Starting from') : 'Price'}</span>
                  <span className="font-mono text-[#0052FF]">{hasPrice ? formatCurrency(estimatedTotal, 'LKR') : 'On quotation'}</span>
                </div>
              </div>
            </div>
            <div className="mx-5 sm:mx-6 mb-5 text-xs text-slate-600 bg-amber-50/70 border border-amber-100 rounded-xl p-3 space-y-1">
              <p>
                {hasPrice
                  ? `To confirm, pay an advance of ${formatCurrency(advanceEstimate, 'LKR')} (${depositPercent}%) by bank transfer and upload the slip, now or later from My bookings. Our team checks the payment and availability, then confirms your booking and any delivery or transport charges.`
                  : 'Our team will confirm the final price and the advance. Pay the advance by bank transfer and upload the slip from My bookings to reserve your date.'}
              </p>
              <p>
                Cancellations and refunds follow our{' '}
                <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Refund and Cancellation Policy</a>.
              </p>
            </div>
          </div>
        </section>

        {/* Booking panel */}
        <aside className="lg:col-span-5">
          <div ref={panelRef} className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 lg:sticky lg:top-24 space-y-4 scroll-mt-24">
            {confirmed ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {uploadedSlip ? 'Booking and payment slip received' : 'Booking received'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Booking reference <strong className="font-mono">{confirmed.id}</strong>
                  </p>
                </div>
                {uploadedSlip && (
                  <div className="text-left rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 space-y-1">
                    <div className="font-bold text-sm">Slip uploaded: {formatCurrency(uploadedSlip.amount, 'LKR')}</div>
                    <p>Our team will check the payment and confirm your booking. You will see the update in your account and on WhatsApp or email.</p>
                  </div>
                )}
                {slipUploadError && (
                  <div className="text-left rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2" role="alert">
                    <div className="font-bold text-sm">Your booking is saved, but the slip did not upload</div>
                    <p>{slipUploadError}</p>
                    <button
                      type="button"
                      onClick={() => void retrySlipUpload()}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-amber-600 text-white text-sm font-semibold py-2.5 hover:bg-amber-700 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Uploading…' : 'Try uploading the slip again'}
                    </button>
                  </div>
                )}
                {!uploadedSlip && !slipUploadError && (
                  <p className="text-left rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    {estimatedTotal > 0
                      ? `When you are ready, transfer the advance of ${formatCurrency(advanceEstimate, 'LKR')} using ${confirmed.id} as the reference and upload the slip from `
                      : 'We will confirm the final price and the advance with you. Then pay the advance and upload the slip from '}
                    <strong>My bookings</strong> to reserve your date.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => onNavigate('/account/bookings')} className="rounded-xl bg-[#0052FF] text-white text-sm font-semibold py-3 hover:bg-blue-700">
                    Track my booking
                  </button>
                  <button type="button" onClick={() => onNavigate('/')} className="rounded-xl border border-slate-300 text-slate-800 text-sm font-semibold py-3 hover:bg-slate-50">
                    Back to home
                  </button>
                </div>
              </div>
            ) : step === 'payment' ? (
              <form onSubmit={handleConfirm} noValidate className="space-y-4">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit booking details
                </button>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Step 2 of 2</p>
                  <h2 className="font-display text-lg font-bold text-slate-900">Pay the advance & confirm</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Transfer the advance to the account below and upload the slip, or choose to pay later.
                  </p>
                </div>
                <AuthAlert tone="error" message={errorMessage} />
                <BankTransferDetails
                  reference={reference}
                  total={estimatedTotal}
                  advance={advanceEstimate}
                  depositPercent={depositPercent}
                />
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100/70">
                  <input
                    type="checkbox"
                    checked={payLater}
                    onChange={(e) => {
                      setPayLater(e.target.checked);
                      setFieldErrors((current) => ({ ...current, slip: undefined, slipAmount: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/30"
                  />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">Pay later</span>
                    <span className="block text-[11px] text-slate-500">
                      Book now and upload the transfer slip later from <strong>My bookings</strong>. Your date is reserved once the advance is received.
                    </span>
                  </span>
                </label>
                {!payLater && (
                  <PaymentSlipField
                    file={slipFile}
                    onFileChange={(file) => {
                      setSlipFile(file);
                      setFieldErrors((current) => ({ ...current, slip: undefined }));
                    }}
                    amount={slipAmount}
                    onAmountChange={(value) => {
                      setSlipAmount(value);
                      setFieldErrors((current) => ({ ...current, slipAmount: undefined }));
                    }}
                    fileError={fieldErrors.slip}
                    amountError={fieldErrors.slipAmount}
                  />
                )}
                <AuthSubmit busy={isSubmitting} busyLabel={isAuthenticated ? 'Confirming booking…' : 'Creating account & confirming…'}>
                  <CalendarCheck className="h-4 w-4" /> Confirm booking
                </AuthSubmit>
                <p className="text-[11px] text-slate-500 text-center">
                  Your date is reserved once our team has checked the payment.
                </p>
              </form>
            ) : authLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
            ) : isAuthenticated && user ? (
              <form onSubmit={handleSignedIn} noValidate className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Step 1 of 2</p>
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
                    <AuthSubmit busy={isSubmitting} busyLabel="Checking…">
                      <Wallet className="h-4 w-4" /> Continue to payment
                    </AuthSubmit>
                  </>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700">Step 1 of 2</p>
                  <h2 className="font-display text-lg font-bold text-slate-900">Book online</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in to your account or create one to save and follow your booking.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {([
                    ['create', 'Create account'],
                    ['login', 'Sign in'],
                    ['recover', 'Recover account'],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAccountMode(mode);
                        setErrorMessage(null);
                        setRecoveryMessage('');
                      }}
                      className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                        accountMode === mode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <AuthAlert tone="error" message={errorMessage} />
                {recoveryMessage && (
                  <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    {recoveryMessage}
                  </p>
                )}
                {accountMode === 'create' && (
                  <form onSubmit={handleNewCustomer} noValidate className="space-y-4">
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
                    <AuthSubmit busy={isSubmitting} busyLabel="Checking your details…">
                      <ShieldCheck className="h-4 w-4" /> Continue to payment
                    </AuthSubmit>
                  </form>
                )}
                {accountMode === 'login' && (
                  <form onSubmit={handleExistingLogin} noValidate className="space-y-4">
                    <AuthField
                      label="Account email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      icon={<Mail className="h-4 w-4" />}
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      error={fieldErrors.email}
                    />
                    <PasswordField
                      label="Password"
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      error={fieldErrors.password}
                    />
                    <button type="button" onClick={() => onNavigate('/forgot-password')} className="text-xs font-semibold text-blue-700 underline-offset-4 hover:underline">
                      Forgot password?
                    </button>
                    <AuthSubmit busy={isSubmitting} busyLabel="Signing in…">
                      <LogIn className="h-4 w-4" /> Sign in and continue
                    </AuthSubmit>
                  </form>
                )}
                {accountMode === 'recover' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">
                      Verify the email, phone number, or NIC on your account. We will email a one-time code to the address registered with that account. The same confirmation is shown whether or not an account matches.
                    </p>
                    {!recoveryChallengeId ? (
                      <form onSubmit={handleStartRecovery} noValidate className="space-y-4">
                        <AuthField
                          label="Email, phone number, or NIC"
                          autoComplete="off"
                          icon={<ShieldCheck className="h-4 w-4" />}
                          placeholder="Enter one account detail"
                          value={recoveryIdentifier}
                          onChange={(e) => setRecoveryIdentifier(e.target.value)}
                        />
                        <AuthSubmit busy={isSubmitting} busyLabel="Checking securely…">
                          Send verification code
                        </AuthSubmit>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyRecovery} noValidate className="space-y-4">
                        <AuthField
                          label="8-digit email verification code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={8}
                          icon={<ShieldCheck className="h-4 w-4" />}
                          placeholder="Enter the code"
                          value={recoveryCode}
                          onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        />
                        <AuthSubmit busy={isSubmitting} busyLabel="Verifying code…">
                          Verify and continue to sign in
                        </AuthSubmit>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            setRecoveryChallengeId('');
                            setRecoveryMessage('');
                          }}
                          className="w-full text-xs font-semibold text-blue-700 underline-offset-4 hover:underline disabled:opacity-50"
                        >
                          Request another code
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
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
            aria-invalid={errors.quantity ? true : undefined}
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
        aria-invalid={error ? true : undefined}
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

/**
 * The account to pay the advance into, with copy buttons. The advance is an
 * estimate from the booking deposit rate (Admin → Settings → Commerce) until
 * our team confirms the final price.
 */
const BankTransferDetails: React.FC<{ reference: string; total: number; advance: number; depositPercent: number }> = ({
  reference,
  total,
  advance,
  depositPercent,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked: the value is still visible to copy by hand.
    }
  };
  const rows: Array<[string, string, boolean]> = (
    [
      ['Account name', BANK_DETAILS.accountName, true],
      ['Bank', BANK_DETAILS.bankName, false],
      ['Branch', BANK_DETAILS.branch, false],
      ['Account number', BANK_DETAILS.accountNumber, true],
      ['Payment reference', reference, true],
    ] as Array<[string, string, boolean]>
  ).filter(([, value]) => value);

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 overflow-hidden text-xs">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-blue-100 bg-white/60">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Building2 className="h-4 w-4 text-blue-600" /> Bank transfer
        </div>
        {advance > 0 && (
          <div className="text-right">
            <div className="text-[10px] text-slate-500">Advance ({depositPercent}%)</div>
            <div className="font-mono text-base font-bold text-[#0052FF]">{formatCurrency(advance, 'LKR')}</div>
          </div>
        )}
      </div>
      <div className="divide-y divide-blue-100/70">
        {rows.map(([label, value, copyable]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-slate-500">{label}</span>
            <span className="flex items-center gap-1.5 min-w-0">
              <strong className="text-slate-900 font-mono text-right break-all">{value}</strong>
              {copyable && (
                <button
                  type="button"
                  onClick={() => void copy(label, value)}
                  className="p-1 text-slate-400 hover:text-slate-700 shrink-0"
                  aria-label={`Copy ${label.toLowerCase()}`}
                >
                  {copied === label ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="px-4 py-3 text-slate-600 border-t border-blue-100">
        {advance > 0
          ? `Total ${formatCurrency(total, 'LKR')}. Pay at least the advance now; the balance is paid before your date.`
          : 'The price is on quotation. If you have agreed an advance with our team, pay it now; otherwise you can upload the slip later from My bookings.'}{' '}
        Use <strong className="font-mono">{reference}</strong> as the payment reference.
      </p>
    </div>
  );
};
