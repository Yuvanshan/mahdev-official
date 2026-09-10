/**
 * Universal Booking System Types for Mahdev Ecosystem
 * Designed for cross-division services (Events, Photography, Travels, IT, etc.)
 * Firestore & PostgreSQL persistence ready
 */

export type BookingType =
  | 'event'
  | 'photography'
  | 'travel'
  | 'it_service'
  | 'other';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_paid'
  | 'paid'
  | 'refunded';

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  preferredContactMethod?: 'phone' | 'email' | 'whatsapp';
}

export type LocationType =
  | 'venue'
  | 'studio'
  | 'travel_destination'
  | 'client_premises'
  | 'remote_online';

export interface BookingLocation {
  type: LocationType;
  address: string;
  city?: string;
  venueName?: string;
}

export interface BookingPackageOption {
  id: string;
  sku?: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: string;
  features: string[];
}

export interface BookableServiceItem {
  id: string;
  sku: string;
  name: string;
  bookingType: BookingType;
  divisionId: 'sws' | 'u1' | 'travels' | 'it' | 'consulting' | 'other';
  divisionName: string;
  description: string;
  imageUrl: string;
  locationTypeDefault: LocationType;
  availableTimeSlots: string[];
  maxBookingsPerDay: number;
  packages: BookingPackageOption[];
  leadTimeDays: number;
}

export interface Booking {
  id: string; // e.g. "BK-2026-8941"
  customerId: string;
  divisionId: 'sws' | 'u1' | 'travels' | 'it' | 'consulting' | 'other';
  divisionName: string;
  bookingType: BookingType;
  serviceId: string;
  serviceName: string;
  serviceSku?: string;
  serviceImageUrl?: string;
  packageId: string;
  packageName: string;
  packageSku?: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:00 AM - 12:00 PM"
  location: BookingLocation;
  customer: CustomerDetails;
  notes: string;
  price: number;
  currency: string;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  adminNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface BookingSubmissionInput {
  bookingType: BookingType;
  divisionId: 'sws' | 'u1' | 'travels' | 'it' | 'consulting' | 'other';
  serviceId: string;
  serviceSku?: string;
  serviceImageUrl?: string;
  packageId: string;
  packageSku?: string;
  date: string;
  time: string;
  location: BookingLocation;
  customer: CustomerDetails;
  notes?: string;
}

export interface BookingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
