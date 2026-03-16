/**
 * KWIKAPI Constants
 *
 * API endpoints, operator codes, and other constants for KWIKAPI integration
 */

/**
 * KWIKAPI Endpoints
 * Real endpoints from KWIKAPI documentation
 */
export const KWIKAPI_ENDPOINTS = {
  // Operator & Circle Detection (Real endpoint - v2)
  DETECT_OPERATOR: '/api/v2/operator_fetch_v2.php',

  // Recharge endpoints (to be added later)
  MOBILE_RECHARGE: '/api/v2/recharge.php', // Placeholder - update with real endpoint
  DTH_RECHARGE: '/api/v2/dth_recharge.php',

  // Plan endpoints
  GET_PLANS: '/api/v2/recharge_plans.php',      // Mobile plans
  GET_OPERATOR_PLANS: '/api/v2/recharge_plans.php',
  DTH_PLANS: '/api/v2/DTH_plans.php',           // DTH plans

  // Other endpoints (to be added later)
  GET_OPERATORS: '/api/v2/operators.php', // Placeholder
  GET_CIRCLES: '/api/v2/circles.php', // Placeholder
  CHECK_STATUS: '/api/v2/status.php', // Placeholder
  GET_BALANCE: '/api/v2/balance.php', // Placeholder

  // Bill payment endpoints (for future use)
  BILL_PAYMENT: '/api/v2/billpay.php', // Placeholder
  GET_BILLERS: '/api/v2/billers.php', // Placeholder
  FETCH_BILL: '/api/v2/fetch_bill.php', // Placeholder
} as const;

/**
 * KWIKAPI Operator Codes
 * Map your internal operator codes to KWIKAPI operator codes
 */
export const OPERATOR_CODE_MAP: Record<string, string> = {
  // Prepaid
  JIO: 'JIO',
  AIRTEL: 'AIRTEL',
  VI: 'VI', // Vodafone Idea
  VODAFONE: 'VI',
  IDEA: 'VI',
  BSNL: 'BSNL',
  MTNL: 'MTNL',

  // Postpaid
  JIO_POSTPAID: 'JIO_POSTPAID',
  AIRTEL_POSTPAID: 'AIRTEL_POSTPAID',
  VI_POSTPAID: 'VI_POSTPAID',
  BSNL_POSTPAID: 'BSNL_POSTPAID',
};

/**
 * KWIKAPI Circle Codes
 * Map state/region names to KWIKAPI circle codes
 */
export const CIRCLE_CODE_MAP: Record<string, string> = {
  ANDHRA_PRADESH: 'AP',
  ASSAM: 'ASSAM',
  BIHAR: 'BIHAR',
  CHENNAI: 'CHENNAI',
  DELHI: 'DELHI',
  GUJARAT: 'GUJARAT',
  HARYANA: 'HARYANA',
  HIMACHAL_PRADESH: 'HP',
  JAMMU_KASHMIR: 'JK',
  KARNATAKA: 'KARNATAKA',
  KERALA: 'KERALA',
  KOLKATA: 'KOLKATA',
  MADHYA_PRADESH: 'MP',
  MAHARASHTRA: 'MAHARASHTRA',
  MUMBAI: 'MUMBAI',
  NORTH_EAST: 'NE',
  ODISHA: 'ODISHA',
  PUNJAB: 'PUNJAB',
  RAJASTHAN: 'RAJASTHAN',
  TAMIL_NADU: 'TN',
  TELANGANA: 'TELANGANA',
  UP_EAST: 'UP_EAST',
  UP_WEST: 'UP_WEST',
  WEST_BENGAL: 'WB',
};

/**
 * Plan Categories
 */
export const PLAN_CATEGORIES = {
  POPULAR: 'popular',
  DATA: 'data',
  UNLIMITED: 'unlimited',
  VALIDITY: 'validity',
  ROAMING: 'roaming',
  TALKTIME: 'talktime',
  SMS: 'sms',
  COMBO: 'combo',
} as const;

/**
 * Transaction Status Mapping
 * Map KWIKAPI status to internal status
 */
export const TRANSACTION_STATUS_MAP: Record<string, string> = {
  PENDING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

/**
 * Recharge Amount Limits
 */
export const RECHARGE_LIMITS = {
  MIN_AMOUNT: 10,
  MAX_AMOUNT: 10000,
  POPULAR_AMOUNTS: [10, 20, 50, 100, 200, 500, 1000],
};

/**
 * API Retry Configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 5000, // 5 seconds
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  OPERATORS: 86400, // 24 hours
  CIRCLES: 86400, // 24 hours
  PLANS: 3600, // 1 hour
  BALANCE: 1800, // 30 minutes (KWIKAPI allows only 2 hits/hour)
} as const;

/**
 * KWIKAPI Plan Category Mapping
 * Maps KWIKAPI plan categories to our internal categories
 */
export const KWIKAPI_PLAN_CATEGORIES = {
  DATA: 'DATA',           // Data only plans
  STV: 'POPULAR',         // Special tariff voucher - usually popular plans
  FULLTT: 'UNLIMITED',    // Full talktime/unlimited plans
  PlanVoucher: 'COMBO',   // Plan vouchers - combo plans
  TOPUP: 'TALKTIME',      // Top-up/talktime plans
  Romaing: 'ROAMING',     // Roaming plans (if available)
  SMS: 'SMS',             // SMS plans (if available)
} as const;
