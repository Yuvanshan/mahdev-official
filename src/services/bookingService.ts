import {
  Booking,
  BookableServiceItem,
  BookingSubmissionInput,
  BookingValidationResult,
  BookingStatus,
  PaymentStatus,
  BookingType,
} from '../types/booking';
import { MASTER_BOOKABLE_SERVICES } from '../data/bookingServices';
import { notificationService } from './notificationService';

const STORAGE_KEY = 'mahdev_bookings_store_v1';

// Seed sample initial bookings for demonstration & testing
const INITIAL_SEED_BOOKINGS: Booking[] = [
  {
    id: 'BK-2026-1042',
    customerId: 'CUST-8821',
    divisionId: 'sws',
    divisionName: 'SWS Event Management',
    bookingType: 'event',
    serviceId: 'sws-royal-mandap-decor',
    serviceName: 'SWS Luxury Mandap & Ceremonial Stage Production',
    packageId: 'pkg-mandap-gold',
    packageName: 'Imperial Grand Palace Mandap',
    date: '2026-09-15',
    time: 'Full Day Production (08:00 AM - 11:00 PM)',
    location: {
      type: 'venue',
      address: 'Shangri-La Ballroom, Galle Face Center Road',
      city: 'Colombo 03',
      venueName: 'Shangri-La Hotel Colombo',
    },
    customer: {
      fullName: 'Aarav Jayasinghe',
      email: 'aarav.j@gmail.com',
      phone: '+94 77 123 4567',
      company: 'Jayasinghe Holdings',
      preferredContactMethod: 'whatsapp',
    },
    notes: 'Require low-fog dry ice machine for grand entrance at 7:00 PM sharp.',
    price: 3200,
    currency: 'USD',
    paymentStatus: 'deposit_paid',
    status: 'confirmed',
    createdAt: '2026-08-10T10:30:00.000Z',
    updatedAt: '2026-08-11T14:20:00.000Z',
    adminNotes: 'Assigned Senior Event Lead Niluka. Deposit of $1,000 received via Wire.',
  },
  {
    id: 'BK-2026-1088',
    customerId: 'CUST-3910',
    divisionId: 'u1',
    divisionName: 'U1 Studio',
    bookingType: 'photography',
    serviceId: 'u1-pre-wedding-cinematic-session',
    serviceName: 'U1 Cinema Pre-Wedding Scenic Love-Story Shoot',
    packageId: 'pkg-u1-pre-classic',
    packageName: 'Artisan Story Session (1 Day / 2 Locations)',
    date: '2026-08-28',
    time: 'Sunrise Golden Hour (05:30 AM - 11:30 AM)',
    location: {
      type: 'travel_destination',
      address: 'Little Adam’s Peak & Nine Arches Bridge',
      city: 'Ella',
      venueName: 'Ella Heritage Hilltop',
    },
    customer: {
      fullName: 'Elena Rostova',
      email: 'elena.rostova@creative.co',
      phone: '+44 7911 123456',
      preferredContactMethod: 'email',
    },
    notes: 'Drone permits required for aerial flyover near tea estate bungalows.',
    price: 850,
    currency: 'USD',
    paymentStatus: 'paid',
    status: 'scheduled',
    createdAt: '2026-08-14T09:15:00.000Z',
    updatedAt: '2026-08-15T11:00:00.000Z',
  },
  {
    id: 'BK-2026-1120',
    customerId: 'CUST-5519',
    divisionId: 'travels',
    divisionName: 'Mahdev Travels',
    bookingType: 'travel',
    serviceId: 'travels-yala-vip-safari',
    serviceName: 'Yala National Park VIP Private Leopard Safari',
    packageId: 'pkg-trv-safari-full',
    packageName: 'Full Day Wilderness Immersion',
    date: '2026-09-02',
    time: 'Full-Day Deep Wilderness Safari (05:30 AM - 06:00 PM)',
    location: {
      type: 'travel_destination',
      address: 'Yala National Park Gate, Tissamaharama',
      city: 'Hambantota',
      venueName: 'Cinnamon Wild Resort Pickup',
    },
    customer: {
      fullName: 'Dr. Marcus Vance',
      email: 'marcus.vance@stanford.edu',
      phone: '+1 415 555 0192',
      preferredContactMethod: 'whatsapp',
    },
    notes: '2 adults and 2 children. Please prepare 2 vegetarian breakfast baskets.',
    price: 305,
    currency: 'USD',
    paymentStatus: 'paid',
    status: 'confirmed',
    createdAt: '2026-08-16T14:45:00.000Z',
    updatedAt: '2026-08-16T16:00:00.000Z',
  },
];

class UniversalBookingService {
  private services: BookableServiceItem[] = [...MASTER_BOOKABLE_SERVICES];
  private bookings: Booking[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.bookings = JSON.parse(stored);
      } else {
        this.bookings = [...INITIAL_SEED_BOOKINGS];
        this.saveToStorage();
      }
    } catch {
      this.bookings = [...INITIAL_SEED_BOOKINGS];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bookings));
    } catch (e) {
      console.error('Failed to persist bookings to localStorage', e);
    }
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
      currency: pkg.currency || 'USD',
      paymentStatus: 'unpaid',
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Prepend to bookings array
    this.bookings = [newBooking, ...this.bookings];
    this.saveToStorage();

    // Trigger non-blocking customer confirmation email and admin alert
    notificationService.notifyBookingConfirmation(newBooking).catch(() => {});
    notificationService.notifyAdminNewBooking(newBooking).catch(() => {});

    return { success: true, booking: newBooking };
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
    return { success: true, booking };
  }

  public updatePaymentStatus(id: string, paymentStatus: PaymentStatus): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.getBookingById(id);
    if (!booking) return { success: false, error: 'Booking not found.' };

    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { success: true, booking };
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
    return { success: true, booking };
  }
}

export const bookingService = new UniversalBookingService();
