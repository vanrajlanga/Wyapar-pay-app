/**
 * i18n Configuration
 * Internationalization setup for WyaparPay
 * Supports: English, Hindi, Kannada
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import English translations
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enRecharge from './locales/en/recharge.json';
import enProfile from './locales/en/profile.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';
import enPaymentSuccess from './locales/en/payment-success.json';
import enTransactions from './locales/en/transactions.json';
import enContact from './locales/en/contact.json';

// Import Hindi translations
import hiCommon from './locales/hi/common.json';
import hiDashboard from './locales/hi/dashboard.json';
import hiRecharge from './locales/hi/recharge.json';
import hiProfile from './locales/hi/profile.json';
import hiAuth from './locales/hi/auth.json';
import hiErrors from './locales/hi/errors.json';
import hiPaymentSuccess from './locales/hi/payment-success.json';
import hiTransactions from './locales/hi/transactions.json';
import hiContact from './locales/hi/contact.json';

// Import Kannada translations
import knCommon from './locales/kn/common.json';
import knDashboard from './locales/kn/dashboard.json';
import knRecharge from './locales/kn/recharge.json';
import knProfile from './locales/kn/profile.json';
import knAuth from './locales/kn/auth.json';
import knErrors from './locales/kn/errors.json';
import knPaymentSuccess from './locales/kn/payment-success.json';
import knTransactions from './locales/kn/transactions.json';
import knContact from './locales/kn/contact.json';

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    recharge: enRecharge,
    profile: enProfile,
    auth: enAuth,
    errors: enErrors,
    'payment-success': enPaymentSuccess,
    transactions: enTransactions,
    contact: enContact,
  },
  hi: {
    common: hiCommon,
    dashboard: hiDashboard,
    recharge: hiRecharge,
    profile: hiProfile,
    auth: hiAuth,
    errors: hiErrors,
    'payment-success': hiPaymentSuccess,
    transactions: hiTransactions,
    contact: hiContact,
  },
  kn: {
    common: knCommon,
    dashboard: knDashboard,
    recharge: knRecharge,
    profile: knProfile,
    auth: knAuth,
    errors: knErrors,
    'payment-success': knPaymentSuccess,
    transactions: knTransactions,
    contact: knContact,
  },
};

// Get device language (first two letters, e.g., 'en' from 'en-US')
const deviceLanguage = Localization.getLocales()?.[0]?.languageCode || 'en';

// Check if device language is supported, otherwise default to English
const defaultLanguage = ['en', 'hi', 'kn'].includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage, // Auto-detect device language
  fallbackLng: 'en', // Fallback to English
  defaultNS: 'common', // Default namespace
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false, // Disable suspense for Expo
  },
});

export default i18n;

// Export supported languages for language selector
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
];
