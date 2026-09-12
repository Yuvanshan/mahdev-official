import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  Calendar,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Sparkles,
  Info,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, SHIPPING_METHODS } from '../services/orderService';
import {
  CustomerOrderDetails,
  OrderDeliveryInfo,
  OrderBookingInfo,
  ShippingAddress,
} from '../types/order';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SEOHead } from '../components/layout/SEOHead';
import { analyticsService } from '../services/analyticsService';
import { formatCurrency, formatLKR } from '../utils/currency';
import { openWhatsAppOrder } from '../utils/whatsapp';

interface CheckoutViewProps {
  onNavigate: (path: string) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate }) => {
  const { cartItems, cartSummary, clearCart, appliedCoupon, applyCoupon, removeCoupon } =
    useCart();

  // Track checkout initiated
  React.useEffect(() => {
    if (cartItems.length > 0) {
      analyticsService.trackCheckoutStarted(cartSummary.totalQuantity, cartSummary.grandTotal || (cartSummary as any).total || 0);
    }
  }, []);

  // Customer Contact State
  const [customer, setCustomer] = useState<CustomerOrderDetails>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    preferredContact: 'email',
  });

  // Shipping Address State
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    apartment: '',
    city: 'Colombo',
    state: 'Western Province',
    postalCode: '',
    country: 'Sri Lanka',
  });

  // Delivery Method State
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    cartSummary.requiresShippingAddress ? 'standard' : 'digital_instant'
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Booking Specifications State (for services/packages)
  const [bookingInfo, setBookingInfo] = useState<OrderBookingInfo>({
    preferredDate: '',
    preferredTimeSlot: '09:00 AM - 12:00 PM',
    venueOrLocation: '',
    specialRequirements: '',
    attendeesOrGuests: 1,
  });

  const [customerNotes, setCustomerNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Form Validation & Submitting
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupon inline input
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const selectedShippingMethod =
    SHIPPING_METHODS.find((m) => m.id === selectedMethodId) || SHIPPING_METHODS[0];

  const shippingCost = cartSummary.requiresShippingAddress
    ? cartSummary.isFreeShipping
      ? 0
      : selectedShippingMethod.cost
    : 0;

  const finalTotal = Math.max(
    0,
    cartSummary.subtotal - cartSummary.couponDiscountTotal + shippingCost + cartSummary.tax
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError(null);
      setCouponInput('');
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setFormErrors({ terms: 'Please agree to the terms and privacy policy to proceed.' });
      return;
    }

    const deliveryPayload: OrderDeliveryInfo | undefined = cartSummary.requiresShippingAddress
      ? {
          methodId: selectedShippingMethod.id,
          methodName: selectedShippingMethod.name,
          cost: shippingCost,
          estimatedDelivery: selectedShippingMethod.estimatedDelivery,
          address,
          specialInstructions: deliveryNotes,
        }
      : {
          methodId: 'digital_instant',
          methodName: 'Instant Digital / Electronic Access',
          cost: 0,
          estimatedDelivery: 'Immediate',
        };

    const validation = orderService.validateCheckout(
      customer,
      deliveryPayload,
      bookingInfo,
      cartSummary.requiresShippingAddress,
      cartSummary.requiresBookingInfo
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validation.errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      const createdOrder = orderService.createOrder(
        {
          customer,
          deliveryInfo: deliveryPayload,
          bookingInfo: cartSummary.requiresBookingInfo ? bookingInfo : undefined,
          customerNotes,
          appliedCouponCode: appliedCoupon?.code,
        },
        cartSummary
      );

      analyticsService.trackPurchaseCompleted(
        createdOrder.id,
        createdOrder.total,
        createdOrder.items.length,
        'LKR'
      );

      clearCart();
      setIsSubmitting(false);
      onNavigate(`/order/${createdOrder.id}`);
    }, 600);
  };

  const handleWhatsAppCheckout = () => {
    if (!agreedToTerms) {
      setFormErrors({ terms: 'Please agree to the Terms of Service to proceed.' });
      return;
    }

    const deliveryPayload: OrderDeliveryInfo = cartSummary.requiresShippingAddress
      ? {
          methodId: selectedShippingMethod.id,
          methodName: selectedShippingMethod.name,
          cost: shippingCost,
          estimatedDelivery: selectedShippingMethod.estimatedDelivery,
          address,
          specialInstructions: deliveryNotes,
        }
      : {
          methodId: 'digital_instant',
          methodName: 'Instant Digital / Electronic Access',
          cost: 0,
          estimatedDelivery: 'Immediate',
        };

    const validation = orderService.validateCheckout(
      customer,
      deliveryPayload,
      bookingInfo,
      cartSummary.requiresShippingAddress,
      cartSummary.requiresBookingInfo
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      const firstErrorKey = Object.keys(validation.errors)[0];
      const el = document.getElementById(firstErrorKey);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const createdOrder = orderService.createOrder(
      {
        customer,
        deliveryInfo: deliveryPayload,
        bookingInfo: cartSummary.requiresBookingInfo ? bookingInfo : undefined,
        customerNotes,
        appliedCouponCode: appliedCoupon?.code,
      },
      cartSummary
    );

    analyticsService.trackPurchaseCompleted(
      createdOrder.id,
      createdOrder.total,
      createdOrder.items.length,
      'LKR'
    );

    openWhatsAppOrder({
      orderId: createdOrder.id,
      customerName: customer.fullName || 'Valued Customer',
      customerPhone: customer.phone,
      deliveryAddress: cartSummary.requiresShippingAddress
        ? `${address.street}, ${address.city}, ${address.country}`
        : undefined,
      city: address.city,
      notes: customerNotes || bookingInfo.specialRequirements,
      items: cartItems.map((it) => ({
        name: it.name,
        sku: (it as any).sku || it.id.toUpperCase().slice(-8),
        quantity: it.quantity,
        price: it.unitPrice,
        selectedVariant: it.selectedVariant?.name,
      })),
      subtotal: cartSummary.subtotal,
      shippingFee: shippingCost,
      discount: cartSummary.couponDiscountTotal + cartSummary.productDiscountTotal,
      grandTotal: finalTotal,
    });

    clearCart();
    setIsSubmitting(false);
    onNavigate(`/order/${createdOrder.id}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-slate-900">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            Please add items or services from our Master Catalog or divisions before proceeding to checkout.
          </p>
          <Button variant="electric" onClick={() => onNavigate('/catalog')} className="w-full">
            Browse Master Catalog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Secure Checkout | Mahdev Pvt Ltd Enterprise System"
        description="Review your order, provide delivery specifications, and transition directly into enterprise payment processing."
        canonicalUrl="https://mahdev.lk/checkout"
      />

      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/catalog')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5" />
            <span className="font-semibold">SSL 256-Bit Encrypted Architecture</span>
          </div>
        </div>

        {/* Phase 12 Notice Banner */}
        <div className="mb-8 p-4 rounded-xl bg-blue-50/90 border border-blue-200/80 flex items-start gap-3 text-xs text-slate-700 shadow-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-900">
              Phase 12 Cart & Checkout Architecture:
            </span>{' '}
            Complete your customer credentials, dispatch logistics, and booking preferences below.
            Upon submission, your order is securely generated in the Mahdev system with status{' '}
            <code className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold">
              pending_payment
            </code>{' '}
            and transitions directly into Payment Gateway Processing (Phase 13).
          </div>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Checkout Forms (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Customer Details Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Customer & Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name or Authorized Signatory *</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={customer.fullName}
                      onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                      placeholder="e.g. Dr. Ruwan Wickremasinghe"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        formErrors.fullName
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-rose-600">{formErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address *</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="name@company.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        formErrors.email
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-600">{formErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact Telephone / Mobile *</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="075 092 8078"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                        formErrors.phone
                          ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                          : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-600">{formErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Company / Organization (Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={customer.company}
                      onChange={(e) => setCustomer({ ...customer, company: e.target.value })}
                      placeholder="e.g. Apex Global Corp"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Preferred Dispatch Notification
                    </label>
                    <select
                      value={customer.preferredContact}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          preferredContact: e.target.value as any,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="email">Email Notification & Invoicing</option>
                      <option value="whatsapp">WhatsApp Instant Status Alerts</option>
                      <option value="phone">Direct Phone Call from Dispatch</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Delivery & Address (Conditionally detailed for physical goods) */}
              {cartSummary.requiresShippingAddress ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        Physical Delivery Logistics & Address
                      </h3>
                    </div>
                    <Badge size="sm" variant="default" className="text-[10px]">
                      Physical Goods Included
                    </Badge>
                  </div>

                  {/* Shipping Method Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Select Courier & Dispatch Tier:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {SHIPPING_METHODS.filter((m) => m.id !== 'digital_instant').map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        const isFreeApplicable =
                          cartSummary.isFreeShipping && method.id === 'standard';

                        return (
                          <div
                            key={method.id}
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#0052FF] bg-blue-50/50 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">
                                  {method.name.split('(')[0]}
                                </span>
                                <input
                                  type="radio"
                                  name="shippingMethod"
                                  checked={isSelected}
                                  onChange={() => setSelectedMethodId(method.id)}
                                  className="text-blue-600"
                                />
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-2">
                                {method.estimatedDelivery}
                              </p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500 text-[10px]">Rate:</span>
                              <span className="font-mono text-blue-700">
                                {isFreeApplicable ? (
                                  <span className="text-emerald-700 font-bold">FREE</span>
                                ) : (
                                  formatCurrency(method.cost, 'LKR')
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Address Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Street Address & Premise Number *</span>
                      </label>
                      <input
                        id="street"
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        placeholder="e.g. 42 Gregory Road, Cinnamon Gardens"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          formErrors.street
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.street && (
                        <p className="text-[11px] text-rose-600">{formErrors.street}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Apartment, Suite, Unit (Optional)
                      </label>
                      <input
                        type="text"
                        value={address.apartment}
                        onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                        placeholder="e.g. Suite 8B"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">City / Town *</label>
                      <input
                        id="city"
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="e.g. Colombo"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          formErrors.city
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.city && (
                        <p className="text-[11px] text-rose-600">{formErrors.city}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Postal / ZIP Code *</label>
                      <input
                        id="postalCode"
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="e.g. 00700"
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          formErrors.postalCode
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.postalCode && (
                        <p className="text-[11px] text-rose-600">{formErrors.postalCode}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Country *</label>
                      <select
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Singapore">Singapore</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Australia">Australia</option>
                        <option value="India">India</option>
                        <option value="Germany">Germany</option>
                        <option value="Japan">Japan</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Delivery Notes / Gate Access Codes (Optional)
                      </label>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        rows={2}
                        placeholder="e.g. Leave with concierge or security guard if out."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Digital & Service Fulfillment
                    </h3>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Your cart contains digital systems or services. Physical delivery address is not required.
                      Credentials and documentation will be dispatched to <strong>{customer.email || 'your email'}</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* 3. Booking Specifications (Conditionally detailed for services/packages) */}
              {cartSummary.requiresBookingInfo && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        Service & Event Reservation Preferences
                      </h3>
                    </div>
                    <Badge size="sm" variant="default" className="bg-amber-100 text-amber-800 text-[10px]">
                      Service Booking Required
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Preferred Event / Service Date *</span>
                      </label>
                      <input
                        id="preferredDate"
                        type="date"
                        value={bookingInfo.preferredDate}
                        min={new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}
                        onChange={(e) =>
                          setBookingInfo({ ...bookingInfo, preferredDate: e.target.value })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 ${
                          formErrors.preferredDate
                            ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                            : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.preferredDate && (
                        <p className="text-[11px] text-rose-600">{formErrors.preferredDate}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Preferred Execution Time Slot</span>
                      </label>
                      <select
                        value={bookingInfo.preferredTimeSlot}
                        onChange={(e) =>
                          setBookingInfo({ ...bookingInfo, preferredTimeSlot: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      >
                        <option value="09:00 AM - 12:00 PM">Morning Slot (09:00 AM - 12:00 PM)</option>
                        <option value="01:00 PM - 05:00 PM">Afternoon Slot (01:00 PM - 05:00 PM)</option>
                        <option value="06:00 PM - 10:00 PM">Evening Gala / Production (06:00 PM - 10:00 PM)</option>
                        <option value="Full Day 08:00 - 20:00">Full Day Production (08:00 AM - 08:00 PM)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Venue, Destination, or Client Office Location
                      </label>
                      <input
                        type="text"
                        value={bookingInfo.venueOrLocation}
                        onChange={(e) =>
                          setBookingInfo({ ...bookingInfo, venueOrLocation: e.target.value })
                        }
                        placeholder="e.g. Shangri-La Ballroom, Colombo or Remote Cloud Architecture"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Special Event Production Notes & Requirements
                      </label>
                      <textarea
                        value={bookingInfo.specialRequirements}
                        onChange={(e) =>
                          setBookingInfo({
                            ...bookingInfo,
                            specialRequirements: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Specific A/V staging, camera gear, dietary requirements, or tech stack constraints..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Additional Order Instructions or Billing Notes</span>
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  placeholder="Any purchase order (PO) numbers, packaging preferences, or specific invoicing notes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right Column: Order Review, Totals & Transition (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Order Summary ({cartSummary.totalQuantity} items)
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('/catalog')}
                    className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Edit Cart
                  </button>
                </div>

                {/* Items Mini List */}
                <div className="max-h-60 overflow-y-auto space-y-3 divide-y divide-slate-100 pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-xs font-bold text-slate-900 line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <span className="font-bold text-slate-700 bg-slate-100 px-1 py-0.2 rounded">
                            SKU: {(item as any).sku || item.id.toUpperCase().slice(-8)}
                          </span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                          {item.selectedVariant && (
                            <>
                              <span>•</span>
                              <span className="text-slate-700">{item.selectedVariant.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                        {formatCurrency(item.itemTotal, 'LKR')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input */}
                <div className="pt-2 border-t border-slate-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                      <span className="text-emerald-800 font-medium text-[11px]">
                        Promo <strong>{appliedCoupon.code}</strong> Applied (-{formatCurrency(cartSummary.couponDiscountTotal, 'LKR')})
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Coupon Code (e.g. MAHDEV2026)"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase font-mono bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleApplyCoupon}
                        className="text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
                </div>

                {/* Financial Summary */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(cartSummary.subtotal, 'LKR')}
                    </span>
                  </div>

                  {cartSummary.productDiscountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 text-[11px]">
                      <span>Product Savings</span>
                      <span className="font-mono font-bold">
                        -{formatCurrency(cartSummary.productDiscountTotal, 'LKR')}
                      </span>
                    </div>
                  )}

                  {cartSummary.couponDiscountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 text-[11px]">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span className="font-mono font-bold">
                        -{formatCurrency(cartSummary.couponDiscountTotal, 'LKR')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>
                      Shipping ({cartSummary.requiresShippingAddress ? selectedShippingMethod.name.split('(')[0] : 'Digital'})
                    </span>
                    <span className="font-mono text-slate-900">
                      {shippingCost === 0 ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        formatCurrency(shippingCost, 'LKR')
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Payable</span>
                    <span className="font-mono text-lg text-[#0052FF]">
                      {formatCurrency(finalTotal, 'LKR')}
                    </span>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      I confirm the customer credentials and delivery specifications provided above and agree to Mahdev’s{' '}
                      <a href="/terms-and-conditions" target="_blank" className="text-blue-600 underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy-policy" target="_blank" className="text-blue-600 underline">
                        Privacy Policy
                      </a>.
                    </span>
                  </label>
                  {formErrors.terms && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.terms}</p>
                  )}
                </div>

                {/* WhatsApp Order & Online Payment Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppCheckout}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                    <span>Order via WhatsApp with SKU ({formatCurrency(finalTotal, 'LKR')})</span>
                  </button>

                  <div className="p-3 rounded-xl bg-slate-900 text-white text-[11px] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <CreditCard className="w-4 h-4" />
                      <span>Direct Gateway Checkout (Phase 13 Readiness)</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[10px]">
                      Or place your order online to generate a permanent <strong>Order ID (ORD-2026-XXXX)</strong>,
                      locking in delivery specifications and transitioning directly into the payment gateway screen.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="electric"
                    fullWidth
                    disabled={isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="py-3.5 text-xs font-bold cursor-pointer"
                  >
                    {isSubmitting ? 'Generating Order...' : `Standard Order & Online Payment (${formatCurrency(finalTotal, 'LKR')})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
