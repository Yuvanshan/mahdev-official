import {
  PaymentGatewayOption,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentTransaction,
} from '../types/payment';
import { notificationService } from './notificationService';

export const paymentService = {
  // 1. Fetch available gateways
  async getGateways(): Promise<{ environment: string; gateways: PaymentGatewayOption[] }> {
    try {
      const res = await fetch('/api/payment/gateways');
      if (!res.ok) throw new Error('Failed to fetch gateway configuration');
      return await res.json();
    } catch (err) {
      console.warn('Falling back to default gateways:', err);
      return {
        environment: 'sandbox',
        gateways: [
          {
            id: 'stripe_card',
            name: 'Visa / Mastercard / Amex / Apple Pay',
            badge: 'Global Instant Settlement',
            description:
              'Secure multi-currency international card gateway protected by 3D Secure 2.0 & Stripe Engine.',
            icon: 'CreditCard',
            supportedCurrencies: ['USD', 'LKR', 'SGD', 'GBP', 'EUR', 'AED'],
            processingFee: '0% Surcharge',
            instantConfirmation: true,
            supportedMethods: ['Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay'],
          },
          {
            id: 'lankapay_ipg',
            name: 'LankaPay / Sri Lanka National Switch IPG',
            badge: 'National Payment Network',
            description:
              'Direct instant debit from all Sri Lankan banks (Commercial Bank, Sampath, HNB, BOC, Nations Trust) and JustPay QR.',
            icon: 'Building2',
            supportedCurrencies: ['LKR', 'USD'],
            processingFee: '0% Surcharge',
            instantConfirmation: true,
            supportedMethods: ['LankaPay Online Debit', 'JustPay QR', 'Frimi', 'Genie'],
          },
          {
            id: 'bank_wire',
            name: 'Corporate Telegraphic Transfer / Bank Wire',
            badge: 'B2B Enterprise Invoicing',
            description:
              'Direct wire transfer to Mahdev corporate accounts at Commercial Bank of Ceylon PLC. Remittance slip verification required.',
            icon: 'FileCheck',
            supportedCurrencies: ['USD', 'LKR', 'EUR', 'GBP'],
            processingFee: 'No Processing Fee',
            instantConfirmation: false,
            supportedMethods: ['SWIFT / TT', 'CEFT / SLIPS', 'RTGS High-Value Transfer'],
          },
        ],
      };
    }
  },

  // 2. Initialize payment intent on backend
  async createPaymentIntent(
    payload: CreatePaymentIntentRequest
  ): Promise<CreatePaymentIntentResponse> {
    const res = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initialize payment intent');
    }
    return data;
  },

  // 3. Server-Side Payment Verification (MANDATORY SECURITY RULE)
  async verifyPayment(payload: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: VerifyPaymentResponse = await res.json();

      if (data.success && data.paymentStatus === 'paid') {
        const txn: PaymentTransaction = {
          transactionId: data.transactionId,
          orderId: data.orderId,
          amount: 0,
          currency: 'USD',
          gateway: payload.gateway,
          gatewayName: payload.gateway,
          paymentStatus: 'paid',
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerEmail: '',
          customerName: 'Valued Customer',
          verificationResult: data.verificationResult,
        };

        // Trigger customer payment receipt & admin payment alert
        notificationService.notifyPaymentConfirmation(payload.orderId, txn, {
          name: 'Valued Customer',
        }).catch(() => {});
        notificationService.notifyAdminPaymentReceived(txn, payload.orderId).catch(() => {});
      } else if (!data.success) {
        notificationService.notifyPaymentFailure(payload.orderId, data.failureReason?.message || data.error || 'Verification declined', {
          name: 'Valued Customer',
        }).catch(() => {});
      }

      return data;
    } catch (err) {
      console.warn('[PaymentService] Verification network issue:', err);
      return {
        success: false,
        transactionId: payload.transactionId,
        orderId: payload.orderId,
        paymentStatus: 'failed',
        error: 'Payment verification service temporarily unavailable.',
      };
    }
  },

  // 4. Cancel payment session
  async cancelPayment(transactionId: string, orderId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/payment/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, orderId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // 5. Query order transactions audit trail
  async getOrderTransactions(orderId: string): Promise<PaymentTransaction[]> {
    try {
      const res = await fetch(`/api/payment/transactions/${orderId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.transactions || [];
    } catch {
      return [];
    }
  },
};
