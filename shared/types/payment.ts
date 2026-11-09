export type PaymentState =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentGatewayType =
  | 'stripe_card'
  | 'lankapay_ipg'
  | 'bank_wire';

export interface PaymentGatewayOption {
  id: PaymentGatewayType;
  name: string;
  badge: string;
  description: string;
  icon: string;
  supportedCurrencies: string[];
  processingFee: string;
  instantConfirmation: boolean;
  supportedMethods: string[];
}

export interface VerificationResult {
  verifiedAt: string;
  verifiedBy: 'server_hmac' | 'stripe_api' | 'lankapay_signature';
  signatureDigest: string;
  authCode?: string;
  rrn?: string; // Retrieval Reference Number
  maskedCard?: string;
  cardBrand?: string;
  settlementStatus: 'settled' | 'pending_funds' | 'declined' | 'refunded';
}

export interface PaymentFailureReason {
  code:
    | 'DECLINED_INSUFFICIENT_FUNDS'
    | '3DS_AUTHENTICATION_FAILED'
    | 'EXPIRED_CARD'
    | 'GATEWAY_TIMEOUT'
    | 'USER_CANCELLED'
    | 'SIGNATURE_MISMATCH'
    | 'DUPLICATE_PAYMENT_ATTEMPT'
    | 'NETWORK_ERROR';
  message: string;
  timestamp: string;
}

export interface RefundDetails {
  refundId: string;
  amount: number;
  reason: string;
  refundedAt: string;
}

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: PaymentGatewayType;
  gatewayName: string;
  paymentStatus: PaymentState;
  timestamp: string;
  updatedAt: string;
  customerEmail: string;
  customerName: string;
  clientSecret?: string;
  paymentSessionToken?: string;
  verificationResult?: VerificationResult;
  failureReason?: PaymentFailureReason;
  refundDetails?: RefundDetails;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
  amount: number;
  currency: string;
  gateway: PaymentGatewayType;
  customerEmail: string;
  customerName: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  gateway: PaymentGatewayType;
  clientSecret: string;
  paymentSessionToken: string;
  mode: 'sandbox' | 'live';
  expiresAt: string;
  error?: string;
}

export interface VerifyPaymentRequest {
  transactionId: string;
  orderId: string;
  paymentSessionToken: string;
  gateway: PaymentGatewayType;
  clientPayload: {
    cardNumberMasked?: string;
    cardBrand?: string;
    testScenario?: 'success' | 'declined' | 'timeout' | '3ds_failed' | 'user_cancelled';
    bankReferenceNumber?: string;
    remittanceSlipUrl?: string;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  paymentStatus: PaymentState;
  verificationResult?: VerificationResult;
  failureReason?: PaymentFailureReason;
  error?: string;
}
