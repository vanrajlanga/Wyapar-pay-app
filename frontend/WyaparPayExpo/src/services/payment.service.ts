/**
 * Payment Service
 *
 * Handles Razorpay payment integration for mobile app
 */

import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import { logger } from './logger.service';

// Payment request interfaces
export interface CreatePaymentOrderRequest {
  amount: number;
  currency?: string;
  notes?: Record<string, string>;
}

export interface CreatePaymentOrderResponse {
  razorpay_order_id: string;
  razorpay_key: string;
  amount: number;
  currency: string;
  transactionId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  transactionId: string;
  status: string;
  amount: number;
  paymentMethod: string;
  alreadyProcessed: boolean;
}

/**
 * Payment Service Class
 * Singleton pattern for payment operations
 */
class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create Razorpay payment order
   */
  async createOrder(
    data: CreatePaymentOrderRequest,
    token: string
  ): Promise<CreatePaymentOrderResponse> {
    try {
      logger.info('Creating payment order:', {
        amount: data.amount,
        currency: data.currency || 'INR',
      });

      const response = await apiService.post<{
        success: boolean;
        message: string;
        data: CreatePaymentOrderResponse;
      }>(API_ENDPOINTS.PAYMENT.CREATE_ORDER, data, token);

      logger.info('Payment order created:', response.data.razorpay_order_id);

      return response.data;
    } catch (error) {
      logger.error('Failed to create payment order:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyPayment(
    data: VerifyPaymentRequest,
    token: string
  ): Promise<VerifyPaymentResponse> {
    try {
      logger.info('Verifying payment:', {
        orderId: data.razorpay_order_id,
        paymentId: data.razorpay_payment_id,
      });

      const response = await apiService.post<{
        success: boolean;
        message: string;
        data: VerifyPaymentResponse;
      }>(API_ENDPOINTS.PAYMENT.VERIFY, data, token);

      logger.info('Payment verified:', {
        transactionId: response.data.transactionId,
        status: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    token: string
  ): Promise<any> {
    try {
      logger.info('Fetching transaction:', transactionId);

      const response = await apiService.get<any>(
        API_ENDPOINTS.PAYMENT.GET_TRANSACTION(transactionId),
        token
      );

      return response;
    } catch (error) {
      logger.error('Failed to fetch transaction:', error);
      throw error;
    }
  }

  /**
   * Initiate Razorpay payment with automatic order creation
   * This is the main method that components should call
   */
  async initiatePayment(params: {
    amount: number;
    currency?: string;
    notes?: Record<string, string>;
    token: string;
    onSuccess: (paymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    onFailure: (error: any) => void;
  }): Promise<CreatePaymentOrderResponse> {
    try {
      // Step 1: Create order
      const order = await this.createOrder(
        {
          amount: params.amount,
          currency: params.currency || 'INR',
          notes: params.notes,
        },
        params.token
      );

      logger.info('Payment order ready for Razorpay checkout:', {
        orderId: order.razorpay_order_id,
        amount: order.amount,
      });

      // Return order details for Razorpay checkout
      // The component will open Razorpay checkout with these details
      return order;
    } catch (error) {
      logger.error('Failed to initiate payment:', error);
      params.onFailure(error);
      throw error;
    }
  }

  /**
   * Complete payment verification and processing
   * Called after Razorpay checkout completes successfully
   */
  async completePayment(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    token: string;
  }): Promise<VerifyPaymentResponse> {
    try {
      // Verify payment with backend
      const verification = await this.verifyPayment(
        {
          razorpay_order_id: params.razorpay_order_id,
          razorpay_payment_id: params.razorpay_payment_id,
          razorpay_signature: params.razorpay_signature,
        },
        params.token
      );

      logger.info('Payment completed successfully:', {
        transactionId: verification.transactionId,
        status: verification.status,
      });

      return verification;
    } catch (error) {
      logger.error('Payment completion failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
