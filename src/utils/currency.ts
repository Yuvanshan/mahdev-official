/**
 * Currency Formatting & Symbol Mapping
 * Dynamic multi-currency support aligned with Firestore single source of truth.
 * Default Currency: LKR (Rs. / Sri Lankan Rupees)
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: 'Rs. ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  INR: '₹',
  AED: 'AED ',
  JPY: '¥',
};

/**
 * Returns the currency symbol for a given currency code (e.g., 'LKR' -> 'Rs. ', 'USD' -> '$')
 */
export function getCurrencySymbol(currencyCode: string = 'LKR'): string {
  const code = (currencyCode || 'LKR').toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/**
 * Formats a numeric price into localized currency representation (Default: LKR / Rs.)
 */
export function formatCurrency(amount: number, currencyCode: string = 'LKR'): string {
  const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currencyCode);
  const code = (currencyCode || 'LKR').toUpperCase();

  // For LKR, INR, USD, EUR, etc. with clean localized comma separation
  return `${symbol}${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
