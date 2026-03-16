/**
 * Transaction Utilities
 * Reusable functions for transaction-related operations
 */

import {
  Transaction,
  TransactionCategory,
  TransactionStatus,
} from '../types/transaction';

export class TransactionUtils {
  /**
   * Get status color for transaction
   */
  static getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      success: '#4CAF50',
      failed: '#F44336',
      pending: '#FF9800',
      processing: '#2196F3',
      cancelled: '#9E9E9E',
      refunded: '#9C27B0',
    };
    return statusColors[status] || '#9E9E9E';
  }

  /**
   * Get status variant for Badge component
   */
  static getStatusVariant(
    status: string
  ): 'success' | 'error' | 'warning' | 'info' {
    const statusVariants: Record<
      string,
      'success' | 'error' | 'warning' | 'info'
    > = {
      success: 'success',
      failed: 'error',
      pending: 'warning',
      processing: 'info',
      cancelled: 'error',
      refunded: 'info',
    };
    return statusVariants[status] || 'info';
  }

  /**
   * Get category icon for transaction
   */
  static getCategoryIcon(category?: string): string {
    const categoryIcons: Record<string, string> = {
      mobile_recharge: 'phone-android',
      dth_recharge: 'tv',
      broadband_recharge: 'wifi',
      electricity_bill: 'flash-on',
      water_bill: 'water-drop',
      gas_bill: 'local-gas-station',
      credit_card_bill: 'credit-card',
      loan_repayment: 'account-balance',
      insurance_premium: 'security',
      fastag_recharge: 'directions-car',
      upi_transfer: 'account-balance-wallet',
      bank_transfer: 'account-balance',
      wallet_transfer: 'swap-horiz',
      cashback_earned: 'monetization-on',
      refund_received: 'undo',
      wallet_topup: 'add-circle',
      withdrawal_to_bank: 'arrow-downward',
    };
    return categoryIcons[category || ''] || 'receipt';
  }

  /**
   * Format transaction time for display
   */
  static formatTransactionTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  /**
   * Format transaction amount for display
   */
  static formatTransactionAmount(amount: number, isCredit: boolean): string {
    const sign = isCredit ? '+' : '-';
    return `${sign}₹${amount.toFixed(2)}`;
  }

  /**
   * Get transaction display description
   */
  static getTransactionDescription(transaction: Transaction): string {
    if (transaction.formattedDescription) {
      return transaction.formattedDescription;
    }

    if (transaction.description) {
      return transaction.description;
    }

    // Generate description based on category
    switch (transaction.category) {
      case 'mobile_recharge':
        return `Mobile recharge for ${transaction.metadata?.mobileNumber || 'N/A'}`;
      case 'dth_recharge':
        return `DTH recharge for ${transaction.metadata?.customerId || 'N/A'}`;
      case 'electricity_bill':
        return 'Electricity bill payment';
      case 'credit_card_bill':
        return 'Credit card bill payment';
      case 'upi_transfer':
        return `UPI transfer to ${transaction.metadata?.recipientName || 'N/A'}`;
      case 'wallet_topup':
        return 'Wallet top-up';
      case 'cashback_earned':
        return 'Cashback earned';
      default:
        return (
          transaction.type.charAt(0).toUpperCase() +
          transaction.type.slice(1).replace('_', ' ')
        );
    }
  }

  /**
   * Check if transaction is credit
   */
  static isCreditTransaction(transaction: Transaction): boolean {
    return ['cashback', 'refund', 'deposit'].includes(transaction.type);
  }

  /**
   * Check if transaction is debit
   */
  static isDebitTransaction(transaction: Transaction): boolean {
    return ['recharge', 'bill_payment', 'transfer', 'withdrawal'].includes(
      transaction.type
    );
  }

  /**
   * Get transaction metadata display value
   */
  static getMetadataDisplayValue(transaction: Transaction): string {
    if (transaction.metadata?.mobileNumber) {
      return transaction.metadata.mobileNumber;
    }
    if (transaction.metadata?.operatorCode) {
      return transaction.metadata.operatorCode;
    }
    if (transaction.metadata?.customerId) {
      return transaction.metadata.customerId;
    }
    return 'Transaction';
  }

  /**
   * Sort transactions by different criteria
   */
  static sortTransactions(
    transactions: Transaction[],
    sortBy: 'date' | 'amount' | 'status',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Transaction[] {
    return [...transactions].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Filter transactions by criteria
   */
  static filterTransactions(
    transactions: Transaction[],
    filters: {
      type?: string;
      category?: string;
      status?: string;
      search?: string;
    }
  ): Transaction[] {
    return transactions.filter((transaction) => {
      // Type filter
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const description = transaction.description?.toLowerCase() || '';
        const metadata = JSON.stringify(
          transaction.metadata || {}
        ).toLowerCase();
        const id = transaction.id.toLowerCase();

        if (
          !description.includes(searchTerm) &&
          !metadata.includes(searchTerm) &&
          !id.includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    });
  }
}
