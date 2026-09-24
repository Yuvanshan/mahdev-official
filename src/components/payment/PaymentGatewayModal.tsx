import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Building2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  X,
  RefreshCw,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
} from 'lucide-react';
import { Order } from '../../types/order';
import {
  PaymentGatewayType,
  PaymentGatewayOption,
  CreatePaymentIntentResponse,
  VerifyPaymentResponse,
  PaymentState,
  VerificationResult,
} from '../../types/payment';
import { paymentService } from '../../services/paymentService';
import { orderService } from '../../services/orderService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface PaymentGatewayModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (verifiedResult: VerificationResult) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('stripe_card');
  const [gateways, setGateways] = useState<PaymentGatewayOption[]>([]);
  const [envMode, setEnvMode] = useState<'sandbox' | 'live'>('sandbox');
  const [loadingGateways, setLoadingGateways] = useState(true);

  // Payment Execution State
  const [paymentStep, setPaymentStep] = useState<
    'select' | 'intent_created' | 'processing' | 'verifying' | 'success' | 'failed'
  >('select');
  const [activeIntent, setActiveIntent] = useState<CreatePaymentIntentResponse | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<VerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failureCode, setFailureCode] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('890');
  const [cardName, setCardName] = useState(order?.customer?.fullName || 'Authorized Cardholder');
  const [testScenario, setTestScenario] = useState<
    'success' | 'declined' | 'timeout' | '3ds_failed' | 'user_cancelled'
  >('success');

  // LankaPay State
  const [selectedBank, setSelectedBank] = useState('Commercial Bank of Ceylon');
  const [lankaPayMethod, setLankaPayMethod] = useState<'online_debit' | 'justpay_qr'>('online_debit');

  // Bank Wire State
  const [bankRefNo, setBankRefNo] = useState('');
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Load Gateway Capabilities
  useEffect(() => {
    async function load() {
      try {
        const config = await paymentService.getGateways();
        setGateways(config.gateways);
        setEnvMode(config.environment as any);
      } catch {
        // Fallback handled in service
      } finally {
        setLoadingGateways(false);
      }
    }
    load();
  }, []);

  if (!isOpen) return null;

  // Initialize Payment Intent on the Server
  const handleStartPayment = async () => {
    setErrorMessage(null);
    setPaymentStep('processing');

    try {
      const intent = await paymentService.createPaymentIntent({
        orderId: order.id,
        amount: order.total,
        currency: order.currency,
        gateway: selectedGateway,
        customerEmail: order.customer.email,
        customerName: order.customer.fullName,
      });

      setActiveIntent(intent);
      setPaymentStep('intent_created');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to initialize secure payment intent.');
      setPaymentStep('failed');
    }
  };

  // Submit and verify on the server (MANDATORY SECURITY RULE)
  const handleConfirmAndVerify = async () => {
    if (!activeIntent) return;

    setErrorMessage(null);
    setPaymentStep('verifying');

    try {
      // Small simulated round-trip for 3DS / Bank switch latency
      await new Promise((r) => setTimeout(r, 1200));

      const verifyRes = await paymentService.verifyPayment({
        transactionId: activeIntent.transactionId,
        orderId: order.id,
        paymentSessionToken: activeIntent.paymentSessionToken,
        gateway: selectedGateway,
        clientPayload: {
          cardNumberMasked:
            selectedGateway === 'stripe_card'
              ? `${cardNumber.slice(0, 4)} •••• •••• ${cardNumber.slice(-4)}`
              : undefined,
          cardBrand:
            selectedGateway === 'stripe_card'
              ? cardNumber.startsWith('4')
                ? 'Visa'
                : 'Mastercard'
              : 'LankaPay Direct',
          testScenario: testScenario,
          bankReferenceNumber: selectedGateway === 'bank_wire' ? bankRefNo : undefined,
        },
      });

      if (verifyRes.success && verifyRes.verificationResult) {
        // Server confirmed valid payment!
        setVerifiedResult(verifyRes.verificationResult);
        setPaymentStep('success');

        // Update Order in local store
        orderService.updateOrderStatus(order.id, 'confirmed', 'paid');
        onPaymentSuccess(verifyRes.verificationResult);
      } else {
        // Server rejected or failure scenario
        setPaymentStep('failed');
        setFailureCode(verifyRes.failureReason?.code || 'PAYMENT_FAILED');
        setErrorMessage(
          verifyRes.failureReason?.message ||
            verifyRes.error ||
            'Payment verification failed on the server. Please try an alternative card or payment channel.'
        );
      }
    } catch (err: any) {
      setPaymentStep('failed');
      setFailureCode('NETWORK_ERROR');
      setErrorMessage(err.message || 'Network error while contacting verification server.');
    }
  };

  const handleCancelSession = async () => {
    if (activeIntent) {
      await paymentService.cancelPayment(activeIntent.transactionId, order.id);
    }
    onClose();
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('100089412300');
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-400/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-white">
                  Mahdev Enterprise Secure Payment Gateway
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {envMode.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Order Reference: <span className="font-mono text-slate-200">{order.id}</span> • Total Payable:{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  ${order.total.toFixed(2)} {order.currency}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelSession}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Gateway Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Rule Notice */}
        <div className="px-6 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
          <div className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>End-to-end encrypted with Server-Side HMAC Cryptographic Verification</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500 hidden sm:inline">
            TLS 1.3 / ISO-8583
          </span>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: Select Gateway & Configure */}
          {(paymentStep === 'select' || paymentStep === 'intent_created') && (
            <div className="space-y-5">
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Enterprise Payment Channel:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {gateways.map((g) => {
                    const isSelected = selectedGateway === g.id;
                    return (
                      <div
                        key={g.id}
                        onClick={() => {
                          setSelectedGateway(g.id);
                          if (paymentStep === 'intent_created') setPaymentStep('select');
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0052FF] bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900">{g.name.split('/')[0]}</span>
                            <input
                              type="radio"
                              name="gatewaySelect"
                              checked={isSelected}
                              onChange={() => setSelectedGateway(g.id)}
                              className="text-blue-600"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                            {g.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">{g.processingFee}</span>
                          <span className="font-semibold text-emerald-700">{g.badge}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gateway Detail View 1: Credit / Debit Card (Stripe 3DS) */}
              {selectedGateway === 'stripe_card' && (
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        International Card Gateway (Visa / MC / Amex)
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        VISA
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        MC
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                        AMEX
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700">CVC / CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="890"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sandbox Scenario Simulation Switcher */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                        <span>🧪 Sandbox Simulation Mode:</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Select test scenario</span>
                    </div>
                    <select
                      value={testScenario}
                      onChange={(e) => setTestScenario(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="success">✅ Valid Card & Successful 3DS Verification</option>
                      <option value="declined">❌ Insufficient Funds / Bank Card Decline</option>
                      <option value="3ds_failed">❌ 3D Secure Authentication Failed</option>
                      <option value="user_cancelled">⚠️ Customer Cancelled in 3DS Window</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Gateway Detail View 2: LankaPay IPG */}
              {selectedGateway === 'lankapay_ipg' && (
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        LankaPay Sri Lanka National Payment Network
                      </span>
                    </div>
                    <Badge size="sm" variant="default" className="bg-emerald-100 text-emerald-800 text-[10px]">
                      National Switch
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLankaPayMethod('online_debit')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        lankaPayMethod === 'online_debit'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Direct Online Banking
                    </button>
                    <button
                      type="button"
                      onClick={() => setLankaPayMethod('justpay_qr')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        lankaPayMethod === 'justpay_qr'
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      JustPay / LankaQR Code
                    </button>
                  </div>

                  {lankaPayMethod === 'online_debit' ? (
                    <div className="space-y-2 text-xs">
                      <label className="text-[11px] font-semibold text-slate-700">Select Sri Lankan Bank:</label>
                      <select
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="Commercial Bank of Ceylon">Commercial Bank of Ceylon PLC (Combank IPG)</option>
                        <option value="Sampath Bank">Sampath Bank PLC (Sampath Vishwa / Paycorp)</option>
                        <option value="Hatton National Bank">Hatton National Bank (HNB Momo / IPG)</option>
                        <option value="Bank of Ceylon">Bank of Ceylon (BOC SmartPay)</option>
                        <option value="Nations Trust Bank">Nations Trust Bank (NTB FriMi Gateway)</option>
                        <option value="DFCC Bank">DFCC Bank PLC</option>
                        <option value="Seylan Bank">Seylan Bank PLC</option>
                      </select>
                      <p className="text-[11px] text-slate-500">
                        You will authenticate securely using your bank’s two-factor OTP authentication.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-4">
                      <div className="p-2 bg-slate-900 text-white rounded-lg shrink-0">
                        <QrCode className="w-10 h-10" />
                      </div>
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-slate-900 block">Scan with any LankaQR Enabled App</span>
                        <p className="text-slate-500 text-[11px]">
                          Combank Q+, FriMi, Genie, Flash, or BOC SmartPay to settle instantly.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gateway Detail View 3: Corporate Bank Wire */}
              {selectedGateway === 'bank_wire' && (
                <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#0052FF]" />
                      <span className="text-xs font-bold text-slate-900">
                        Telegraphic Transfer / Business Bank Wire
                      </span>
                    </div>
                    <Badge size="sm" variant="default" className="bg-[#0052FF]/10 text-[#0052FF] text-[10px]">
                      B2B Invoicing
                    </Badge>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Beneficiary:</span>
                      <strong className="text-slate-900 font-sans">MAHDEV PRIVATE LIMITED</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank Name:</span>
                      <strong className="text-slate-900 font-sans">Commercial Bank of Ceylon PLC</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Account No:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-blue-700">1000 8941 2300</strong>
                        <button
                          onClick={handleCopyAccount}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">SWIFT Code:</span>
                      <strong className="text-slate-900">CCEYLKLX</strong>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Bank Wire Reference / TT Slip Number *
                    </label>
                    <input
                      type="text"
                      value={bankRefNo}
                      onChange={(e) => setBankRefNo(e.target.value)}
                      placeholder="e.g. TT-CBC-2026-90412"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs uppercase font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Verifying Server-Side */}
          {paymentStep === 'verifying' && (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-slate-900">
                  Executing Server-Side Cryptographic Verification...
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Verifying 3D Secure token digest, checking settlement authorization, and updating permanent order state on Mahdev Core.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Verification Succeeded */}
          {paymentStep === 'success' && verifiedResult && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto animate-scaleIn">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-lg font-bold text-slate-900">
                  Payment Verified & Settled Successfully!
                </h4>
                <p className="text-xs text-slate-500">
                  Your transaction has been cryptographically validated by the server and recorded in the audit log.
                </p>
              </div>

              {/* Settlement Certificate Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between pb-2 border-b border-slate-200 font-sans font-bold text-slate-900 text-xs">
                  <span>Settlement Certificate</span>
                  <Badge size="sm" variant="default" className="bg-emerald-100 text-emerald-800 text-[10px]">
                    VERIFIED PAID
                  </Badge>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Transaction Reference:</span>
                  <strong className="text-slate-900">{activeIntent?.transactionId}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Auth Code:</span>
                  <strong className="text-slate-900">{verifiedResult.authCode}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Retrieval Ref (RRN):</span>
                  <strong className="text-slate-900">{verifiedResult.rrn}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Signature Digest:</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                    {verifiedResult.signatureDigest}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Failed / Error */}
          {paymentStep === 'failed' && (
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-slate-900">
                  Payment Verification Unsuccessful
                </h4>
                <p className="text-xs text-rose-600 font-medium max-w-md mx-auto">
                  {errorMessage || 'The transaction could not be verified by the issuing gateway.'}
                </p>
                {failureCode && (
                  <span className="inline-block text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1">
                    Code: {failureCode}
                  </span>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left">
                <strong>Security Guarantee:</strong> Your order <strong>{order.id}</strong> remains safely preserved in your cart. No charges were captured. You may retry or choose a different payment channel.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {paymentStep === 'select' && (
            <>
              <button
                type="button"
                onClick={handleCancelSession}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel & Review Order
              </button>

              <Button
                variant="electric"
                size="sm"
                onClick={handleStartPayment}
                rightIcon={<ChevronRight className="w-4 h-4" />}
                className="text-xs px-6 py-2.5 font-bold"
              >
                Initialize Secure Session (${order.total.toFixed(2)})
              </Button>
            </>
          )}

          {paymentStep === 'intent_created' && (
            <>
              <button
                type="button"
                onClick={() => setPaymentStep('select')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Change Channel
              </button>

              <Button
                variant="electric"
                size="sm"
                onClick={handleConfirmAndVerify}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-xs px-6 py-2.5 font-bold cursor-pointer"
              >
                Confirm & Authorize Payment (${order.total.toFixed(2)})
              </Button>
            </>
          )}

          {paymentStep === 'failed' && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelSession} className="text-xs">
                Exit Gateway
              </Button>

              <Button
                variant="electric"
                size="sm"
                onClick={() => {
                  setPaymentStep('select');
                  setTestScenario('success');
                }}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Try Again with Different Method
              </Button>
            </>
          )}

          {paymentStep === 'success' && (
            <Button
              variant="electric"
              fullWidth
              size="sm"
              onClick={onClose}
              rightIcon={<Check className="w-4 h-4" />}
              className="text-xs py-2.5 font-bold"
            >
              View Verified Order & Invoice Receipt
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
