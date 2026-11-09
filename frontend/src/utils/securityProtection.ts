/**
 * Mahdev Enterprise Security & Anti-Abuse Protection Layer (Phase 27)
 * Provides bot deterrence, honeypot traps, spam filtering, velocity validation,
 * and disposable email defense for forms, bookings, and customer registration.
 */

// Known disposable and temporary burner email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'temp-mail.org',
  'mohmal.com',
  'crazymailing.com',
  'burnermail.io',
  'nada.ltd',
  'inboxbear.com',
]);

export interface BotCheckResult {
  isLegitimate: boolean;
  reason?: string;
  botScore?: number; // 0 (bot) to 1.0 (human)
}

export interface FormSecurityPayload {
  honeypot?: string;
  formRenderTime?: number;
  clientNonce?: string;
}

/**
 * Validates whether an email address belongs to a disposable temporary domain
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validates submission velocity: humans typically take at least 2-3 seconds to read and fill forms
 */
export function isSubmissionVelocityHuman(renderTimestamp?: number, minDurationMs = 1500): boolean {
  if (!renderTimestamp) return true; // If not provided, pass through
  const elapsed = Date.now() - renderTimestamp;
  return elapsed >= minDurationMs;
}

/**
 * Comprehensive anti-bot evaluation for form submissions
 */
export function evaluateBotRisk(payload: {
  honeypotValue?: string;
  formRenderTime?: number;
  email?: string;
  messageOrNotes?: string;
}): BotCheckResult {
  // 1. Honeypot check: If the hidden field has any value, an automated script filled it
  if (payload.honeypotValue && payload.honeypotValue.trim().length > 0) {
    console.warn('[SecurityGuard] Automated bot trapped via honeypot field.');
    return {
      isLegitimate: false,
      reason: 'Automated submission detected (honeypot trap triggered).',
      botScore: 0.0,
    };
  }

  // 2. Velocity check: Form submitted faster than a human could physically interact
  if (payload.formRenderTime && !isSubmissionVelocityHuman(payload.formRenderTime)) {
    console.warn('[SecurityGuard] Automated submission rejected due to sub-second completion velocity.');
    return {
      isLegitimate: false,
      reason: 'Submission occurred too quickly. Please take a moment to review and resubmit.',
      botScore: 0.1,
    };
  }

  // 3. Disposable email check
  if (payload.email && isDisposableEmail(payload.email)) {
    return {
      isLegitimate: false,
      reason: 'Disposable temporary email addresses are not permitted. Please use a verified personal or business email.',
      botScore: 0.2,
    };
  }

  // 4. Repeated character or spam payload detection
  if (payload.messageOrNotes) {
    const text = payload.messageOrNotes;
    // Check for spam phrases
    const spamPatterns = [
      /buy cheap /i,
      /crypto profit/i,
      /casino online/i,
      /viagra/i,
      /seo ranking boost guaranteed/i,
    ];
    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        return {
          isLegitimate: false,
          reason: 'Your message was flagged by our automated spam filter.',
          botScore: 0.0,
        };
      }
    }
  }

  return {
    isLegitimate: true,
    botScore: 0.95,
  };
}

/**
 * Client-side throttle manager to prevent double-clicking or rapid-fire request abuse
 */
const lastActionTimestamps = new Map<string, number>();

export function checkActionThrottle(actionKey: string, cooldownMs = 2500): boolean {
  const now = Date.now();
  const lastTime = lastActionTimestamps.get(actionKey);

  if (lastTime && now - lastTime < cooldownMs) {
    return false; // Throttled
  }

  lastActionTimestamps.set(actionKey, now);
  return true; // Allowed
}

/**
 * Sanitizes input string to prevent XSS injection
 */
export function sanitizeClientInput(input: string, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // strip dangerous angled brackets
    .trim();
}
