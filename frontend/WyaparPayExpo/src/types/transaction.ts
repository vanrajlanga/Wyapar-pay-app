/**
 * Transaction Types
 * Centralized type definitions for transaction-related functionality
 */

export interface Transaction {
  id: string;
  userId: string;
  walletId?: string;
  billerId?: string;
  type: TransactionType;
  category?: TransactionCategory;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  gatewayRef?: string;
  upiRef?: string;
  bankRef?: string;
  description?: string;
  customerRef?: string;
  gatewayResponse?: Record<string, any>;
  metadata?: Record<string, any>;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  // Computed properties
  isCredit?: boolean;
  isDebit?: boolean;
  displayAmount?: number;
  formattedDescription?: string;
  categoryIcon?: string;
}

export enum TransactionType {
  RECHARGE = 'recharge',
  BILL_PAYMENT = 'bill_payment',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
}

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

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  BANK_TRANSFER = 'bank_transfer',
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  categoryBreakdown: {
    category: TransactionCategory;
    count: number;
    totalAmount: number;
  }[];
  monthlyBreakdown: {
    month: string;
    count: number;
    totalAmount: number;
  }[];
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  topCategories: {
    category: TransactionCategory;
    count: number;
  }[];
  dailyBreakdown: {
    day: string;
    count: number;
    amount: number;
  }[];
}

// Filter and sort types
export type FilterType =
  | 'all'
  | 'type'
  | 'category'
  | 'status'
  | 'paymentMethod';
export type SortType = 'date' | 'amount' | 'status';
export type SortOrder = 'asc' | 'desc';

// UI Configuration types
export interface TransactionUIConfig {
  showAmount: boolean;
  showStatus: boolean;
  showDate: boolean;
  showCategory: boolean;
  showMetadata: boolean;
  enableFiltering: boolean;
  enableSearch: boolean;
  enableSorting: boolean;
  compact?: boolean;
}

export interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  onTransactionPress?: (transaction: Transaction) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  showSummary?: boolean;
  showFilters?: boolean;
  config?: Partial<TransactionUIConfig>;
}
