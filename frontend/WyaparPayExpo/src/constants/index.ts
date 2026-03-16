/**
 * Application Constants
 * Centralized location for all constants to avoid magic strings
 */

// Export operator and service utilities
export * from './operators';
export * from './service-icons';

// Storage keys for SecureStore and AsyncStorage
export const SECURE_STORAGE_KEYS = {
  BIOMETRIC_USER_ID: 'biometric_user_id',
  BIOMETRIC_TOKEN: 'biometric_token',
  BIOMETRIC_REFRESH_TOKEN: 'biometric_refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

// API Configuration
// DEV: local backend | PROD: https://apiwyaparpay.kabootz.in
export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3000', // Local backend (Android emulator → host localhost)
  API_VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    REQUEST_OTP: '/auth/request-otp',
    OTP_LOGIN: '/auth/otp-login',
    VERIFY_OTP: '/auth/verify-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USER: {
    PROFILE: '/user/profile',
    PREFERENCES: '/user/preferences',
    DOCUMENTS: '/user/documents',
    KYC: '/user/kyc',
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    TRANSFER: '/wallet/transfer',
  },
  NOTIFICATIONS: {
    REGISTER_DEVICE: '/notifications/register-device',
    PREFERENCES: '/notifications/preferences',
    STATS: '/notifications/stats',
  },
  RECHARGE: {
    DETECT_OPERATOR: '/recharge/detect-operator',
    GET_OPERATORS: '/recharge/operators',
    GET_ALL_OPERATORS: '/recharge/all-operators', // Get cached operators from database
    FETCH_AND_STORE_OPERATORS: '/recharge/fetch-operators', // Admin: Sync operators from KWIKAPI
    GET_CIRCLES: (operatorCode: string) => `/recharge/circles/${operatorCode}`,
    GET_ALL_CIRCLES: '/recharge/all-circles', // Get cached circles from database
    FETCH_AND_STORE_CIRCLES: '/recharge/fetch-circles', // Admin: Sync circles from KWIKAPI
    GET_PLANS: '/recharge/plans',
    VALIDATE: '/recharge/validate',
    PROCESS_MOBILE: '/recharge/mobile',
    GET_HISTORY: '/recharge/history',
    GET_FAVORITES: '/recharge/favorites',
    ADD_FAVORITE: '/recharge/favorites',
    REMOVE_FAVORITE: (id: string) => `/recharge/favorites/${id}`,
    KWIKAPI_BALANCE: '/recharge/kwikapi/balance',
    KWIKAPI_RECHARGE: '/recharge/kwikapi/recharge',
    KWIKAPI_STATUS: '/recharge/kwikapi/status',
    RE_STATUS: '/recharge/status',
    RE_BALANCE: '/recharge/re/balance',
    DTH_PLANS: '/recharge/dth/plans',
    PROCESS_DTH: '/recharge/dth',
  },
  PAYMENT: {
    CREATE_ORDER: '/payment/create-order',
    VERIFY: '/payment/verify',
    GET_TRANSACTION: (id: string) => `/payment/transaction/${id}`,
  },
  TRANSACTIONS: {
    GET_ALL: '/transactions',
    GET_BY_ID: (id: string) => `/transactions/${id}`,
    GET_SUMMARY: '/transactions/summary/overview',
    GET_RECENT: '/transactions/recent/list',
    GET_BY_CATEGORY: (category: string) => `/transactions/category/${category}`,
    SEARCH: '/transactions/search/query',
    GET_STATS: '/transactions/stats/analytics',
    UPDATE_STATUS: (id: string) => `/transactions/${id}/status`,
  },
} as const;

// Default test credentials (only for development)
// ⚠️ SECURITY: These are only available in development builds
// Production builds will have this as null to prevent security issues
export const DEFAULT_TEST_CREDENTIALS = __DEV__ ? {
  PHONE: '1234567899',
  EMAIL: 'admin@wyaparpay.com',
  PASSWORD: 'admin',
  OTP: '123456',
} : null;

// Biometric type display names
export const BIOMETRIC_TYPE_NAMES = {
  faceId: 'Face ID',
  fingerprint: 'Fingerprint',
  iris: 'Iris Scan',
  none: 'Biometric',
} as const;

// App theme colors (matching website design)
export const THEME_COLORS = {
  PRIMARY: '#F97316', // Orange-500
  SECONDARY: '#DC2626', // Red-600
  BACKGROUND: '#F8F9FA', // Light gray background
  WHITE: '#FFFFFF',
  ERROR: '#EF476F',
  SUCCESS: '#06D6A0',
  WARNING: '#FFB800',
  TEXT_PRIMARY: '#202124', // Dark text
  TEXT_SECONDARY: '#5F6368', // Gray text
} as const;

// Validation patterns
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[6-9]\d{9}$/,
  PASSWORD_MIN_LENGTH: 6,
  OTP_LENGTH: 6,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  INVALID_CREDENTIALS: 'Invalid credentials. Please check and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again.',
  BIOMETRIC_NOT_AVAILABLE:
    'Biometric authentication is not available on this device.',
  BIOMETRIC_NOT_ENROLLED: 'Please enroll biometrics in your device settings.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful! Please verify your email.',
  VERIFICATION_SUCCESS: 'Email verified successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PREFERENCES_UPDATED: 'Preferences updated successfully.',
  BIOMETRIC_ENABLED: 'Biometric login enabled successfully!',
  BIOMETRIC_DISABLED: 'Biometric login disabled.',
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  COMING_SOON: 'Coming Soon',
  FEATURE_UNAVAILABLE: 'This feature is not available yet.',
  UNDER_DEVELOPMENT: 'This feature is under development.',
  MAINTENANCE_MODE: 'This feature is temporarily unavailable.',
} as const;
