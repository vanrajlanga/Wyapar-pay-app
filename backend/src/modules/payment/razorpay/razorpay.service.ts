import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { RazorpayConfig } from './razorpay.config';
const Razorpay = require('razorpay');
import {
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  RazorpayPaymentVerification,
  RazorpayPaymentDetails,
  RazorpayRefundRequest,
  RazorpayRefundResponse,
} from './razorpay.interface';

@Injectable()
export class RazorpayService implements OnModuleInit {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpayInstance: any;

  constructor(private readonly config: RazorpayConfig) {}

  onModuleInit() {
    // Validate configuration on module initialization
    this.config.validate();

    if (this.config.isEnabled) {
      // Initialize Razorpay instance
      this.razorpayInstance = new Razorpay({
        key_id: this.config.keyId,
        key_secret: this.config.keySecret,
      });

      this.logger.log('✅ Razorpay Service initialized successfully');
    }
  }

  /**
   * Create Razorpay Order
   * @param orderRequest - Order details
   * @returns Razorpay order response
   */
  async createOrder(orderRequest: RazorpayOrderRequest): Promise<any> {
    try {
      this.logger.log(`Creating Razorpay order for amount: ₹${orderRequest.amount / 100}`);

      const order = await this.razorpayInstance.orders.create({
        amount: orderRequest.amount, // Amount in paise
        currency: orderRequest.currency || 'INR',
        receipt: orderRequest.receipt,
        notes: orderRequest.notes || {},
      });

      this.logger.log(`✅ Order created successfully: ${order.id}`);
      return order;
    } catch (error) {
      this.logger.error('❌ Failed to create Razorpay order:', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay Payment Signature
   * @param verification - Payment verification details
   * @returns True if signature is valid
   */
  verifyPaymentSignature(verification: RazorpayPaymentVerification): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verification;

      // Generate expected signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.config.keySecret)
        .update(body.toString())
        .digest('hex');

      // Compare signatures
      const isValid = expectedSignature === razorpay_signature;

      if (isValid) {
        this.logger.log(`✅ Payment signature verified: ${razorpay_payment_id}`);
      } else {
        this.logger.error(`❌ Invalid payment signature: ${razorpay_payment_id}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('❌ Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Verify Razorpay Webhook Signature
   * @param webhookBody - Raw webhook body
   * @param signature - X-Razorpay-Signature header
   * @returns True if signature is valid
   */
  verifyWebhookSignature(webhookBody: string, signature: string): boolean {
    try {
      if (!this.config.webhookSecret) {
        this.logger.warn('⚠️  Webhook secret not configured, skipping verification');
        return true; // Allow webhook if secret not configured (dev mode)
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(webhookBody)
        .digest('hex');

      const isValid = expectedSignature === signature;

      if (isValid) {
        this.logger.log('✅ Webhook signature verified');
      } else {
        this.logger.error('❌ Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      this.logger.error('❌ Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Fetch Payment Details
   * @param paymentId - Razorpay payment ID
   * @returns Payment details
   */
  async fetchPayment(paymentId: string): Promise<any> {
    try {
      this.logger.log(`Fetching payment details: ${paymentId}`);
      const payment = await this.razorpayInstance.payments.fetch(paymentId);
      this.logger.log(`✅ Payment details fetched: ${paymentId}`);
      return payment;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to fetch payment details');
    }
  }

  /**
   * Capture Payment (for authorized payments)
   * @param paymentId - Razorpay payment ID
   * @param amount - Amount to capture in paise
   * @returns Captured payment details
   */
  async capturePayment(paymentId: string, amount: number): Promise<any> {
    try {
      this.logger.log(`Capturing payment: ${paymentId} for amount: ₹${amount / 100}`);
      const payment = await this.razorpayInstance.payments.capture(paymentId, amount, 'INR');
      this.logger.log(`✅ Payment captured: ${paymentId}`);
      return payment;
    } catch (error) {
      this.logger.error(`❌ Failed to capture payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to capture payment');
    }
  }

  /**
   * Create Refund
   * @param paymentId - Razorpay payment ID
   * @param refundRequest - Refund details (optional amount for partial refund)
   * @returns Refund response
   */
  async createRefund(
    paymentId: string,
    refundRequest?: RazorpayRefundRequest,
  ): Promise<any> {
    try {
      const amount = refundRequest?.amount;
      this.logger.log(
        `Creating refund for payment: ${paymentId}${amount ? ` amount: ₹${amount / 100}` : ' (full refund)'}`,
      );

      const refund = await this.razorpayInstance.payments.refund(paymentId, {
        amount,
        speed: refundRequest?.speed || 'normal',
        notes: refundRequest?.notes || {},
        receipt: refundRequest?.receipt,
      });

      this.logger.log(`✅ Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`❌ Failed to create refund for payment: ${paymentId}`, error);
      throw new BadRequestException('Failed to create refund');
    }
  }

  /**
   * Fetch Refund Details
   * @param paymentId - Razorpay payment ID
   * @param refundId - Razorpay refund ID
   * @returns Refund details
   */
  async fetchRefund(paymentId: string, refundId: string): Promise<any> {
    try {
      this.logger.log(`Fetching refund: ${refundId} for payment: ${paymentId}`);
      const refund = await this.razorpayInstance.payments.fetchRefund(paymentId, refundId);
      this.logger.log(`✅ Refund details fetched: ${refundId}`);
      return refund;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch refund: ${refundId}`, error);
      throw new BadRequestException('Failed to fetch refund details');
    }
  }

  /**
   * Get Razorpay Key ID (for frontend)
   * @returns Razorpay Key ID
   */
  getKeyId(): string {
    return this.config.keyId;
  }
}
