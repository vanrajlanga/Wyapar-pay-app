/**
 * i18n Formatting Utilities
 *
 * Centralized formatting functions for currency, dates, numbers, etc.
 * All formatting respects the current language setting.
 *
 * @module i18nFormatters
 */

import i18n from '../i18n';

/**
 * Get locale string based on current language
 */
const getLocale = (): string => {
  const lang = i18n.language;
  switch (lang) {
    case 'hi':
      return 'hi-IN';
    case 'kn':
      return 'kn-IN';
    case 'en':
    default:
      return 'en-IN';
  }
};

/**
 * Format currency based on current locale
 *
 * @example
 * ```typescript
 * formatCurrency(1250); // "₹1,250" (en) | "₹१,२५०" (hi) | "₹೧,೨೫೦" (kn)
 * formatCurrency(99.50); // "₹99.50"
 * ```
 */
export const formatCurrency = (
  amount: number,
  showDecimals: boolean = false
): string => {
  const locale = getLocale();

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Format date based on current locale
 *
 * @example
 * ```typescript
 * formatDate(new Date()); // "January 6, 2025" (en) | "६ जनवरी, २०२५" (hi)
 * formatDate('2025-01-06'); // Same output
 * ```
 */
export const formatDate = (
  date: Date | string,
  style: 'short' | 'medium' | 'long' = 'long'
): string => {
  const locale = getLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }
      : style === 'medium'
        ? { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' }
        : { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' };

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format date with time
 *
 * @example
 * ```typescript
 * formatDateTime(new Date()); // "January 6, 2025, 10:30 AM"
 * ```
 */
export const formatDateTime = (date: Date | string): string => {
  const locale = getLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(dateObj);
};

/**
 * Format time only
 *
 * @example
 * ```typescript
 * formatTime(new Date()); // "10:30 AM"
 * ```
 */
export const formatTime = (date: Date | string): string => {
  const locale = getLocale();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(dateObj);
};

/**
 * Format number based on current locale
 *
 * @example
 * ```typescript
 * formatNumber(123456); // "1,23,456" (Indian numbering)
 * ```
 */
export const formatNumber = (num: number): string => {
  const locale = getLocale();
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format phone number for display
 *
 * @example
 * ```typescript
 * formatPhoneNumber('9999999999'); // "+91 99999 99999"
 * formatPhoneNumber('8105237629'); // "+91 81052 37629"
 * ```
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Indian phone number format: +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }

  return phone; // Return as-is if not 10 digits
};

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 *
 * @example
 * ```typescript
 * formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
 * formatRelativeTime(new Date(Date.now() - 86400000)); // "Yesterday"
 * ```
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const lang = i18n.language;

  // Translations for relative time
  const translations = {
    en: {
      justNow: 'Just now',
      minutesAgo: (n: number) => `${n} minute${n > 1 ? 's' : ''} ago`,
      hoursAgo: (n: number) => `${n} hour${n > 1 ? 's' : ''} ago`,
      yesterday: 'Yesterday',
      daysAgo: (n: number) => `${n} day${n > 1 ? 's' : ''} ago`,
    },
    hi: {
      justNow: 'अभी',
      minutesAgo: (n: number) => `${n} मिनट पहले`,
      hoursAgo: (n: number) => `${n} घंटे पहले`,
      yesterday: 'कल',
      daysAgo: (n: number) => `${n} दिन पहले`,
    },
    kn: {
      justNow: 'ಈಗ',
      minutesAgo: (n: number) => `${n} ನಿಮಿಷಗಳ ಹಿಂದೆ`,
      hoursAgo: (n: number) => `${n} ಗಂಟೆಗಳ ಹಿಂದೆ`,
      yesterday: 'ನಿನ್ನೆ',
      daysAgo: (n: number) => `${n} ದಿನಗಳ ಹಿಂದೆ`,
    },
  };

  const t = translations[lang as keyof typeof translations] || translations.en;

  if (diffSecs < 60) return t.justNow;
  if (diffMins < 60) return t.minutesAgo(diffMins);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  if (diffDays === 1) return t.yesterday;
  if (diffDays < 7) return t.daysAgo(diffDays);

  // For older dates, use formatDate
  return formatDate(dateObj, 'medium');
};

/**
 * Pluralize translation based on count
 *
 * @example
 * ```typescript
 * pluralize(t, 'transaction', 1); // "1 transaction"
 * pluralize(t, 'transaction', 5); // "5 transactions"
 * ```
 */
export const pluralize = (
  t: (key: string, options?: any) => string,
  key: string,
  count: number
): string => {
  if (count === 1) {
    return t(`${key}_one`, { count });
  }
  return t(`${key}_other`, { count });
};
