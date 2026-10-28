import {
  Booking,
  BookableServiceItem,
  BookingSubmissionInput,
  BookingValidationResult,
  BookingStatus,
  PaymentStatus,
  BookingType,
  BookingPaymentRecord,
  BookingLineItem,
  BookingCustomerUpdate,
  BookingPaymentSlip,
} from '../types/booking';
import { FirestoreService, FirestoreBooking } from '../types/firestore';
import { notificationService } from './notificationService';
import { firestoreBookingsService } from './firestore/bookings';
import { auth, db } from '../lib/firebase';
import { doc, deleteDoc } from '../lib/tursoFirestore';
import { formatCurrency } from '../utils/currency';

export function mapFirestoreBookingToUniversal(fb: any): Booking {
  const rawCustomer = fb.customer || {};
  const customerFullName =
    rawCustomer.fullName ||
    rawCustomer.name ||
    fb.customerName ||
    'Valued Client';
  // contactEmail: the customer's sign-in email before they verify it (set by the server).
  const customerEmail = (rawCustomer.email || fb.customerEmail || fb.contactEmail || '').toLowerCase();
  const customerPhone = rawCustomer.phone || fb.customerPhone || '';
  const customerCompany = rawCustomer.company || fb.company;
  const preferredContact = rawCustomer.preferredContactMethod || rawCustomer.preferredContact || 'whatsapp';

  const rawLocation = fb.location || {};
  const locationAddress =
    typeof rawLocation === 'string'
      ? rawLocation
      : rawLocation.address || rawLocation.venueName || rawLocation.city || 'Colombo, Sri Lanka';
  const locationVenue = typeof rawLocation === 'object' ? rawLocation.venueName : undefined;
  const locationCity = typeof rawLocation === 'object' ? rawLocation.city : undefined;
  const locationType = typeof rawLocation === 'object' && rawLocation.type ? rawLocation.type : 'venue';

  const date = fb.date || fb.bookingDate || fb.eventDate || (fb.createdAt ? fb.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
  const time = fb.time || fb.bookingTime || fb.slot || '09:00 AM - 12:00 PM';
  const price = Number(fb.price ?? fb.amount ?? 0);
  const currency = fb.currency || 'LKR';
  const status: BookingStatus = fb.status || 'pending';
  const paymentStatus: PaymentStatus = fb.paymentStatus || 'unpaid';

  return {
    id: fb.id,
    customerId: fb.customerId || `CUST-${fb.id}`,
    divisionId: fb.divisionId || 'sws',
    divisionName: fb.divisionName || 'SWS Event Management',
    bookingType: fb.bookingType || 'event',
    serviceId: fb.serviceId || 'srv-general',
    serviceName: fb.serviceName || fb.serviceTitle || 'General Service Booking',
    serviceSku: fb.serviceSku,
    serviceImageUrl: fb.serviceImageUrl,
    packageId: fb.packageId || 'pkg-standard',
    packageName: fb.packageName || 'Standard Package',
    packageSku: fb.packageSku,
    date,
    time,
    location: {
      type: locationType,
      address: locationAddress,
      city: locationCity,
      venueName: locationVenue,
    },
    customer: {
      fullName: customerFullName,
      email: customerEmail,
      phone: customerPhone,
      company: customerCompany,
      preferredContactMethod: preferredContact,
    },
    notes: fb.notes || fb.customerNotes || '',
    adminNotes: fb.adminNotes,
    price,
    currency,
    paymentStatus,
    status,
    createdAt: fb.createdAt || new Date().toISOString(),
    updatedAt: fb.updatedAt || new Date().toISOString(),
    cancellationReason: fb.cancellationReason,
    rejectionReason: fb.rejectionReason,
    source: fb.source,
    itemKind: fb.itemKind,
    confirmationId: fb.confirmationId,
    designTitle: fb.designTitle,
    designImages: Array.isArray(fb.designImages) ? fb.designImages : undefined,
    lineItems: Array.isArray(fb.lineItems) ? fb.lineItems : undefined,
    subtotal: fb.subtotal,
    discount: fb.discount,
    deliveryFee: fb.deliveryFee,
    advanceAmount: fb.advanceAmount,
    amountPaid: fb.amountPaid,
    payments: Array.isArray(fb.payments) ? fb.payments : undefined,
    paymentSlips: Array.isArray(fb.paymentSlips) ? fb.paymentSlips : undefined,
    invoiceNumber: fb.invoiceNumber,
    termsNotes: fb.termsNotes,
    customerUpdates: Array.isArray(fb.customerUpdates) ? fb.customerUpdates : undefined,
  };
}

function formatBookingDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** What the customer is told when the admin moves their booking to a step. */
const STATUS_MESSAGES: Record<BookingStatus, (booking: Booking, reason?: string) => { title: string; message: string }> = {
  pending: (b) => ({ title: 'Booking under review', message: `Your booking for ${b.serviceName} is being reviewed by our team.` }),
  confirmed: (b) => ({ title: 'Booking confirmed', message: `We have confirmed your booking for ${b.serviceName} on ${formatBookingDate(b.date)}.` }),
  scheduled: (b) => ({ title: 'Booking scheduled', message: `Your booking for ${b.serviceName} is scheduled for ${formatBookingDate(b.date)}${b.time ? ` (${b.time})` : ''}.` }),
  in_progress: (b) => ({ title: 'Work has started', message: `Our team has started work on your booking for ${b.serviceName}.` }),
  completed: (b) => ({ title: 'Booking completed', message: `Your booking for ${b.serviceName} is complete. Thank you for choosing Mahdev.` }),
  cancelled: (b, reason) => ({ title: 'Booking cancelled', message: `Your booking for ${b.serviceName} was cancelled.${reason ? ` Reason: ${reason}` : ''}` }),
  rejected: (b, reason) => ({ title: 'Booking not available', message: `We could not accept your booking for ${b.serviceName}.${reason ? ` Reason: ${reason}` : ''}` }),
};

/** Payment status implied by what has been paid against the total. */
export function paymentStatusFor(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return 'unpaid';
  return paid >= total - 0.005 ? 'paid' : 'deposit_paid';
}

/** New "Book online" reference; shown to the customer before the booking is saved. */
export function newBookingReference(): string {
  return `BK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export const MAX_PAYMENT_SLIP_BYTES = 10 * 1024 * 1024;
export const PAYMENT_SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Why a chosen slip file cannot be uploaded, or null when it is fine. */
export function paymentSlipFileError(file: File): string | null {
  if (!PAYMENT_SLIP_TYPES.includes(file.type)) return 'Upload the slip as a JPG, PNG, WebP image or a PDF.';
  if (!file.size || file.size > MAX_PAYMENT_SLIP_BYTES) return 'The slip must be no larger than 10 MB.';
  return null;
}

/** Admin-only address of an uploaded slip (opens in the browser). */
export function paymentSlipUrl(bookingId: string, slipId: string): string {
  return `/api/bookings/slip?id=${encodeURIComponent(bookingId)}&slip=${encodeURIComponent(slipId)}`;
}

/**
 * Uploads a bank transfer slip to the signed-in customer's own booking. The
 * server checks the file and adds it to the booking for the admin to review.
 */
export async function uploadPaymentSlip(bookingId: string, file: File, amount: number): Promise<BookingPaymentSlip> {
  const problem = paymentSlipFileError(file);
  if (problem) throw new Error(problem);
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to upload your slip.');

  const response = await fetch(
    `/api/bookings/slip?id=${encodeURIComponent(bookingId)}&amount=${encodeURIComponent(String(amount))}`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': file.type,
        'X-Slip-Filename': encodeURIComponent(file.name),
      },
      body: file,
    }
  );
  const result = (await response.json().catch(() => ({}))) as { success?: boolean; slip?: BookingPaymentSlip; error?: string };
  if (!response.ok || !result.success || !result.slip) {
    throw new Error(result.error || `The slip could not be uploaded (HTTP ${response.status}).`);
  }
  return result.slip;
}

export function mapFirestoreServiceToBookable(fs: FirestoreService): BookableServiceItem {
  const meta = (fs.metadata || {}) as any;
  const divId = (fs.divisionId || fs.division || 'sws') as any;
  const divName =
    divId === 'sws'
      ? 'SWS Event Management'
      : divId === 'u1'
      ? 'U1 Studio'
      : divId === 'it'
      ? 'Mahdev IT & Solutions'
      : divId === 'travels'
      ? 'Mahdev Travels'
      : 'Mahdev Online Mart';

  return {
    id: fs.id,
    sku: meta.sku || `SRV-${fs.id.toUpperCase().slice(0, 8)}`,
    name: fs.name,
    bookingType: (meta.bookingType as any) || 'event',
    divisionId: (['sws', 'u1', 'travels', 'it', 'consulting'].includes(divId) ? divId : 'other') as any,
    divisionName: divName,
    description: fs.description || '',
    imageUrl: fs.imageUrl || (fs.images && fs.images[0]) || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    locationTypeDefault: meta.locationTypeDefault || 'venue',
    availableTimeSlots: meta.availableTimeSlots && meta.availableTimeSlots.length > 0
      ? meta.availableTimeSlots
      : ['09:00 AM - 12:00 PM', '01:00 PM - 04:00 PM', '05:00 PM - 08:00 PM'],
    maxBookingsPerDay: meta.maxBookingsPerDay || 5,
    packages: meta.packages && meta.packages.length > 0
      ? meta.packages
      : [
          {
            id: `${fs.id}-standard`,
            name: 'Standard Package',
            description: fs.description || 'Comprehensive turnkey execution package',
            duration: meta.duration || 'Full Session',
            price: fs.price || 0,
            currency: fs.currency || 'LKR',
            features: ['Professional consultation', 'Execution SLA', 'Dedicated management'],
          },
        ],
    leadTimeDays: meta.leadTimeDays || 1,
  };
}

class UniversalBookingService {
  private services: BookableServiceItem[] = [];
  private bookings: Booking[] = [];
  private subscribers: Set<(bookings: Booking[]) => void> = new Set();

  public subscribe(callback: (bookings: Booking[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const list = this.getAllBookings();
    this.subscribers.forEach((cb) => {
      try {
        cb(list);
      } catch (err) {
        console.warn('[BookingService] Subscriber callback error:', err);
      }
    });
  }

  public syncRemoteBookings(remoteDocs: any[]): void {
    if (!Array.isArray(remoteDocs)) return;
    const mapped = remoteDocs.map(mapFirestoreBookingToUniversal);
    const map = new Map<string, Booking>();
    // Start with existing
    for (const b of this.bookings) {
      map.set(b.id, b);
    }
    // Remote documents update or add
    for (const b of mapped) {
      map.set(b.id, b);
    }
    this.bookings = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    this.saveToStorage();
    this.notifySubscribers();
  }

  public async refreshFromFirestore(): Promise<Booking[]> {
    try {
      const remote = await firestoreBookingsService.getAllBookings();
      this.syncRemoteBookings(remote);
      return this.getAllBookings();
    } catch (e) {
      console.warn('[BookingService] refreshFromFirestore error:', e);
      return this.getAllBookings();
    }
  }

  public setBookings(bookings: Booking[]): void {
    this.bookings = bookings;
    this.saveToStorage();
    this.notifySubscribers();
  }

  public syncWithFirestore(firestoreServices: FirestoreService[]): void {
    if (Array.isArray(firestoreServices)) {
      this.services = firestoreServices.map(mapFirestoreServiceToBookable);
    }
  }

  private saveToStorage(): void {
    // Bookings are synchronized through Turso, not browser storage.
  }

  // ----------------------------------------------------
  // SERVICE CATALOG LOOKUPS
  // ----------------------------------------------------
  public getServices(filter?: { divisionId?: string; bookingType?: BookingType }): BookableServiceItem[] {
    let result = [...this.services];
    if (filter?.divisionId && filter.divisionId !== 'all') {
      result = result.filter((s) => s.divisionId === filter.divisionId);
    }
    if (filter?.bookingType && filter.bookingType !== 'other' && filter.bookingType as any !== 'all') {
      result = result.filter((s) => s.bookingType === filter.bookingType);
    }
    return result;
  }

  public getServiceById(id: string): BookableServiceItem | undefined {
    return this.services.find((s) => s.id === id);
  }

  // ----------------------------------------------------
  // REAL-TIME AVAILABILITY & CAPACITY CHECK
  // ----------------------------------------------------
  public checkServiceAvailability(
    serviceId: string,
    dateString: string
  ): { available: boolean; remainingSlots: number; maxPerDay: number; reason?: string } {
    const service = this.getServiceById(serviceId);
    if (!service) {
      return { available: false, remainingSlots: 0, maxPerDay: 0, reason: 'Service not found.' };
    }

    // Check if date is in the past
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return {
        available: false,
        remainingSlots: 0,
        maxPerDay: service.maxBookingsPerDay,
        reason: 'Selected date cannot be in the past.',
      };
    }

    // Calculate occupied active bookings (pending, confirmed, scheduled, in_progress)
    const activeBookingsOnDate = this.bookings.filter(
      (b) =>
        b.serviceId === serviceId &&
        b.date === dateString &&
        ['pending', 'confirmed', 'scheduled', 'in_progress'].includes(b.status)
    );

    const remainingSlots = Math.max(0, service.maxBookingsPerDay - activeBookingsOnDate.length);

    if (remainingSlots <= 0) {
      return {
        available: false,
        remainingSlots: 0,
        maxPerDay: service.maxBookingsPerDay,
        reason: `Maximum daily booking limit (${service.maxBookingsPerDay} sessions) reached for this date.`,
      };
    }

    return {
      available: true,
      remainingSlots,
      maxPerDay: service.maxBookingsPerDay,
    };
  }

  // ----------------------------------------------------
  // RIGOROUS INPUT VALIDATION
  // ----------------------------------------------------
  public validateBookingInput(input: BookingSubmissionInput): BookingValidationResult {
    const errors: Record<string, string> = {};

    // 1. Service & Package validation
    if (!input.serviceId) {
      errors.serviceId = 'Please select a valid Mahdev service.';
    } else {
      const service = this.getServiceById(input.serviceId);
      if (!service) {
        errors.serviceId = 'The selected service does not exist in our catalog.';
      } else {
        if (!input.packageId) {
          errors.packageId = 'Please select a package tier for this service.';
        } else {
          const pkg = service.packages.find((p) => p.id === input.packageId);
          if (!pkg) {
            errors.packageId = 'The selected package is invalid for this service.';
          }
        }
      }
    }

    // 2. Date validation
    if (!input.date) {
      errors.date = 'Booking date is required.';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input.date)) {
        errors.date = 'Invalid date format (must be YYYY-MM-DD).';
      } else {
        const selected = new Date(input.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);

        if (isNaN(selected.getTime())) {
          errors.date = 'Invalid date provided.';
        } else if (selected < today) {
          errors.date = 'Booking date cannot be in the past.';
        } else if (input.serviceId) {
          // Check availability
          const availability = this.checkServiceAvailability(input.serviceId, input.date);
          if (!availability.available) {
            errors.date = availability.reason || 'This date is unavailable for booking.';
          }
        }
      }
    }

    // 3. Time Slot validation
    if (!input.time || !input.time.trim()) {
      errors.time = 'Please select an available time window.';
    }

    // 4. Location validation
    if (!input.location) {
      errors.location = 'Location details are required.';
    } else {
      if (!input.location.type) {
        errors['location.type'] = 'Location type must be specified.';
      }
      if (input.location.type !== 'remote_online') {
        if (!input.location.address || input.location.address.trim().length < 4) {
          errors['location.address'] = 'Please enter a valid venue or physical address (min 4 characters).';
        }
      }
    }

    // 5. Customer Details validation
    if (!input.customer) {
      errors.customer = 'Customer contact details are required.';
    } else {
      // Full Name
      if (!input.customer.fullName || input.customer.fullName.trim().length < 2) {
        errors['customer.fullName'] = 'Full name is required (at least 2 characters).';
      }

      // Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!input.customer.email || !emailRegex.test(input.customer.email.trim())) {
        errors['customer.email'] = 'A valid email address is required for booking confirmations.';
      }

      // Phone
      const phoneCleaned = input.customer.phone ? input.customer.phone.replace(/[\s\-\(\)\+]/g, '') : '';
      if (!input.customer.phone || phoneCleaned.length < 7 || phoneCleaned.length > 15) {
        errors['customer.phone'] = 'A valid phone or WhatsApp number is required (7-15 digits).';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // ----------------------------------------------------
  // BOOKING CREATION
  // ----------------------------------------------------
  public createBooking(input: BookingSubmissionInput): { success: boolean; booking?: Booking; errors?: Record<string, string> } {
    const validation = this.validateBookingInput(input);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const service = this.getServiceById(input.serviceId)!;
    const pkg = service.packages.find((p) => p.id === input.packageId)!;

    // Generate Unique ID: BK-YYYY-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const currentYear = new Date().getFullYear();
    const bookingId = `BK-${currentYear}-${randomSuffix}`;
    const customerId = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;

    const nowIso = new Date().toISOString();

    const newBooking: Booking = {
      id: bookingId,
      customerId,
      divisionId: service.divisionId,
      divisionName: service.divisionName,
      bookingType: service.bookingType,
      serviceId: service.id,
      serviceName: service.name,
      packageId: pkg.id,
      packageName: pkg.name,
      date: input.date,
      time: input.time,
      location: {
        type: input.location.type,
        address: input.location.type === 'remote_online' ? 'Secure High-Definition Video Link' : input.location.address,
        city: input.location.city,
        venueName: input.location.venueName,
      },
      customer: {
        fullName: input.customer.fullName.trim(),
        email: input.customer.email.trim().toLowerCase(),
        phone: input.customer.phone.trim(),
        company: input.customer.company?.trim(),
        preferredContactMethod: input.customer.preferredContactMethod || 'whatsapp',
      },
      notes: input.notes?.trim() || 'No additional notes provided.',
      price: pkg.price,
      currency: pkg.currency || 'LKR',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Prepend to bookings array
    this.bookings = [newBooking, ...this.bookings];
    this.saveToStorage();
    this.notifySubscribers();

    // Persist to Cloud Firestore bookings collection in realtime
    firestoreBookingsService
      .createBooking(newBooking as any)
      .catch((err) => console.warn('[BookingService] database booking create error:', err));

    // Trigger the non-blocking customer confirmation notification.
    notificationService.notifyBookingConfirmation(newBooking).catch(() => {});

    return { success: true, booking: newBooking };
  }

  /**
   * Saves a booking request made with "Book online". Unlike createBooking(), it
   * waits for the database so the customer sees an error if saving fails, and
   * picks a new reference if the generated one is already taken.
   */
  public async submitOnlineBooking(draft: Omit<Booking, 'id'>, preferredId?: string): Promise<Booking> {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; ; attempt++) {
      // The reference the customer already saw (and used on the transfer) is tried first.
      const booking: Booking = {
        ...draft,
        id: attempt === 1 && preferredId ? preferredId : newBookingReference(),
      };
      try {
        await firestoreBookingsService.createBooking(booking as any);
      } catch (err) {
        const taken = err instanceof Error && /already exists/i.test(err.message);
        if (taken && attempt < MAX_ATTEMPTS) continue;
        throw err;
      }

      this.bookings = [booking, ...this.bookings];
      this.saveToStorage();
      this.notifySubscribers();
      // Alert the team; the customer hears back once the booking is reviewed.
      notificationService.notifyAdminNewBooking(booking).catch(() => {});
      return booking;
    }
  }

  // ----------------------------------------------------
  // QUERY & LOOKUP
  // ----------------------------------------------------
  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find(
      (b) => b.id.toUpperCase() === id.trim().toUpperCase()
    );
  }

  public getBookingsByCustomerEmail(email: string): Booking[] {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return [];
    return this.bookings.filter(
      (b) => b.customer.email.trim().toLowerCase() === cleanEmail
    );
  }

  public getBookingsByCustomerId(customerId: string): Booking[] {
    const cleanId = customerId.trim().toUpperCase();
    if (!cleanId) return [];
    return this.bookings.filter(
      (b) => b.customerId.trim().toUpperCase() === cleanId
    );
  }

  public lookupBookingsByCustomer(searchQuery: string): Booking[] {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return this.bookings.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.customer.email.toLowerCase().includes(q) ||
        b.customer.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
        b.customer.fullName.toLowerCase().includes(q)
    );
  }

  public getAllBookings(filter?: {
    status?: BookingStatus;
    divisionId?: string;
    bookingType?: BookingType;
  }): Booking[] {
    let list = [...this.bookings];
    if (filter?.status) {
      list = list.filter((b) => b.status === filter.status);
    }
    if (filter?.divisionId && filter.divisionId !== 'all') {
      list = list.filter((b) => b.divisionId === filter.divisionId);
    }
    if (filter?.bookingType && filter.bookingType !== 'other' && (filter.bookingType as any) !== 'all') {
      list = list.filter((b) => b.bookingType === filter.bookingType);
    }
    return list;
  }

  // ----------------------------------------------------
  // ADMIN PREPARATION & STATUS OPERATIONS
  // ----------------------------------------------------
  public confirmBooking(id: string, adminNotes?: string): { success: boolean; booking?: Booking; error?: string } {
    return this.updateBookingStatus(id, 'confirmed', adminNotes);
  }

  public rejectBooking(id: string, reason: string): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = 'rejected';
    booking.rejectionReason = reason;
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database reject error:', err));

    return { success: true, booking };
  }

  public rescheduleBooking(
    id: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    // Check availability for new date
    const availability = this.checkServiceAvailability(booking.serviceId, newDate);
    if (!availability.available) {
      return { success: false, error: availability.reason || 'New date is unavailable.' };
    }

    booking.date = newDate;
    booking.time = newTime;
    booking.status = 'scheduled';
    if (reason) {
      booking.adminNotes = (booking.adminNotes ? `${booking.adminNotes}\n` : '') + `[Rescheduled]: ${reason}`;
    }
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        date: newDate,
        bookingDate: newDate,
        time: newTime,
        bookingTime: newTime,
        status: 'scheduled',
        ...(booking.adminNotes ? { adminNotes: booking.adminNotes } : {}),
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database reschedule error:', err));

    // Dispatch update notification
    notificationService.notifyBookingUpdate(booking, `Rescheduled to ${newDate} (${newTime})`).catch(() => {});

    return { success: true, booking };
  }

  public cancelBooking(id: string, reason: string): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database cancel error:', err));

    // Dispatch cancellation notification
    notificationService.notifyBookingCancellation(booking, reason).catch(() => {});

    return { success: true, booking };
  }

  public completeBooking(id: string, notes?: string): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = 'completed';
    if (notes) {
      booking.adminNotes = (booking.adminNotes ? `${booking.adminNotes}\n` : '') + `[Completed]: ${notes}`;
    }
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        status: 'completed',
        ...(booking.adminNotes ? { adminNotes: booking.adminNotes } : {}),
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database complete error:', err));

    return { success: true, booking };
  }

  public updatePaymentStatus(id: string, paymentStatus: PaymentStatus): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        paymentStatus,
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database payment update error:', err));

    return { success: true, booking };
  }

  /**
   * Replaces the advance amount and payment records of a booking, and derives the
   * amount paid and payment status from them (used for advance / balance tracking).
   */
  public async updateBookingPayments(
    id: string,
    changes: { advanceAmount?: number; payments?: BookingPaymentRecord[] },
    customerUpdate?: { title: string; message: string }
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const payments = changes.payments ?? booking.payments ?? [];
    const amountPaid = Math.round(payments.reduce((sum, payment) => sum + payment.amount, 0) * 100) / 100;
    if (amountPaid > booking.price + 0.005) {
      return { success: false, error: 'Payments cannot be more than the booking total.' };
    }
    const advanceAmount = changes.advanceAmount ?? booking.advanceAmount ?? 0;
    if (advanceAmount < 0 || advanceAmount > booking.price) {
      return { success: false, error: 'The advance must be between zero and the booking total.' };
    }
    return this.saveAdminChange(
      id,
      {
        advanceAmount,
        payments,
        amountPaid,
        paymentStatus: paymentStatusFor(booking.price, amountPaid),
      },
      customerUpdate
    );
  }

  // ----------------------------------------------------
  // ADMIN CHANGES (saved before the screen updates; the customer is told)
  // ----------------------------------------------------

  /**
   * Saves an admin change to the database first and only then updates this
   * browser, so a failed save is reported instead of silently undone on reload.
   * `customerUpdate` is added to the booking's Alerts in the customer's account.
   */
  private async saveAdminChange(
    id: string,
    updates: Partial<Booking>,
    customerUpdate?: { title: string; message: string }
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const now = new Date().toISOString();
    const customerUpdates: BookingCustomerUpdate[] | undefined = customerUpdate
      ? [
          ...(booking.customerUpdates || []),
          { id: `UPD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`, at: now, ...customerUpdate },
        ].slice(-50) // Keep the latest 50 so the record stays small.
      : undefined;
    const payload: Partial<Booking> = { ...updates, ...(customerUpdates ? { customerUpdates } : {}), updatedAt: now };

    try {
      await firestoreBookingsService.updateBooking(id, payload as any);
    } catch (err) {
      console.warn('[BookingService] Admin booking update failed:', err);
      return { success: false, error: err instanceof Error ? err.message : 'The change could not be saved. Please try again.' };
    }
    Object.assign(booking, payload);
    this.saveToStorage();
    this.notifySubscribers();
    return { success: true, booking };
  }

  /**
   * Accepts a customer's transfer slip: records it as a bank transfer payment
   * (advance first, then balance) and confirms a booking that is still pending.
   * Rejecting keeps the slip on record with the reason, which the customer sees.
   */
  public async adminReviewPaymentSlip(
    id: string,
    slipId: string,
    decision: { accept: true; amount: number; reviewedBy: string } | { accept: false; reason: string; reviewedBy: string }
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    const slip = booking.paymentSlips?.find((entry) => entry.id === slipId);
    if (!slip) return { success: false, error: 'Slip not found. Refresh the bookings and try again.' };
    if (slip.status !== 'submitted') return { success: false, error: 'This slip has already been reviewed.' };

    const now = new Date().toISOString();
    const currency = booking.currency || 'LKR';
    const reviewed = { reviewedAt: now, reviewedBy: decision.reviewedBy };

    if ('reason' in decision) {
      const reason = decision.reason.trim();
      if (!reason) return { success: false, error: 'Give a reason so the customer knows what to fix.' };
      return this.saveAdminChange(
        id,
        {
          paymentSlips: booking.paymentSlips!.map((entry) =>
            entry.id === slipId ? { ...entry, ...reviewed, status: 'rejected' as const, reviewNote: reason } : entry
          ),
        },
        {
          title: 'Payment slip not accepted',
          message: `We could not accept your transfer slip of ${formatCurrency(slip.amount, currency)} for ${booking.serviceName}. ${reason}`,
        }
      );
    }

    const round = (value: number) => Math.round(value * 100) / 100;
    const amount = round('amount' in decision ? decision.amount : 0);
    const payments = booking.payments || [];
    const paidSoFar = booking.amountPaid || 0;
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'Enter the amount received.' };
    // An "on quotation" booking has no total yet; set the charges first.
    if (booking.price <= 0) return { success: false, error: 'Set the booking charges (total) before accepting a payment.' };
    if (paidSoFar + amount > booking.price + 0.005) {
      return { success: false, error: `Only ${formatCurrency(Math.max(0, booking.price - paidSoFar), currency)} is outstanding on this booking.` };
    }

    const payment: BookingPaymentRecord = {
      id: `PAY-${Date.now().toString(36).toUpperCase()}`,
      kind: paidSoFar <= 0 ? 'advance' : 'balance',
      amount,
      method: 'Bank transfer',
      note: `Slip ${slip.id}`,
      paidAt: slip.uploadedAt.slice(0, 10),
      recordedBy: decision.reviewedBy,
    };
    const amountPaid = round(paidSoFar + amount);
    const confirm = booking.status === 'pending';
    return this.saveAdminChange(
      id,
      {
        payments: [...payments, payment],
        amountPaid,
        paymentStatus: paymentStatusFor(booking.price, amountPaid),
        // The first accepted transfer becomes the advance when none was set.
        ...(booking.advanceAmount ? {} : { advanceAmount: Math.min(amount, booking.price) }),
        paymentSlips: booking.paymentSlips!.map((entry) =>
          entry.id === slipId ? { ...entry, ...reviewed, status: 'accepted' as const, paymentId: payment.id } : entry
        ),
        ...(confirm ? { status: 'confirmed' as BookingStatus } : {}),
      },
      confirm
        ? {
            title: 'Payment received, booking confirmed',
            message: `We received your payment of ${formatCurrency(amount, currency)} and confirmed your booking for ${booking.serviceName} on ${formatBookingDate(booking.date)}.`,
          }
        : {
            title: 'Payment received',
            message: `We received your payment of ${formatCurrency(amount, currency)} for ${booking.serviceName}. Thank you.`,
          }
    );
  }

  /** Moves a booking to any step of the process (or cancels / rejects it). */
  public async adminSetStatus(
    id: string,
    status: BookingStatus,
    options: { reason?: string; adminNote?: string } = {}
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (booking.status === status) return { success: true, booking };

    const reason = options.reason?.trim();
    const adminNotes = options.adminNote
      ? (booking.adminNotes ? `${booking.adminNotes}
` : '') + options.adminNote
      : undefined;
    const message = STATUS_MESSAGES[status](booking, reason);
    return this.saveAdminChange(
      id,
      {
        status,
        ...(status === 'cancelled' && reason ? { cancellationReason: reason } : {}),
        ...(status === 'rejected' && reason ? { rejectionReason: reason } : {}),
        ...(adminNotes ? { adminNotes } : {}),
      },
      message
    );
  }

  /** New date and time chosen by the admin (no availability limits: the admin decides). */
  public async adminReschedule(
    id: string,
    date: string,
    time: string,
    reason?: string
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: 'Choose a valid date.' };

    const note = reason?.trim();
    return this.saveAdminChange(
      id,
      {
        date,
        bookingDate: date,
        time,
        bookingTime: time,
        ...(booking.status === 'pending' || booking.status === 'confirmed' ? { status: 'scheduled' as BookingStatus } : {}),
        ...(note ? { adminNotes: (booking.adminNotes ? `${booking.adminNotes}\n` : '') + `[Rescheduled]: ${note}` } : {}),
      } as Partial<Booking>,
      {
        title: 'Booking date changed',
        message: `Your booking for ${booking.serviceName} is now on ${formatBookingDate(date)}${time ? ` (${time})` : ''}.${note ? ` ${note}` : ''}`,
      }
    );
  }

  /**
   * Replaces the charges: invoice lines, discount and transport / delivery fee.
   * The total becomes subtotal - discount + delivery fee, and the payment status
   * is worked out again from what has already been paid.
   */
  public async adminUpdateCharges(
    id: string,
    charges: { lineItems: BookingLineItem[]; discount: number; deliveryFee: number; note?: string }
  ): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const round = (value: number) => Math.round(value * 100) / 100;
    const lineItems = charges.lineItems
      .map((item) => ({
        name: item.name.trim(),
        description: (item.description || '').trim(),
        quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
        unitPrice: round(Math.max(0, Number(item.unitPrice) || 0)),
      }))
      .filter((item) => item.name && item.quantity > 0);
    if (lineItems.length === 0) return { success: false, error: 'Add at least one item with a name and quantity.' };

    const subtotal = round(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const discount = round(Math.max(0, Number(charges.discount) || 0));
    const deliveryFee = round(Math.max(0, Number(charges.deliveryFee) || 0));
    if (discount > subtotal) return { success: false, error: 'The discount cannot be more than the items subtotal.' };
    const price = round(subtotal - discount + deliveryFee);
    const amountPaid = booking.amountPaid || 0;
    if (price + 0.005 < amountPaid) {
      return { success: false, error: `The total cannot be less than the ${formatCurrency(amountPaid)} already paid.` };
    }
    if ((booking.advanceAmount || 0) > price) {
      return { success: false, error: 'The total cannot be less than the advance. Lower the advance first.' };
    }

    const note = charges.note?.trim();
    return this.saveAdminChange(
      id,
      { lineItems, subtotal, discount, deliveryFee, price, paymentStatus: paymentStatusFor(price, amountPaid) },
      {
        title: 'Booking charges updated',
        message: `The total for ${booking.serviceName} is now ${formatCurrency(price)}${deliveryFee > 0 ? ` (including ${formatCurrency(deliveryFee)} transport / delivery)` : ''}.${note ? ` ${note}` : ''}`,
      }
    );
  }

  public updateBookingStatus(
    id: string,
    status: BookingStatus,
    adminNotes?: string
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.status = status;
    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.notifySubscribers();

    firestoreBookingsService
      .updateBooking(id, {
        status,
        ...(adminNotes ? { adminNotes } : {}),
        updatedAt: booking.updatedAt,
      } as any)
      .catch((err) => console.warn('[BookingService] database status update error:', err));

    return { success: true, booking };
  }

  public async deleteBooking(id: string): Promise<{ success: boolean; error?: string }> {
    const cleanId = id.trim();
    const index = this.bookings.findIndex((b) => b.id.toLowerCase() === cleanId.toLowerCase());
    if (index !== -1) {
      this.bookings.splice(index, 1);
      this.saveToStorage();
      this.notifySubscribers();
    }
    try {
      await firestoreBookingsService.deleteBooking(cleanId);
    } catch (e) {
      console.warn(`[BookingService] database booking delete error for ${cleanId}:`, e);
    }
    return { success: true };
  }

  public async clearAllTestBookings(): Promise<{ removedCount: number }> {
    const initialCount = this.bookings.length;
    const testEmails = ['test', 'example.com', 'fake', 'dummy'];
    const genuine = this.bookings.filter((b) => {
      if (typeof b.id === 'string' && (b.id.startsWith('TEST-') || b.id.startsWith('FAKE-') || b.id.startsWith('DEMO-'))) return false;
      const email = (b.customer?.email || '').toLowerCase();
      const name = (b.customer?.fullName || '').toLowerCase();
      if (testEmails.some((t) => email.includes(t) || name.includes(t))) return false;
      return true;
    });

    const removed = this.bookings.filter((b) => !genuine.includes(b));
    for (const b of removed) {
      try {
        await firestoreBookingsService.deleteBooking(b.id);
      } catch {}
    }

    this.bookings = genuine;
    this.saveToStorage();
    this.notifySubscribers();
    return { removedCount: initialCount - genuine.length };
  }
}

export const bookingService = new UniversalBookingService();
