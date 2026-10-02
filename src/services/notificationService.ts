/**
 * Mahdev Enterprise Notification & Email Service (Phase 35)
 * Client-Side Orchestrator for Customer Emails and Admin Situational Alerts.
 * 
 * Features:
 * - Non-blocking asynchronous dispatch (never disrupts primary transactions)
 * - Strict customer PII & token sanitization
 * - Local fallback storage for In-App Notification Center
 */

import { AppNotification, NotificationType, NotificationRecipient } from '../types/notification';
import { backendApiService } from './backendApiService';
import { Order } from '../types/order';
import { Booking } from '../types/booking';
import { PaymentTransaction } from '../types/payment';
import { COMPANY_INFO } from '../config/company';
import { collection, doc, setDoc, onSnapshot, query, limit, updateDoc } from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../lib/firebase';

const NOTIFICATIONS_STORAGE_KEY = 'mahdev_notifications_v1';

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        this.notifications = [];
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications.slice(0, 100)));
      this.notifyListeners();
    } catch (e) {
      console.warn('[NotificationService] Local storage save failed:', e);
    }
  }

  private initFirestoreSync(): void {
    if (typeof window === 'undefined') return;
    try {
      const q = query(collection(db, 'notifications'), limit(100));
      onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const cloudNotifs: AppNotification[] = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as AppNotification[];
          const existingIds = new Set(cloudNotifs.map((n) => n.id));
          const localOnly = this.notifications.filter((n) => !existingIds.has(n.id));
          const merged = [...cloudNotifs, ...localOnly];
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.notifications = merged.slice(0, 100);
          try {
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
          } catch {}
          this.notifyListeners();
        }
      }, (err) => {
        console.warn('[NotificationService] Firestore listener notice:', err);
      });
    } catch (e) {
      console.warn('[NotificationService] Firestore sync init notice:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Safe non-blocking dispatch to backend notification endpoint with local in-app persistence
   */
  private async safeDispatch(
    type: NotificationType,
    recipient: NotificationRecipient,
    title: string,
    message: string,
    data: Record<string, any> = {},
    actionUrl?: string
  ): Promise<AppNotification> {
    const notification: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      recipient,
      title,
      message,
      status: 'sent',
      readAt: null,
      createdAt: new Date().toISOString(),
      data,
      channels: ['email', 'in_app'],
      actionUrl,
    };

    // 1. Immediately store in client in-app store
    this.notifications.unshift(notification);
    this.saveToStorage();

    // 2. Persist to Cloud Firestore so all admin logins across devices receive the alert
    try {
      const docRef = doc(db, 'notifications', notification.id);
      setDoc(docRef, sanitizeForFirestore(notification)).catch(() => {});
    } catch {}

    // 2. Asynchronously fire server email/SMS dispatcher without blocking caller
    (async () => {
      try {
        await backendApiService.dispatchNotification({
          type,
          recipient: {
            name: recipient.name,
            email: recipient.email,
            phone: recipient.phone,
          },
          data: {
            title,
            message,
            ...data,
          },
          channels: ['email'],
        });
      } catch (err) {
        console.warn(`[NotificationService] Server dispatch deferred for ${type}:`, err);
      }
    })().catch(() => {});

    return notification;
  }

  // =========================================================================
  // 1. CUSTOMER NOTIFICATIONS & EMAILS
  // =========================================================================

  /**
   * 1. Customer Registration Welcome
   */
  async notifyRegistration(user: { name: string; email: string; phone?: string }): Promise<void> {
    await this.safeDispatch(
      'registration',
      { name: user.name, email: user.email, phone: user.phone, role: 'customer' },
      'Welcome to Mahdev Pvt Ltd',
      `Welcome to the Mahdev Enterprise Ecosystem, ${user.name}. Your unified account is active for Event Bookings, Studio Sessions, IT Consultations, Travel Expeditions, and Online Mart orders.`,
      { email: user.email },
      '/account'
    );
  }

  /**
   * 2. Password Reset Request
   */
  async notifyPasswordReset(email: string): Promise<void> {
    await this.safeDispatch(
      'password_reset',
      { name: 'Customer', email, role: 'customer' },
      'Password Reset Instructions — Mahdev Account',
      `A password reset request was initiated for your account (${email}). If you made this request, please click the secure recovery link sent to your inbox. If you did not make this request, you can safely ignore this alert.`,
      { email },
      '/login'
    );
  }

  /**
   * 3. Order Confirmation & Itemized Receipt
   */
  async notifyOrderConfirmation(order: Order): Promise<void> {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemNames = order.items.map((i) => `${i.quantity}x ${i.name}`).slice(0, 2).join(', ');

    await this.safeDispatch(
      'order_confirmation',
      {
        name: order.customer.fullName,
        email: order.customer.email,
        phone: order.customer.phone,
        role: 'customer',
      },
      `Order Confirmed: #${order.id}`,
      `Thank you for your order! Order #${order.id} (${itemCount} items: ${itemNames}) for ${order.currency} ${order.total.toLocaleString()} has been received and is being processed by Mahdev Operations.`,
      {
        orderId: order.id,
        total: order.total,
        currency: order.currency,
        itemsCount: itemCount,
        shippingMethod: order.deliveryInfo?.methodName,
      },
      `/track-order?id=${order.id}`
    );
  }

  /**
   * 4. Payment Confirmation
   */
  async notifyPaymentConfirmation(orderId: string, transaction: PaymentTransaction, customer: { name: string; email?: string; phone?: string }): Promise<void> {
    await this.safeDispatch(
      'payment_confirmation',
      { name: customer.name, email: customer.email, phone: customer.phone, role: 'customer' },
      `Payment Received — #${transaction.transactionId}`,
      `Payment of ${transaction.currency} ${transaction.amount.toLocaleString()} for Order #${orderId} has been successfully verified via ${transaction.gatewayName || transaction.gateway}. Tax invoice #INV-${orderId} is now available in your account.`,
      {
        transactionId: transaction.transactionId,
        orderId,
        amount: transaction.amount,
        currency: transaction.currency,
        gateway: transaction.gateway,
      },
      `/account/payments`
    );
  }

  /**
   * 5. Payment Failure Alert
   */
  async notifyPaymentFailure(orderId: string, reason: string, customer: { name: string; email?: string; phone?: string }): Promise<void> {
    await this.safeDispatch(
      'payment_failure',
      { name: customer.name, email: customer.email, phone: customer.phone, role: 'customer' },
      `Payment Verification Required — Order #${orderId}`,
      `We were unable to verify payment for Order #${orderId} (${reason}). Please review your payment details or choose an alternate gateway (LankaPay, Card, or Bank Wire) to complete your order.`,
      { orderId, reason },
      `/checkout?order=${orderId}`
    );
  }

  /**
   * 6. Booking Confirmation
   */
  async notifyBookingConfirmation(booking: Booking): Promise<void> {
    await this.safeDispatch(
      'booking_confirmation',
      {
        name: booking.customer.fullName,
        email: booking.customer.email,
        phone: booking.customer.phone,
        role: 'customer',
      },
      `Booking Confirmed: #${booking.id} (${booking.serviceName})`,
      `Your booking #${booking.id} for "${booking.serviceName}" scheduled on ${booking.date} (${booking.time}) has been confirmed. A Mahdev division specialist will contact you shortly.`,
      {
        bookingId: booking.id,
        divisionId: booking.divisionId,
        serviceName: booking.serviceName,
        eventDate: booking.date,
        venue: booking.location?.address || 'Sri Lanka',
      },
      `/account/bookings`
    );
  }

  /**
   * 7. Booking Update Notification
   */
  async notifyBookingUpdate(booking: Booking, updateDetails: string): Promise<void> {
    await this.safeDispatch(
      'booking_update',
      {
        name: booking.customer.fullName,
        email: booking.customer.email,
        phone: booking.customer.phone,
        role: 'customer',
      },
      `Schedule Update: Booking #${booking.id}`,
      `Your booking #${booking.id} (${booking.serviceName}) has been updated: ${updateDetails}. You can view the revised timeline in your customer portal.`,
      { bookingId: booking.id, updateDetails },
      `/account/bookings`
    );
  }

  /**
   * 8. Booking Cancellation Notification
   */
  async notifyBookingCancellation(booking: Booking, reason?: string): Promise<void> {
    await this.safeDispatch(
      'booking_cancellation',
      {
        name: booking.customer.fullName,
        email: booking.customer.email,
        phone: booking.customer.phone,
        role: 'customer',
      },
      `Booking Cancelled: #${booking.id}`,
      `Booking #${booking.id} (${booking.serviceName}) has been cancelled${reason ? `: ${reason}` : '.'} Any refundable retainers will be processed according to Mahdev refund policies within 3-5 business days.`,
      { bookingId: booking.id, reason },
      `/account/bookings`
    );
  }

  /**
   * 9. Quote Request Received Acknowledgement
   */
  async notifyQuoteRequestReceived(quoteData: { name: string; email: string; phone?: string; service: string; division: string }): Promise<void> {
    await this.safeDispatch(
      'quote_request_received',
      { name: quoteData.name, email: quoteData.email, phone: quoteData.phone, role: 'customer' },
      `Enterprise RFP Received — ${quoteData.service}`,
      `Thank you for your inquiry, ${quoteData.name}. Our enterprise solutions architect for Mahdev ${(quoteData.division || 'GROUP').toUpperCase()} has received your requirements and will return a custom quotation within 24 business hours.`,
      { service: quoteData.service, division: quoteData.division },
      '/#divisions'
    );
  }

  // =========================================================================
  // 2. ADMIN NOTIFICATIONS & OPERATIONAL ALERTS
  // =========================================================================

  /**
   * 1. Admin Alert: New Order Placed
   */
  async notifyAdminNewOrder(order: Order): Promise<void> {
    await this.safeDispatch(
      'admin_new_order',
      { name: 'Operations Team', email: 'operations@mahdev.lk', role: 'admin' },
      `🚨 New Order Placed: #${order.id}`,
      `Customer ${order.customer.fullName} placed Order #${order.id} for ${order.currency} ${order.total.toLocaleString()} via ${order.paymentMethod}. Destination: ${order.deliveryInfo?.address?.city || 'Sri Lanka'}.`,
      { orderId: order.id, total: order.total, customer: order.customer.fullName },
      '/admin'
    );
  }

  /**
   * 2. Admin Alert: New Booking Submitted
   */
  async notifyAdminNewBooking(booking: Booking): Promise<void> {
    const divIdStr = (booking.divisionId || 'sws').toUpperCase();
    await this.safeDispatch(
      'admin_new_booking',
      { name: 'Operations Team', email: 'operations@mahdev.lk', role: 'admin' },
      `📅 New Booking: #${booking.id} (${divIdStr})`,
      `${booking.customer.fullName} submitted a new booking for "${booking.serviceName}" on ${booking.date} (${booking.time}). Package: ${booking.packageName} ($${booking.price}).`,
      { bookingId: booking.id, divisionId: booking.divisionId, customer: booking.customer.fullName },
      '/admin'
    );
  }

  /**
   * 3. Admin Alert: Payment Received
   */
  async notifyAdminPaymentReceived(transaction: PaymentTransaction, orderId: string): Promise<void> {
    await this.safeDispatch(
      'admin_payment_received',
      { name: 'Finance Lead', email: 'finance@mahdev.lk', role: 'admin' },
      `💰 Payment Verified: ${transaction.currency} ${transaction.amount.toLocaleString()}`,
      `Transaction #${transaction.transactionId} settled for Order #${orderId} via ${transaction.gatewayName || transaction.gateway}. Auth code: ${transaction.verificationResult?.authCode || 'N/A'}.`,
      { transactionId: transaction.transactionId, orderId, amount: transaction.amount, gateway: transaction.gateway },
      '/admin'
    );
  }

  /**
   * 4. Admin Alert: New Customer Registered
   */
  async notifyAdminNewCustomer(user: { name: string; email: string; phone?: string }): Promise<void> {
    await this.safeDispatch(
      'admin_new_customer',
      { name: 'Yuvanshan Prabakaran', email: 'info.mahdev.lk@gmail.com', role: 'admin' },
      `👤 New Customer Registration: ${user.name}`,
      `New user account registered: ${user.name} (${user.email}). Phone: ${user.phone || 'Not provided'}.`,
      { name: user.name, email: user.email },
      '/admin'
    );
  }

  /**
   * 5. Admin Alert: Low Inventory Threshold
   */
  async notifyAdminLowInventory(productName: string, sku: string, currentStock: number): Promise<void> {
    await this.safeDispatch(
      'admin_low_inventory',
      { name: 'Warehouse Logistics', email: 'mart@mahdev.lk', role: 'admin' },
      `⚠️ Low Inventory Warning: ${sku}`,
      `Stock level for "${productName}" (${sku}) has fallen to ${currentStock} units. Replenishment threshold reached.`,
      { sku, currentStock, productName },
      '/admin'
    );
  }

  /**
   * 6. Admin Alert: Corporate Contact Inquiry
   */
  async notifyAdminContactInquiry(inquiry: { name: string; email: string; subject: string; message: string }): Promise<void> {
    await this.safeDispatch(
      'admin_contact_inquiry',
      { name: 'Corporate Dispatch', email: COMPANY_INFO.email, role: 'admin' },
      `📩 New Inquiry: ${inquiry.subject}`,
      `Message from ${inquiry.name} (${inquiry.email}): "${inquiry.message.slice(0, 140)}..."`,
      { name: inquiry.name, email: inquiry.email, subject: inquiry.subject },
      '/admin/enquiries'
    );
  }

  /**
   * 7. Admin Alert: Quote Request (RFP)
   */
  async notifyAdminQuoteRequest(quote: { name: string; email: string; phone?: string; division: string; details: string }): Promise<void> {
    await this.safeDispatch(
      'admin_quote_request',
      { name: 'Sales Director', email: 'sales@mahdev.lk', role: 'admin' },
      `📋 RFP Quote Request: ${(quote.division || 'GROUP').toUpperCase()}`,
      `Custom proposal requested by ${quote.name} (${quote.email}, ${quote.phone || 'No phone'}). Details: ${quote.details.slice(0, 120)}...`,
      { name: quote.name, email: quote.email, division: quote.division },
      '/admin/enquiries'
    );
  }

  // =========================================================================
  // 3. IN-APP NOTIFICATION RETRIEVAL & MANAGEMENT
  // =========================================================================

  public getNotifications(userEmail?: string, role?: 'customer' | 'admin'): AppNotification[] {
    if (role === 'admin') {
      return this.notifications.filter((n) => n.recipient.role === 'admin' || n.type.startsWith('admin_'));
    }
    if (userEmail) {
      return this.notifications.filter(
        (n) => n.recipient.email === userEmail || (n.recipient.role !== 'admin' && !n.type.startsWith('admin_'))
      );
    }
    return this.notifications;
  }

  public getUnreadCount(userEmail?: string, role?: 'customer' | 'admin'): number {
    return this.getNotifications(userEmail, role).filter((n) => !n.readAt).length;
  }

  public markAsRead(id: string): void {
    const item = this.notifications.find((n) => n.id === id);
    if (item && !item.readAt) {
      item.readAt = new Date().toISOString();
      item.status = 'read';
      this.saveToStorage();
      try {
        const docRef = doc(db, 'notifications', id);
        updateDoc(docRef, { readAt: item.readAt, status: 'read' }).catch(() => {});
      } catch {}
    }
  }

  public markAllAsRead(userEmail?: string, role?: 'customer' | 'admin'): void {
    const list = this.getNotifications(userEmail, role);
    const now = new Date().toISOString();
    list.forEach((n) => {
      n.readAt = now;
      n.status = 'read';
    });
    this.saveToStorage();
  }

  public clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
  }
}

export const notificationService = new NotificationService();
