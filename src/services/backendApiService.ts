/**
 * Mahdev Enterprise Secure Backend API Gateway Client
 * 
 * Routes sensitive operations (order validation, status changes,
 * invoice generation, notification dispatch) to trusted server infrastructure.
 */

import { getAppCheckAttestationToken } from '../lib/appCheck';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class BackendApiService {
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Attach App Check attestation token if available
    const appCheckToken = await getAppCheckAttestationToken();
    if (appCheckToken) {
      headers['X-Firebase-AppCheck'] = appCheckToken;
    }

    // Attach Admin Token if available in localStorage
    const adminToken = localStorage.getItem('mahdev_admin_session_token');
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    }

    return headers;
  }

  /**
   * 1. Validate & Create Order authoritatively on the server
   */
  public async validateAndCreateOrder(payload: {
    customerId?: string;
    customerEmail: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode?: string;
    };
    items: Array<{
      productId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      selectedVariant?: string;
    }>;
    couponCode?: string;
    currency?: string;
    deliveryMethod?: 'standard' | 'express' | 'freight';
  }): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/orders/validate-and-create', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackendApiService] Order validation error:', err);
      return { success: false, error: err?.message || 'Network communication error' };
    }
  }

  /**
   * 2. Update Order Status (Protected Server Operation)
   */
  public async updateOrderStatus(payload: {
    orderId: string;
    currentStatus: string;
    newStatus: string;
    trackingNumber?: string;
    notes?: string;
  }): Promise<{ success: boolean; updatedOrder?: any; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/orders/status-update', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackendApiService] Status update error:', err);
      return { success: false, error: err?.message || 'Network communication error' };
    }
  }

  /**
   * 3. Generate Cryptographically Signed Fiscal Invoice
   */
  public async generateFiscalInvoice(payload: {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerAddress?: string;
    companyName?: string;
    taxRegistrationNumber?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
  }): Promise<{ success: boolean; invoice?: any; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackendApiService] Invoice generation error:', err);
      return { success: false, error: err?.message || 'Network communication error' };
    }
  }

  /**
   * 4. Dispatch Multi-Channel Notifications
   */
  public async dispatchNotification(payload: {
    type: string;
    recipient: {
      name: string;
      email?: string;
      phone?: string;
    };
    data: Record<string, any>;
    channels?: Array<'email' | 'sms' | 'whatsapp' | 'in_app'>;
  }): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[BackendApiService] Notification dispatch error:', err);
      return { success: false, error: err?.message || 'Network communication error' };
    }
  }
}

export const backendApiService = new BackendApiService();
