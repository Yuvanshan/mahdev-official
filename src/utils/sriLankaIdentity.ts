/**
 * Sri Lankan National Identity Card (NIC) and phone number helpers, shared by
 * the registration form and the API (backend/api/tursoRoutes.ts), so the
 * browser and the server always agree on what is valid.
 *
 * NIC formats:
 *  - Old: 9 digits + V or X (e.g. 951234567V). Digits 1-2 = birth year (19YY).
 *  - New: 12 digits (e.g. 199512345678). Digits 1-4 = birth year.
 * The next 3 digits are the day of the year of birth, plus 500 for women. NIC
 * day numbers always count February as 29 days, whatever the year.
 */

export type NicGender = 'male' | 'female';

export interface NicDetails {
  /** Normalised NIC: upper case, no spaces. */
  nic: string;
  format: 'old' | 'new';
  /** ISO date, YYYY-MM-DD. */
  dateOfBirth: string;
  gender: NicGender;
}

// NIC day numbering: February always has 29 days.
const NIC_MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MAX_AGE_YEARS = 120;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function normaliseNic(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Reads the date of birth and gender encoded in a NIC.
 * Returns null when the number is not a valid NIC.
 */
export function parseNic(value: string, today: Date = new Date()): NicDetails | null {
  const nic = normaliseNic(value);
  const oldFormat = /^(\d{2})(\d{3})\d{4}[VX]$/.exec(nic);
  const newFormat = /^(\d{4})(\d{3})\d{5}$/.exec(nic);
  const match = oldFormat || newFormat;
  if (!match) return null;

  const year = oldFormat ? 1900 + Number(match[1]) : Number(match[1]);
  let dayOfYear = Number(match[2]);
  const gender: NicGender = dayOfYear > 500 ? 'female' : 'male';
  if (gender === 'female') dayOfYear -= 500;
  if (dayOfYear < 1 || dayOfYear > 366) return null;

  // Walk the NIC calendar to find the month and day.
  let month = 0;
  let day = dayOfYear;
  while (day > NIC_MONTH_DAYS[month]) {
    day -= NIC_MONTH_DAYS[month];
    month += 1;
  }
  // 29 February only exists in leap years.
  if (month === 1 && day === 29 && !isLeapYear(year)) return null;

  const dateOfBirth = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (birth.getTime() > today.getTime() || today.getUTCFullYear() - year > MAX_AGE_YEARS) return null;

  return { nic, format: oldFormat ? 'old' : 'new', dateOfBirth, gender };
}

/** Age in whole years on the given day. */
export function ageFromDateOfBirth(dateOfBirth: string, today: Date = new Date()): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
}

/**
 * Normalises a Sri Lankan phone number to +94XXXXXXXXX.
 * Accepts 0771234567, 771234567, 94771234567, +94 77 123 4567 and 0094771234567.
 * Returns null when it is not a valid Sri Lankan number.
 */
export function normaliseSriLankaPhone(value: string): string | null {
  let digits = value.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('0094')) digits = digits.slice(4);
  else if (digits.startsWith('94') && digits.length === 11) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 10) digits = digits.slice(1);
  // Subscriber numbers are 9 digits and never start with 0.
  return /^[1-9]\d{8}$/.test(digits) ? `+94${digits}` : null;
}

/** Display form of a normalised number: +94 77 123 4567. */
export function formatSriLankaPhone(value: string): string {
  const match = /^\+94(\d{2})(\d{3})(\d{4})$/.exec(value);
  return match ? `+94 ${match[1]} ${match[2]} ${match[3]}` : value;
}
