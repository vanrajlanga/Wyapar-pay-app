/**
 * Admin Analytics API - TypeScript Types
 * 
 * This file contains all TypeScript interfaces and types for the Admin Analytics API.
 * Copy this file to your frontend project for type-safe API integration.
 * 
 * Generated: 2024-02-01
 * API Version: 1.0.0
 */

// ============================================
// ENUMS
// ============================================

/**
 * Transaction type enum
 */
export enum TransactionType {
  RECHARGE = 'recharge',
  BILL_PAYMENT = 'bill_payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Transaction category enum
 */
export enum TransactionCategory {
  // Recharge Categories
  MOBILE_RECHARGE = 'mobile_recharge',
  DTH_RECHARGE = 'dth_recharge',
  BROADBAND_RECHARGE = 'broadband_recharge',

  // Bill Payment Categories
  ELECTRICITY_BILL = 'electricity_bill',
  WATER_BILL = 'water_bill',
  GAS_BILL = 'gas_bill',
  CREDIT_CARD_BILL = 'credit_card_bill',
  LOAN_REPAYMENT = 'loan_repayment',
  INSURANCE_PREMIUM = 'insurance_premium',
  FASTAG_RECHARGE = 'fastag_recharge',

  // Transfer Categories
  UPI_TRANSFER = 'upi_transfer',
  BANK_TRANSFER = 'bank_transfer',
  WALLET_TRANSFER = 'wallet_transfer',

  // Other Categories
  CASHBACK_EARNED = 'cashback_earned',
  REFUND_RECEIVED = 'refund_received',
  WALLET_TOPUP = 'wallet_topup',
  WITHDRAWAL_TO_BANK = 'withdrawal_to_bank',
}

/**
 * Payment method enum
 */
export enum PaymentMethod {
  WALLET = 'wallet',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Time period for grouping analytics data
 */
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// ============================================
// QUERY PARAMETER INTERFACES
// ============================================

/**
 * Query parameters for fetching transactions list
 */
export interface AdminTransactionQueryParams {
  /** Page number (min: 1, default: 1) */
  page?: number;
  /** Items per page (min: 1, max: 100, default: 20) */
  limit?: number;
  /** Filter by single transaction type */
  type?: TransactionType;
  /** Filter by multiple transaction types (comma-separated in URL) */
  types?: TransactionType[];
  /** Filter by single status */
  status?: TransactionStatus;
  /** Filter by multiple statuses (comma-separated in URL) */
  statuses?: TransactionStatus[];
  /** Filter by single category */
  category?: TransactionCategory;
  /** Filter by multiple categories (comma-separated in URL) */
  categories?: TransactionCategory[];
  /** Filter by payment method */
  paymentMethod?: PaymentMethod;
  /** Start date (ISO format: YYYY-MM-DD) */
  startDate?: string;
  /** End date (ISO format: YYYY-MM-DD) */
  endDate?: string;
  /** Minimum transaction amount */
  minAmount?: number;
  /** Maximum transaction amount */
  maxAmount?: number;
  /** Filter by specific user ID (UUID) */
  userId?: string;
  /** Search by transaction ID, gateway ref, UPI ref, or customer ref */
  search?: string;
  /** Sort field (default: createdAt) */
  sortBy?: 'createdAt' | 'amount' | 'totalAmount' | 'status' | 'type' | 'category';
  /** Sort order (default: DESC) */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Query parameters for revenue analytics endpoints
 */
export interface RevenueAnalyticsQueryParams {
  /** Start date (ISO format: YYYY-MM-DD) */
  startDate?: string;
  /** End date (ISO format: YYYY-MM-DD) */
  endDate?: string;
  /** Time period for grouping (default: daily) */
  period?: TimePeriod;
  /** Filter by transaction type */
  type?: TransactionType;
  /** Filter by category */
  category?: TransactionCategory;
}

/**
 * Query parameters for top customers endpoint
 */
export interface TopCustomersQueryParams {
  /** Number of customers to return (default: 10) */
  limit?: number;
  /** Start date (ISO format: YYYY-MM-DD) */
  startDate?: string;
  /** End date (ISO format: YYYY-MM-DD) */
  endDate?: string;
}

// ============================================
// RESPONSE INTERFACES
// ============================================

/**
 * Single transaction item in list responses
 */
export interface TransactionListItem {
  /** Unique transaction ID (UUID) */
  id: string;
  /** User ID who made the transaction */
  userId: string;
  /** User's display name */
  userName?: string;
  /** User's phone number */
  userPhone?: string;
  /** Transaction type */
  type: TransactionType;
  /** Transaction category */
  category: TransactionCategory;
  /** Current status */
  status: TransactionStatus;
  /** Payment method used */
  paymentMethod: PaymentMethod;
  /** Transaction amount */
  amount: number;
  /** Fee charged */
  fee: number;
  /** Total amount (amount + fee) */
  totalAmount: number;
  /** Currency code (default: INR) */
  currency: string;
  /** Payment gateway reference */
  gatewayRef?: string;
  /** UPI reference number */
  upiRef?: string;
  /** Transaction description */
  description?: string;
  /** Customer reference (e.g., mobile number, account number) */
  customerRef?: string;
  /** Failure reason if status is failed */
  failureReason?: string;
  /** Additional metadata (varies by transaction type) */
  metadata?: Record<string, any>;
  /** Transaction creation timestamp */
  createdAt: string;
  /** Processing start timestamp */
  processedAt?: string;
  /** Completion timestamp */
  completedAt?: string;
}

/**
 * Pagination information
 */
export interface Pagination {
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrevious: boolean;
}

/**
 * Applied and available filters information
 */
export interface FiltersInfo {
  /** Currently applied filters */
  applied: Record<string, any>;
  /** Available filter options */
  available: {
    types: string[];
    statuses: string[];
    categories: string[];
    paymentMethods: string[];
  };
}

/**
 * Paginated transaction list response
 */
export interface PaginatedTransactionResponse {
  /** Array of transactions */
  data: TransactionListItem[];
  /** Pagination information */
  pagination: Pagination;
  /** Filter information */
  filters: FiltersInfo;
}

/**
 * Revenue overview metrics
 */
export interface RevenueOverview {
  /** Total revenue from successful transactions */
  totalRevenue: number;
  /** Total number of transactions */
  totalTransactions: number;
  /** Number of successful transactions */
  successfulTransactions: number;
  /** Number of failed transactions */
  failedTransactions: number;
  /** Number of pending/processing transactions */
  pendingTransactions: number;
  /** Average transaction value */
  averageTransactionValue: number;
  /** Total fees collected */
  totalFees: number;
  /** Success rate percentage (0-100) */
  successRate: number;
  /** Comparison with previous period (if date range provided) */
  periodComparison?: {
    /** Revenue in the previous period */
    previousPeriodRevenue: number;
    /** Absolute change in revenue */
    revenueChange: number;
    /** Percentage change in revenue */
    revenueChangePercent: number;
  };
}

/**
 * Revenue breakdown by transaction type
 */
export interface RevenueByType {
  /** Transaction type */
  type: TransactionType;
  /** Total amount for this type */
  totalAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Number of successful transactions */
  successCount: number;
  /** Number of failed transactions */
  failedCount: number;
  /** Average transaction amount */
  averageAmount: number;
  /** Percentage of total revenue */
  percentageOfTotal: number;
}

/**
 * Revenue breakdown by category
 */
export interface RevenueByCategory {
  /** Transaction category */
  category: TransactionCategory;
  /** Total amount for this category */
  totalAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Number of successful transactions */
  successCount: number;
  /** Average transaction amount */
  averageAmount: number;
  /** Percentage of total revenue */
  percentageOfTotal: number;
}

/**
 * Transaction breakdown by status
 */
export interface RevenueByStatus {
  /** Transaction status */
  status: TransactionStatus;
  /** Total amount for this status */
  totalAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Percentage of total transactions */
  percentageOfTotal: number;
}

/**
 * Revenue breakdown by payment method
 */
export interface RevenueByPaymentMethod {
  /** Payment method */
  paymentMethod: PaymentMethod;
  /** Total amount for this payment method */
  totalAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Average transaction amount */
  averageAmount: number;
  /** Percentage of total revenue */
  percentageOfTotal: number;
}

/**
 * Time series data point for charts
 */
export interface TimeSeriesDataPoint {
  /** Date string (format depends on period) */
  date: string;
  /** Human-readable label */
  label: string;
  /** Total amount for this period */
  totalAmount: number;
  /** Number of transactions */
  transactionCount: number;
  /** Number of successful transactions */
  successCount: number;
  /** Number of failed transactions */
  failedCount: number;
  /** Total fees collected */
  fees: number;
}

/**
 * Top customer information
 */
export interface TopCustomer {
  /** User ID */
  userId: string;
  /** User's display name */
  userName?: string;
  /** User's phone number */
  userPhone?: string;
  /** User's email */
  userEmail?: string;
  /** Total number of transactions */
  totalTransactions: number;
  /** Total transaction amount */
  totalAmount: number;
  /** Number of successful transactions */
  successfulTransactions: number;
  /** Date of last transaction */
  lastTransactionDate: string;
}

/**
 * Complete dashboard analytics response
 */
export interface DashboardAnalytics {
  /** Revenue overview metrics */
  overview: RevenueOverview;
  /** Revenue breakdown by type */
  revenueByType: RevenueByType[];
  /** Revenue breakdown by category */
  revenueByCategory: RevenueByCategory[];
  /** Transaction breakdown by status */
  revenueByStatus: RevenueByStatus[];
  /** Revenue breakdown by payment method */
  revenueByPaymentMethod: RevenueByPaymentMethod[];
  /** Time series data for charts */
  timeSeries: TimeSeriesDataPoint[];
  /** Top customers list */
  topCustomers: TopCustomer[];
  /** Recent transactions */
  recentTransactions: TransactionListItem[];
}

/**
 * Quick stats response (today, this week, this month)
 */
export interface QuickStats {
  /** Today's metrics */
  today: RevenueOverview;
  /** This week's metrics */
  thisWeek: RevenueOverview;
  /** This month's metrics */
  thisMonth: RevenueOverview;
}

/**
 * Filter option for dropdowns
 */
export interface FilterOption {
  /** Option value (used in API calls) */
  value: string;
  /** Display label */
  label: string;
}

/**
 * All available filter options
 */
export interface FilterOptions {
  /** Transaction type options */
  types: FilterOption[];
  /** Status options */
  statuses: FilterOption[];
  /** Category options */
  categories: FilterOption[];
  /** Payment method options */
  paymentMethods: FilterOption[];
  /** Time period options */
  periods: FilterOption[];
}

// ============================================
// ERROR RESPONSE INTERFACES
// ============================================

/**
 * Standard API error response
 */
export interface ApiError {
  /** HTTP status code */
  statusCode: number;
  /** Error message (can be string or array of validation errors) */
  message: string | string[];
  /** Error type */
  error: string;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Type for date range parameters
 */
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

/**
 * API response wrapper (for consistent error handling)
 */
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ApiError;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Helper to get status color for UI
 */
export const getStatusColor = (status: TransactionStatus): string => {
  const colors: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: '#FFA500',    // Orange
    [TransactionStatus.PROCESSING]: '#3B82F6', // Blue
    [TransactionStatus.SUCCESS]: '#10B981',    // Green
    [TransactionStatus.FAILED]: '#EF4444',     // Red
    [TransactionStatus.CANCELLED]: '#6B7280',  // Gray
    [TransactionStatus.REFUNDED]: '#8B5CF6',   // Purple
  };
  return colors[status] || '#6B7280';
};

/**
 * Helper to get type icon name for UI
 */
export const getTypeIcon = (type: TransactionType): string => {
  const icons: Record<TransactionType, string> = {
    [TransactionType.RECHARGE]: 'phone-android',
    [TransactionType.BILL_PAYMENT]: 'receipt',
    [TransactionType.TRANSFER]: 'swap-horiz',
    [TransactionType.REFUND]: 'undo',
    [TransactionType.CASHBACK]: 'monetization-on',
    [TransactionType.WITHDRAWAL]: 'arrow-downward',
    [TransactionType.DEPOSIT]: 'arrow-upward',
  };
  return icons[type] || 'receipt';
};

/**
 * Helper to format currency
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Helper to format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Helper to build query string from params
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};
