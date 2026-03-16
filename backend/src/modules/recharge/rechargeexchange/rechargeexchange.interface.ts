/**
 * RechargeExchange API Interfaces
 */

/**
 * Transaction Request
 */
export interface RechargeExchangeTransactionRequest {
  opcode: string;   // Operator code (e.g. "14" for Jio)
  number: string;   // Mobile number
  amount: number;   // Recharge amount
  transid: string;  // Client unique ID (no duplicates)
}

/**
 * Transaction Response
 * Status: SUCCESS / FAIL / PENDING
 */
export interface RechargeExchangeTransactionResponse {
  status: 'SUCCESS' | 'FAIL' | 'PENDING';
  message: string;
  transid: string;       // Client unique ID sent in request
  optransid: string;     // Operator transaction ID
  referenceid: string;   // Website reference transaction ID
  number: string;        // Mobile number recharged
  amount: string;        // Recharge amount
  balance: string;       // Available balance after transaction
}

/**
 * Balance Response
 * Status: SUCCESS / FAIL
 */
export interface RechargeExchangeBalanceResponse {
  status: 'SUCCESS' | 'FAIL';
  message: string;
  balance: string;      // Main wallet balance
  sellbalance: string;  // Sell balance
}

/**
 * Transaction Status Request
 */
export interface RechargeExchangeStatusRequest {
  transid: string;  // Client unique ID used in original transaction
}

/**
 * Transaction Status Response
 * Status: SUCCESS / FAIL / PENDING
 */
export interface RechargeExchangeStatusResponse {
  status: 'SUCCESS' | 'FAIL' | 'PENDING';
  optransid: string;   // Operator transaction ID
  referenceid: string; // Website reference transaction ID
  amount: string;
  number: string;
  message: string;
}

/**
 * Complain Request
 */
export interface RechargeExchangeComplainRequest {
  referenceid: string;  // Reference ID from transaction response
  remark: string;       // Complaint description
}

/**
 * Complain Response
 */
export interface RechargeExchangeComplainResponse {
  status: 'SUCCESS' | 'FAIL';
  complainid: string;
  message: string;
}

/**
 * Single operator from OperatorList
 */
export interface RechargeExchangeOperator {
  Operator: string;  // e.g. "RelianceJio"
  OpCode: string;    // e.g. "14"
}

/**
 * Callback payload sent by RechargeExchange (GET format)
 */
export interface RechargeExchangeCallbackPayload {
  status: 'SUCCESS' | 'FAIL';
  opid: string;         // Operator transaction ID
  yourtransid: string;  // Client unique transaction ID
  txnid?: string;       // RE system transaction ID
  number: string;
  amount: string;
  message?: string;
}
