/**
 * RechargeExchange API Constants
 */

export const RECHARGEEXCHANGE_ENDPOINTS = {
  TRANSACTION: 'https://api.RechargeExchange.com/API.asmx/Transaction',
  BALANCE: 'https://status.rechargeexchange.com/API.asmx/BalanceNew',
  TRANSACTION_STATUS: 'https://status.rechargeexchange.com/API.asmx/TransactionStatus',
  COMPLAIN: 'https://api.RechargeExchange.com/API.asmx/Complain',
  OPERATOR_LIST: 'https://api.RechargeExchange.com/API.asmx/OperatorList',
} as const;

/**
 * Live Operator Codes from RechargeExchange
 */
export const RECHARGEEXCHANGE_OPERATORS: Record<string, string> = {
  Airtel: '10',
  'BSNL - Special Tariff': '11',
  'BSNL - Talktime': '12',
  'MTNL - Talktime': '13',
  'Reliance Jio': '14',
  VI: '15',
  'Airtel Digital TV': '16',
  'Dish TV': '17',
  'Sun Direct': '18',
  'Tata Sky': '19',
  'Videocon d2h': '20',
  'MTNL - Special Tariff': '21',
};

/**
 * Status mapping from RechargeExchange to internal status
 */
export const RECHARGEEXCHANGE_STATUS_MAP: Record<string, string> = {
  SUCCESS: 'SUCCESS',
  FAIL: 'FAILED',
  PENDING: 'PROCESSING',
  REFUND: 'REFUNDED',
};

/**
 * Cache TTL in seconds
 * Balance: once per 10 min as per RE docs
 * Status: check after 5 min as per RE docs
 */
export const RECHARGEEXCHANGE_CACHE_TTL = {
  BALANCE: 600,  // 10 minutes
} as const;

export const RECHARGEEXCHANGE_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 5000,
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
} as const;
