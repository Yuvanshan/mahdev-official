/**
 * Currency Formatting & Symbol Mapping
 * Dynamic multi-currency support aligned with Firestore single source of truth.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  LKR: 'Rs. ',
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
 * Returns the currency symbol for a given currency code (e.g., 'USD' -> '$', 'LKR' -> 'Rs. ')
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const code = (currencyCode || 'USD').toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/**
 * Formats a numeric price into localized currency representation
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currencyCode);
  const code = (currencyCode || 'USD').toUpperCase();

  // For LKR or JPY with no decimals or standard decimals
  if (code === 'LKR' || code === 'INR') {
    return `${symbol}${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (code === 'EUR' || code === 'GBP') {
    return `${symbol}${validAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Default USD
  return `${symbol}${validAmount.toFixed(2)}`;
}
