/**
 * Transaction Service
 * Handles all transaction-related API calls
 */

import { apiService } from './api.service';
import { logger } from './logger.service';
import { API_ENDPOINTS } from '../constants';

export interface TransactionFilters {
  type?: string;
  category?: string;
  status?: string;
  paymentMethod?: string;
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
    category: string;
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

export interface Transaction {
  id: string;
  userId: string;
  walletId?: string;
  billerId?: string;
  type: string;
  category?: string;
  status: string;
  paymentMethod: string;
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

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  topCategories: {
    category: string;
    count: number;
  }[];
  dailyBreakdown: {
    day: string;
    count: number;
    amount: number;
  }[];
}

class TransactionManagementService {
  private baseUrl = '';

  /**
   * Get all transactions with filters and pagination
   */
  async getTransactions(
    filters: TransactionFilters = {},
    page: number = 1,
    limit: number = 20,
    accessToken: string
  ): Promise<PaginatedTransactions> {
    try {
      const queryParams = new URLSearchParams();

      // Add pagination
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_ALL}?${queryParams.toString()}`;
      const response = await apiService.get<PaginatedTransactions>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get transactions', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    accessToken: string
  ): Promise<Transaction> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_BY_ID(transactionId)}`;
      const response = await apiService.get<Transaction>(endpoint, accessToken);

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get transaction by ID', error);
      throw error;
    }
  }

  /**
   * Get transaction summary
   */
  async getTransactionSummary(
    filters: TransactionFilters = {},
    accessToken: string
  ): Promise<TransactionSummary> {
    try {
      const queryParams = new URLSearchParams();

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_SUMMARY}?${queryParams.toString()}`;
      const response = await apiService.get<TransactionSummary>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get transaction summary', error);
      throw error;
    }
  }

  /**
   * Get recent transactions for dashboard
   */
  async getRecentTransactions(
    limit: number = 10,
    accessToken: string
  ): Promise<Transaction[]> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_RECENT}?limit=${limit}`;
      const response = await apiService.get<Transaction[]>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get recent transactions', error);
      throw error;
    }
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(
    category: string,
    limit: number = 20,
    accessToken: string
  ): Promise<Transaction[]> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_BY_CATEGORY(category)}?limit=${limit}`;
      const response = await apiService.get<Transaction[]>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get transactions by category', error);
      throw error;
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions(
    query: string,
    limit: number = 20,
    accessToken: string
  ): Promise<Transaction[]> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await apiService.get<Transaction[]>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to search transactions', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    days: number = 30,
    accessToken: string
  ): Promise<TransactionStats> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.GET_STATS}?days=${days}`;
      const response = await apiService.get<TransactionStats>(
        endpoint,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to get transaction stats', error);
      throw error;
    }
  }

  /**
   * Update transaction status (for internal use)
   */
  async updateTransactionStatus(
    transactionId: string,
    status: string,
    accessToken: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.TRANSACTIONS.UPDATE_STATUS(transactionId)}`;
      const body = { status, metadata };
      const response = await apiService.put<Transaction>(
        endpoint,
        body,
        accessToken
      );

      logger.logApiResponse(endpoint, 200, response);
      return response;
    } catch (error) {
      logger.error('Failed to update transaction status', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionManagementService();
