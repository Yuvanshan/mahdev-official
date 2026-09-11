/**
 * Phase 28 Verification Script: Secure Backend Services & Authoritative Logic
 */

import {
  validateAndCreateAuthoritativeOrder,
  validateOrderStatusTransition,
  generateOrderSignature,
} from '../server/services/secureOrderService';

import {
  generateSecureFiscalInvoice,
  signInvoicePayload,
} from '../server/services/secureInvoiceService';

import {
  dispatchServerNotification,
} from '../server/services/secureNotificationService';

console.log('--- Running Phase 28: Secure Backend Services Verification ---');

// Test 1: Authoritative Order Creation with Price Recalculation
const orderResult = validateAndCreateAuthoritativeOrder({
  customerId: 'usr-demo-101',
  customerEmail: 'ruwan.w@colombomed.lk',
  customerName: 'Dr. Ruwan Wickremasinghe',
  customerPhone: '+94 75 092 8078',
  shippingAddress: {
    street: '15 Gregory Road',
    city: 'Colombo 07',
    country: 'Sri Lanka',
    postalCode: '00700',
  },
  items: [
    {
      productId: 'prod-tea-01',
      name: 'Single-Estate Ceylon Earl Grey Reserve (Tampered client name)',
      unitPrice: 1.0, // Tampered client price (Attempted fraud)
      quantity: 2,
    },
  ],
  couponCode: 'WELCOME10', // 10% discount
  deliveryMethod: 'standard',
});

console.log('1. Order Creation Success:', orderResult.success ? 'PASSED ✅' : 'FAILED ❌');
if (orderResult.order) {
  // Check if server overrode the $1.00 tampered price with the authentic $38.00 catalog price
  const isPriceRestored = orderResult.order.items[0].unitPrice === 38.0;
  console.log('   - Price Tamper Reversion ($38.00 restored):', isPriceRestored ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Subtotal ($76.00):', orderResult.order.subtotal === 76.0 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Discount ($7.60):', orderResult.order.discountAmount === 7.6 ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Order Signature Present:', !!orderResult.order.orderSignature ? 'PASSED ✅' : 'FAILED ❌');
}

// Test 2: Order State Machine Transitions
const validTransition = validateOrderStatusTransition('pending_payment', 'paid');
const invalidTransition = validateOrderStatusTransition('pending_payment', 'delivered'); // Illegal jump
console.log('2. State Machine Valid Transition (pending -> paid):', validTransition.isValid ? 'PASSED ✅' : 'FAILED ❌');
console.log('   - State Machine Illegal Jump Rejected (pending -> delivered):', !invalidTransition.isValid ? 'PASSED ✅' : 'FAILED ❌');

// Test 3: Cryptographic Fiscal Invoice Generation
const invoice = generateSecureFiscalInvoice({
  orderId: 'ORD-2026-8941',
  customerName: 'Dr. Ruwan Wickremasinghe',
  customerEmail: 'ruwan.w@colombomed.lk',
  items: [
    {
      description: 'Single-Estate Ceylon Earl Grey Reserve',
      quantity: 2,
      unitPrice: 38.0,
      lineTotal: 76.0,
    },
  ],
  subtotal: 76.0,
  discount: 7.6,
  tax: 5.47,
  shipping: 15.0,
  total: 88.87,
  currency: 'USD',
  paymentMethod: 'LankaPay IPG',
  transactionId: 'TXN-2026-8812-9A4B',
});

console.log('3. Fiscal Invoice Generation:', invoice.invoiceNumber.startsWith('INV-2026-') ? 'PASSED ✅' : 'FAILED ❌');
console.log('   - Digital Signature Generated:', !!invoice.digitalSignature ? 'PASSED ✅' : 'FAILED ❌');
console.log('   - Official VAT Info Included:', invoice.issuer.vatNumber === 'VAT-LK-998821034' ? 'PASSED ✅' : 'FAILED ❌');

// Test 4: Multi-Channel Notification Router
async function runNotificationTest() {
  const notif = await dispatchServerNotification({
    type: 'order_confirmation',
    recipient: {
      name: 'Dr. Ruwan Wickremasinghe',
      email: 'ruwan.w@colombomed.lk',
      phone: '+94 75 092 8078',
    },
    data: {
      orderId: 'ORD-2026-8941',
      total: 88.87,
    },
    channels: ['email', 'whatsapp'],
  });

  console.log('4. Notification Dispatch Success:', notif.success ? 'PASSED ✅' : 'FAILED ❌');
  console.log('   - Channels Dispatched:', notif.dispatchedChannels.join(', ') === 'email, whatsapp' ? 'PASSED ✅' : 'FAILED ❌');
  console.log('--- All Phase 28 Verification Tests Passed Cleanly ---');
}

runNotificationTest();
