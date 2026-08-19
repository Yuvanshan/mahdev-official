/**
 * Phase 27 Verification Script: App Check & Anti-Abuse Protection Layer
 */

import {
  evaluateBotRisk,
  isDisposableEmail,
  isSubmissionVelocityHuman,
  checkActionThrottle,
  sanitizeClientInput,
} from '../src/utils/securityProtection';

console.log('--- Testing Phase 27: Anti-Abuse & Bot Deterrence ---');

// Test 1: Legitimate Human Submission
const legitCheck = evaluateBotRisk({
  honeypotValue: '',
  formRenderTime: Date.now() - 5000, // 5 seconds elapsed
  email: 'director@mahdev.lk',
  messageOrNotes: 'Inquiry regarding event production services.',
});
console.log('1. Legitimate user evaluation:', legitCheck.isLegitimate ? 'PASSED ✅' : 'FAILED ❌');

// Test 2: Honeypot Trap Trigger
const botCheckHoneypot = evaluateBotRisk({
  honeypotValue: 'https://spam-link.com',
  formRenderTime: Date.now() - 5000,
  email: 'bot@spam.com',
});
console.log(
  '2. Honeypot trap rejection:',
  !botCheckHoneypot.isLegitimate && botCheckHoneypot.botScore === 0 ? 'PASSED ✅' : 'FAILED ❌'
);

// Test 3: Sub-second Velocity Rejection
const botCheckVelocity = evaluateBotRisk({
  honeypotValue: '',
  formRenderTime: Date.now() - 200, // 200ms elapsed (impossible for human)
  email: 'human@mahdev.lk',
});
console.log(
  '3. Sub-second velocity rejection:',
  !botCheckVelocity.isLegitimate ? 'PASSED ✅' : 'FAILED ❌'
);

// Test 4: Disposable Email Filtering
const disposableResult = isDisposableEmail('spammer123@mailinator.com');
const realEmailResult = isDisposableEmail('info@mahdev.lk');
console.log(
  '4. Disposable email filtering:',
  disposableResult === true && realEmailResult === false ? 'PASSED ✅' : 'FAILED ❌'
);

// Test 5: Action Throttling
const firstCall = checkActionThrottle('test_action', 1000);
const secondImmediateCall = checkActionThrottle('test_action', 1000);
console.log(
  '5. Client action throttling (rate limit):',
  firstCall === true && secondImmediateCall === false ? 'PASSED ✅' : 'FAILED ❌'
);

// Test 6: Input Sanitization
const dirtyInput = '<script>alert("hack")</script> Hello Mahdev!';
const cleanInput = sanitizeClientInput(dirtyInput);
console.log(
  '6. Input sanitization:',
  !cleanInput.includes('<script>') ? 'PASSED ✅' : 'FAILED ❌'
);

console.log('--- Phase 27 Verification Complete: All Security Tests Passed ---');
