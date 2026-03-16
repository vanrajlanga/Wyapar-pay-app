import { Injectable, Logger, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { RazorpayService } from './razorpay/razorpay.service';
import { RechargeExchangeService } from '../recharge/rechargeexchange/rechargeexchange.service';
import { Transaction, TransactionType, TransactionCategory, TransactionStatus, PaymentMethod } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { Operator } from '../../entities/operator.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentService implements OnModuleInit {
  private readonly logger = new Logger(PaymentService.name);
  private readonly GUEST_USER_EMAIL = 'guest@wyapar.com';
  private GUEST_USER_ID: string; // Will be set during module init

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Operator)
    private operatorRepository: Repository<Operator>,
    private razorpayService: RazorpayService,
    private rechargeExchangeService: RechargeExchangeService,
  ) {}

  /**
   * Initialize guest user on module startup
   */
  async onModuleInit() {
    await this.ensureGuestUserExists();
  }

  /**
   * Ensure guest user exists in database
   */
  private async ensureGuestUserExists() {
    try {
      let guestUser = await this.userRepository.findOne({
        where: { email: this.GUEST_USER_EMAIL },
      });

      if (!guestUser) {
        this.logger.log('Creating guest user for guest transactions...');
        guestUser = this.userRepository.create({
          name: 'Guest User',
          phone: '0000000000',
          email: this.GUEST_USER_EMAIL,
          status: 'inactive' as any, // Guest user is inactive
        });

        guestUser = await this.userRepository.save(guestUser);
        this.logger.log(`✅ Guest user created with ID: ${guestUser.id}`);
      } else {
        this.logger.log(`✅ Guest user already exists with ID: ${guestUser.id}`);
      }

      this.GUEST_USER_ID = guestUser.id;
    } catch (error) {
      this.logger.error('Failed to ensure guest user exists:', error);
      // Don't throw - app can still work, just log the error
    }
  }

  /**
   * Get guest user ID (create if not exists)
   */
  private async getGuestUserId(): Promise<string> {
    // If already initialized, return it
    if (this.GUEST_USER_ID) {
      return this.GUEST_USER_ID;
    }

    // Otherwise, ensure it exists and return it
    let guestUser = await this.userRepository.findOne({
      where: { email: this.GUEST_USER_EMAIL },
    });

    if (!guestUser) {
      this.logger.log('Guest user not found, creating now...');
      guestUser = this.userRepository.create({
        name: 'Guest User',
        phone: '0000000000',
        email: this.GUEST_USER_EMAIL,
        status: 'inactive' as any,
      });
      guestUser = await this.userRepository.save(guestUser);
      this.logger.log(`✅ Guest user created with ID: ${guestUser.id}`);
    }

    this.GUEST_USER_ID = guestUser.id;
    return this.GUEST_USER_ID;
  }

  /**
   * Create Razorpay Payment Order
   */
  async createOrder(userId: string | null, createOrderDto: CreateOrderDto) {
    try {
      // Handle guest users
      const isGuestUser = !userId;
      const effectiveUserId = isGuestUser ? await this.getGuestUserId() : userId;

      this.logger.log(`[PaymentService] Received userId: ${userId} (type: ${typeof userId})`);
      this.logger.log(`[PaymentService] Is guest user: ${isGuestUser}, effective userId: ${effectiveUserId}`);

      // Verify user exists (skip for guest users)
      if (!isGuestUser) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
          this.logger.error(`[PaymentService] User not found with ID: ${userId}`);
          throw new NotFoundException('User not found');
        }
        this.logger.log(`[PaymentService] User found: ${user.email || user.phone}`);
      } else {
        this.logger.log(`[PaymentService] Processing as guest user`);
      }

      // Generate unique receipt ID
      const receiptId = `txn_${Date.now()}_${uuidv4().substring(0, 8)}`;

      // Convert amount to paise (Razorpay expects amount in paise)
      const amountInPaise = Math.round(createOrderDto.amount * 100);

      // Create Razorpay order
      const razorpayOrder = await this.razorpayService.createOrder({
        amount: amountInPaise,
        currency: createOrderDto.currency || 'INR',
        receipt: receiptId,
        notes: {
          userId: effectiveUserId,
          isGuest: isGuestUser,
          ...createOrderDto.notes,
        },
      });

      // Create transaction record with PENDING status
      this.logger.log(`[PaymentService] Creating transaction with userId: ${effectiveUserId}`);

      const fee = 0; // No fee for now
      const totalAmount = createOrderDto.amount + fee;

      const isRechargeType = createOrderDto.notes?.type === 'recharge';
      const isDthRecharge = createOrderDto.notes?.is_dth === 'true';
      const rechargeCategory = isRechargeType
        ? (isDthRecharge ? TransactionCategory.DTH_RECHARGE : TransactionCategory.MOBILE_RECHARGE)
        : undefined;
      const transaction = this.transactionRepository.create({
        userId: effectiveUserId,
        type: TransactionType.RECHARGE,
        category: rechargeCategory,
        status: TransactionStatus.PENDING,
        amount: createOrderDto.amount,
        fee: fee,
        totalAmount: totalAmount,
        currency: createOrderDto.currency || 'INR',
        paymentMethod: PaymentMethod.CARD, // Razorpay supports multiple methods
        metadata: {
          razorpay_order_id: razorpayOrder.id,
          receipt: receiptId,
          isGuest: isGuestUser,
          originalUserId: userId, // Store null if guest for potential linking later
          ...createOrderDto.notes,
        },
      });

      this.logger.log(`[PaymentService] Transaction entity created, userId field: ${transaction.userId}`);
      this.logger.log(`[PaymentService] Attempting to save transaction...`);

      await this.transactionRepository.save(transaction);

      this.logger.log(`✅ Payment order created: ${razorpayOrder.id} for ${isGuestUser ? 'guest user' : `user: ${userId}`}`);

      // Return order details for frontend
      return {
        razorpay_order_id: razorpayOrder.id,
        razorpay_key: this.razorpayService.getKeyId(),
        amount: createOrderDto.amount,
        currency: razorpayOrder.currency,
        transactionId: transaction.id,
      };
    } catch (error) {
      this.logger.error('Failed to create payment order:', error);
      throw error;
    }
  }

  /**
   * Verify Razorpay Payment
   */
  async verifyPayment(userId: string | null, verifyPaymentDto: VerifyPaymentDto) {
    try {
      // Handle guest users
      const isGuestUser = !userId;
      const effectiveUserId = isGuestUser ? await this.getGuestUserId() : userId;

      this.logger.log(`[PaymentService] Verifying payment for ${isGuestUser ? 'guest user' : `user: ${userId}`}`);

      // 1. Verify signature
      const isSignatureValid = this.razorpayService.verifyPaymentSignature(verifyPaymentDto);

      if (!isSignatureValid) {
        throw new BadRequestException('Invalid payment signature');
      }

      // 2. Fetch payment details from Razorpay
      const paymentDetails = await this.razorpayService.fetchPayment(
        verifyPaymentDto.razorpay_payment_id,
      );

      // 3. Verify payment status
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        throw new BadRequestException(`Payment not successful. Status: ${paymentDetails.status}`);
      }

      // 4. Find transaction by razorpay_order_id
      const transaction = await this.transactionRepository
        .createQueryBuilder('transaction')
        .where("JSON_EXTRACT(transaction.metadata, '$.razorpay_order_id') = :orderId", {
          orderId: verifyPaymentDto.razorpay_order_id,
        })
        .getOne();

      if (!transaction) {
        this.logger.error(`Transaction not found for order: ${verifyPaymentDto.razorpay_order_id}`);
        throw new NotFoundException('Transaction not found');
      }

      // 5. Verify user ownership (allow guest transactions)
      if (transaction.userId !== effectiveUserId) {
        throw new BadRequestException('Transaction does not belong to this user');
      }

      // 6. Check if already processed
      if (transaction.status === TransactionStatus.SUCCESS) {
        this.logger.warn(`Transaction already processed: ${transaction.id}`);
        return {
          transactionId: transaction.id,
          status: transaction.status,
          alreadyProcessed: true,
        };
      }

      // 7. Update transaction with Razorpay payment details (still PENDING until RE confirms)
      transaction.gatewayRef = verifyPaymentDto.razorpay_payment_id;
      transaction.gatewayResponse = paymentDetails as any;
      transaction.metadata = {
        ...transaction.metadata,
        razorpay_payment_id: verifyPaymentDto.razorpay_payment_id,
        razorpay_signature: verifyPaymentDto.razorpay_signature,
        payment_method: paymentDetails.method,
        vpa: paymentDetails.vpa,
        email: paymentDetails.email,
        contact: paymentDetails.contact,
      };

      // 8. If this is a recharge, call RechargeExchange to execute it
      const meta = transaction.metadata as any;
      const isRecharge = meta?.type === 'recharge';
      const rechargeNumber = meta?.mobile || meta?.mobileNumber || meta?.mobile_number || meta?.subscriber_id;

      if (isRecharge && rechargeNumber) {
        const mobileNumber = rechargeNumber;
        const operatorName = meta.operator || meta.operatorCode || meta.operator_name;

        this.logger.log(`[PaymentService] Executing recharge for ${mobileNumber} via ${operatorName}`);

        try {
          // For DTH, look up by KWIKAPI operatorId; for mobile, look up by name
          const isDth = meta?.is_dth === 'true';
          const operator = isDth && meta?.operator_kwik_id
            ? await this.operatorRepository.findOne({ where: { operatorId: String(meta.operator_kwik_id) } })
            : await this.operatorRepository.findOne({ where: { operatorName } });

          if (!operator || !operator.reOperatorId) {
            throw new Error(`Operator ${isDth ? meta?.operator_kwik_id : operatorName} not found or not supported`);
          }

          const transid = this.rechargeExchangeService.generateTransId();

          const reResponse = await this.rechargeExchangeService.processTransaction({
            opcode: operator.reOperatorId,
            number: mobileNumber,
            amount: transaction.amount,
            transid,
          });

          this.logger.log(`[PaymentService] RE Response: ${reResponse.status} | Ref: ${reResponse.referenceid}`);

          transaction.metadata = {
            ...transaction.metadata,
            rechargeexchange: {
              transid: reResponse.transid,
              optransid: reResponse.optransid,
              referenceid: reResponse.referenceid,
              balance: reResponse.balance,
              amount: reResponse.amount,
              status: reResponse.status,
              message: reResponse.message,
            },
            operatorCode: operatorName,
            mobileNumber,
          };

          if (reResponse.status === 'SUCCESS') {
            transaction.status = TransactionStatus.SUCCESS;
            transaction.completedAt = new Date();
          } else if (reResponse.status === 'FAIL') {
            transaction.status = TransactionStatus.FAILED;
            transaction.failureReason = reResponse.message || 'Recharge failed';
          } else {
            // PENDING — RE will callback
            transaction.status = TransactionStatus.PENDING;
          }
        } catch (reError) {
          this.logger.error(`[PaymentService] RE recharge failed: ${reError.message}`);
          transaction.status = TransactionStatus.FAILED;
          transaction.failureReason = reError.message || 'Recharge execution failed';
          transaction.metadata = {
            ...transaction.metadata,
            rechargeexchange: { status: 'FAIL', message: reError.message },
          };
        }
      } else {
        // Non-recharge payment (e.g. wallet top-up) — mark success on Razorpay verification
        transaction.status = TransactionStatus.SUCCESS;
        transaction.completedAt = new Date();
      }

      await this.transactionRepository.save(transaction);

      this.logger.log(`✅ Payment verified, RE status: ${transaction.status} for ${transaction.id}`);

      return {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        paymentMethod: paymentDetails.method,
        alreadyProcessed: false,
      };
    } catch (error) {
      this.logger.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Get Transaction by ID
   */
  async getTransactionById(transactionId: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
