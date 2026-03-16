/**
 * KWIKAPI Integration Interfaces
 *
 * TypeScript interfaces for KWIKAPI recharge and bill payment gateway
 */

/**
 * Base KWIKAPI Response
 */
export interface KwikApiBaseResponse {
  status: boolean;
  message: string;
  error?: string;
  error_code?: string;
}

/**
 * Mobile Recharge Request
 */
export interface KwikApiRechargeRequest {
  number: string;      // Mobile number
  amount: number;      // Recharge amount
  opid: string;        // Operator ID (from detection)
  state_code: number;  // Always 0 as per KWIKAPI docs
  order_id: string;    // Unique transaction ID (max 20 digits)
}

/**
 * Mobile Recharge Response (Real KWIKAPI format)
 * Note: This is the immediate response - always check status separately!
 */
export interface KwikApiRechargeResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  order_id: string;
  opr_id: string;
  balance: string;           // KWIKAPI wallet balance after recharge
  number: string;            // Mobile number recharged
  provider: string;          // Operator name (e.g., "Airtel")
  amount: string;            // Recharge amount
  charged_amount: string;    // Amount charged from KWIKAPI wallet
  message: string;           // Response message
}

/**
 * Operator Plan Request (form-data)
 */
export interface KwikApiPlanRequest {
  api_key: string;
  state_code: string;  // Circle code (e.g., "17")
  opid: string;        // Operator ID (e.g., "3")
}

/**
 * Single Plan from KWIKAPI
 */
export interface KwikApiRawPlan {
  Type: string;        // e.g., "Internet", "DATA", "Entertainment"
  rs: number;          // Price in rupees
  validity: string;    // e.g., "28 Days", "1 Day", "NA"
  desc: string;        // Full description
}

/**
 * Plans Response from KWIKAPI v2 (Real format)
 */
export interface KwikApiPlansResponse {
  success: boolean;
  hit_credit: string;
  api_started: string;
  api_expiry: string;
  operator: string;    // e.g., "Jio"
  circle: string;      // e.g., "MAHARASHTRA"
  message: string;
  plans: {
    DATA?: KwikApiRawPlan[];
    STV?: KwikApiRawPlan[];
    FULLTT?: KwikApiRawPlan[];
    PlanVoucher?: KwikApiRawPlan[];
    TOPUP?: KwikApiRawPlan[];
    Romaing?: KwikApiRawPlan[];
    SMS?: KwikApiRawPlan[];
    [key: string]: KwikApiRawPlan[] | undefined;
  };
}

/**
 * Normalized Plan (for frontend)
 */
export interface KwikApiPlan {
  id: string;
  amount: number;
  validity: string;
  description: string;
  category: string;
  type: string;
  operator?: string;
  circle?: string;
  benefits?: string[];
}

/**
 * Operator Detection Request (form-data)
 */
export interface KwikApiDetectOperatorRequest {
  api_key: string;
  number: string;
}

/**
 * Operator Detection Response (Real format from KWIKAPI v2)
 */
export interface KwikApiDetectOperatorResponse {
  success: boolean;
  message: string | null;
  credit_balance: string;
  api_started: string | null;
  api_expiry: string | null;
  version_details: {
    version: string;
    role: string;
    message: string;
  };
  details: {
    provider: string; // e.g., "BSNL Postpaid"
    opid: string; // Operator ID
    circle_code: string;
    circle_name: string; // e.g., "UTTAR PRADESH West (UPW)"
  };
}

/**
 * Transaction Status Request
 */
export interface KwikApiStatusRequest {
  transaction_id?: string;
  order_id?: string;
}

/**
 * Transaction Status Response (Real KWIKAPI format)
 */
export interface KwikApiStatusResponse {
  response: {
    order_id: string;
    operator_ref: string;
    opr_id: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    number: string;
    amount: string;
    service: string;
    charged_amount: string;
    closing_balance: string;
    available_balance: string;
    pid: string;
    date: string;
  };
}

/**
 * Balance Check Response (Real KWIKAPI format)
 */
export interface KwikApiBalanceResponse {
  response: {
    balance: string;
    plan_credit: string;
  };
}

/**
 * Operator List Response
 */
export interface KwikApiOperatorsResponse extends KwikApiBaseResponse {
  data?: {
    operators: Array<{
      code: string;
      name: string;
      type: 'PREPAID' | 'POSTPAID';
      is_active: boolean;
    }>;
  };
}

/**
 * Circle List Response
 */
export interface KwikApiCirclesResponse extends KwikApiBaseResponse {
  data?: {
    circles: Array<{
      code: string;
      name: string;
      state: string;
    }>;
  };
}

/**
 * Bill Payment Request (for future use)
 */
export interface KwikApiBillPaymentRequest {
  biller_id: string;
  customer_id: string;
  amount: number;
  order_id: string;
  customer_params?: Record<string, any>;
}

/**
 * Bill Payment Response (for future use)
 */
export interface KwikApiBillPaymentResponse extends KwikApiBaseResponse {
  data?: {
    transaction_id: string;
    order_id: string;
    biller_id: string;
    amount: number;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    bill_details?: Record<string, any>;
    timestamp: string;
  };
}

/**
 * KWIKAPI Error Codes (common ones)
 */
export enum KwikApiErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_OPERATOR = 'INVALID_OPERATOR',
  INVALID_CIRCLE = 'INVALID_CIRCLE',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  OPERATOR_DOWN = 'OPERATOR_DOWN',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
