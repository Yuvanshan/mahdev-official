/**
 * Mahdev Enterprise Notification Types (Phase 35)
 * Strict schema for Customer Emails, Admin Alerts, and Multi-channel Dispatches
 */

export type NotificationType =
  // Customer Event Types
  | 'registration'
  | 'password_reset'
  | 'order_confirmation'
  | 'payment_confirmation'
  | 'payment_failure'
  | 'booking_confirmation'
  | 'booking_update'
  | 'booking_cancellation'
  | 'quote_request_received'
  // Admin Alert Types
  | 'admin_new_order'
  | 'admin_new_booking'
  | 'admin_payment_received'
  | 'admin_new_customer'
  | 'admin_low_inventory'
  | 'admin_contact_inquiry'
  | 'admin_quote_request';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface NotificationRecipient {
  name: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'staff';
  userId?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  title: string;
  message: string;
  status: NotificationStatus;
  readAt: string | null;
  createdAt: string;
  data?: Record<string, any>;
  channels?: Array<'email' | 'in_app' | 'sms' | 'whatsapp'>;
  actionUrl?: string;
}

export interface EmailTemplatePayload {
  to: string;
  subject: string;
  htmlContent: string;
  plainText: string;
  sanitizedMetadata?: Record<string, any>;
}
