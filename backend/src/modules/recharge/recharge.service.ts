import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { OperatorCircle } from '../../entities/operator-circle.entity';
import { Circle } from '../../entities/circle.entity';
import { Operator } from '../../entities/operator.entity';
import {
  UserFavorite,
  FavoriteType,
} from '../../entities/user-favorite.entity';
import { RechargePlan } from '../../entities/recharge-plan.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod as TransactionPaymentMethod,
  TransactionCategory,
} from '../../entities/transaction.entity';
import { Wallet, WalletType } from '../../entities/wallet.entity';
import { User } from '../../entities/user.entity';
import {
  DetectOperatorDto,
  GetPlansDto,
  MobileRechargeDto,
  AddFavoriteDto,
  ValidateRechargeDto,
  GetDthPlansDto,
  DthRechargeDto,
} from './dto/mobile-recharge.dto';
import { NotificationEmitterService } from '../../common/notifications/notification-emitter.service';
import { KwikApiService } from './kwikapi/kwikapi.service';
import { RechargeExchangeService } from './rechargeexchange/rechargeexchange.service';

@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    @InjectRepository(OperatorCircle)
    private readonly operatorCircleRepository: Repository<OperatorCircle>,
    @InjectRepository(Circle)
    private readonly circleRepository: Repository<Circle>,
    @InjectRepository(Operator)
    private readonly operatorRepository: Repository<Operator>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    @InjectRepository(RechargePlan)
    private readonly rechargePlanRepository: Repository<RechargePlan>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly notificationEmitter: NotificationEmitterService,
    private readonly kwikApiService: KwikApiService,
    private readonly rechargeExchangeService: RechargeExchangeService,
  ) {}

  /**
   * Auto-detect operator from mobile number
   * Uses KWIKAPI v2 for real-time operator detection (supports MNP)
   */
  async detectOperator(dto: DetectOperatorDto): Promise<{
    operatorCode: string;
    operatorName: string;
    circleCode?: string;
    circleName?: string;
    operatorId?: string;
    creditBalance?: string;
  }> {
    const { mobileNumber } = dto;

    try {
      // Call KWIKAPI to detect operator
      const result = await this.kwikApiService.detectOperator(mobileNumber);

      if (result.success && result.details) {
        this.logger.log(
          `✅ Operator detected for ${mobileNumber}: ${result.details.provider}`,
        );

        return {
          operatorCode: result.details.provider, // e.g., "VI", "JIO", "AIRTEL"
          operatorName: result.details.provider, // e.g., "VI"
          circleCode: result.details.circle_code,
          circleName: result.details.circle_name,
          operatorId: result.details.opid,
          creditBalance: result.credit_balance,
        };
      } else {
        this.logger.warn(
          `⚠️  KWIKAPI detection failed for ${mobileNumber}: ${result.message}`,
        );
        throw new BadRequestException('Could not detect operator');
      }
    } catch (error) {
      this.logger.error(`❌ Operator detection error: ${error.message}`);
      throw new BadRequestException(
        'Failed to detect operator. Please try again.',
      );
    }
  }

  /**
   * Get list of available operators
   */
  async getOperators(): Promise<Array<{ code: string; name: string }>> {
    const operators = await this.operatorCircleRepository
      .createQueryBuilder('circle')
      .select('circle.operatorCode', 'code')
      .addSelect('circle.operatorName', 'name')
      .where('circle.isActive = :isActive', { isActive: true })
      .groupBy('circle.operatorCode')
      .addGroupBy('circle.operatorName')
      .orderBy('MIN(circle.sortOrder)', 'ASC')
      .getRawMany();

    return operators;
  }

  /**
   * Get circles for an operator
   */
  async getCircles(operatorCode: string): Promise<OperatorCircle[]> {
    return this.operatorCircleRepository.find({
      where: { operatorCode, isActive: true },
      order: { circleName: 'ASC' }, // Alphabetical order
    });
  }

  /**
   * Get recharge plans for operator
   * Fetches from KWIKAPI v2
   */
  async getPlans(dto: GetPlansDto): Promise<any[]> {
    const { operatorCode, circleCode, category, operatorId } = dto;

    // Log all incoming parameters for debugging
    this.logger.log('📥 getPlans called with parameters:', {
      operatorCode,
      circleCode,
      category,
      operatorId,
      hasOperatorId: !!operatorId,
      hasCircleCode: !!circleCode,
    });

    try {
      // First, try KWIKAPI if we have operatorId and circleCode
      if (operatorId && circleCode) {
        this.logger.log(
          `✅ Valid KWIKAPI params - Fetching plans from KWIKAPI: Operator ID ${operatorId}, Circle ${circleCode}`,
        );

        const result = await this.kwikApiService.getPlans(
          operatorId,
          circleCode,
        );

        if (result.success) {
          // Normalize KWIKAPI response to our format
          const normalized = this.normalizeKwikApiPlans(result, category);
          this.logger.log(`✅ Fetched ${normalized.length} plans from KWIKAPI`);
          return normalized;
        } else {
          this.logger.warn(`⚠️  KWIKAPI plans fetch failed: ${result.message}`);
        }
      }

      // Fallback: Try Plansinfo API if enabled
      if (this.configService.get('PLANSINFO_API_ENABLED') === 'true') {
        this.logger.log(
          `Fetching plans from Plansinfo API: ${operatorCode} - ${circleCode}`,
        );
        return await this.fetchFromPlansinfo(
          operatorCode,
          circleCode,
          category,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch plans from APIs: ${error.message}`,
        error.stack,
      );
    }

    // Final fallback to mock data
    this.logger.log('Using mock plans data');
    return this.getMockPlans(operatorCode, category);
  }

  /**
   * Fetch plans from Plansinfo API
   */
  private async fetchFromPlansinfo(
    operatorCode: string,
    circleCode: string,
    category?: string
  ): Promise<any[]> {
    const apiUrl = this.configService.get('PLANSINFO_API_URL');
    const apiKey = this.configService.get('PLANSINFO_API_KEY');

    if (!apiKey) {
      throw new Error('PLANSINFO_API_KEY not configured');
    }

    this.logger.debug(`Plansinfo API call: ${apiUrl}/mobile-plans.php`);

    const response = await this.httpService.axiosRef.get(
      `${apiUrl}/mobile-plans.php`,
      {
        params: {
          token: apiKey,
          operator: this.mapOperatorToPlansinfo(operatorCode),
          circle: this.mapCircleToPlansinfo(circleCode),
        },
        timeout: 10000,
      }
    );

    this.logger.log(
      `Plansinfo API response: ${response.data?.plans?.length || 0} plans`
    );

    // Normalize response
    return this.normalizePlansinfoResponse(response.data, category);
  }

  /**
   * Map our operator codes to Plansinfo format
   * Based on: https://www.plansinfo.com/blog/plansinfo-api-v4-mobile-plans/
   * Tested: AT and VI work, JI and BS not available in current subscription
   */
  private mapOperatorToPlansinfo(operatorCode: string): string {
    const mapping = {
      AIRTEL: 'AT',
      JIO: 'AT', // Fallback to Airtel for demo (JIO not in subscription)
      VI: 'VI',
      VODAFONE: 'VI',
      IDEA: 'VI',
      BSNL: 'AT', // Fallback to Airtel for demo (BSNL not in subscription)
    };

    return mapping[operatorCode] || 'AT';
  }

  /**
   * Map our circle codes to Plansinfo format (2-letter codes)
   * Based on: https://www.plansinfo.com/blog/plansinfo-api-v4-mobile-plans/
   */
  private mapCircleToPlansinfo(circleCode: string): string {
    const mapping = {
      DELHI: 'DL',
      MUMBAI: 'MU',
      BANGALORE: 'KA',
      CHENNAI: 'TN',
      KOLKATA: 'KO',
      HYDERABAD: 'AP',
      PUNE: 'MH',
      GUJARAT: 'GJ',
      PUNJAB: 'PB',
      HARYANA: 'HR',
      KERALA: 'KL',
      MADHYA_PRADESH: 'MP',
      RAJASTHAN: 'RJ',
      UP_EAST: 'UE',
      UP_WEST: 'UW',
      MAHARASHTRA: 'MH',
    };

    return mapping[circleCode] || circleCode.substring(0, 2).toUpperCase();
  }

  /**
   * Normalize Plansinfo response to our structure
   * API format: https://www.plansinfo.com/blog/plansinfo-api-v4-mobile-plans/
   */
  private normalizePlansinfoResponse(
    apiResponse: any,
    category?: string
  ): any[] {
    // Plansinfo returns: { status: "OK", categories: [{ name: "Unlimited", plans: [...] }] }
    if (apiResponse.status !== 'OK' || !apiResponse.categories) {
      this.logger.warn('Invalid Plansinfo API response format');
      return [];
    }

    // Flatten all plans from all categories
    const allPlans = apiResponse.categories.flatMap((cat) =>
      (cat.plans || []).map((plan) => ({
        ...plan,
        categoryName: cat.name,
      }))
    );

    let normalized = allPlans.map((plan) => ({
      id: plan.id?.toString() || `plan-${plan.amount}`,
      amount: plan.amount,
      validity:
        plan.validity && plan.validity !== 'na'
          ? plan.validity
          : `${plan.validityDays || 28} days`,
      data: plan.data || this.extractDataFromBenefit(plan.benefit),
      calling:
        plan.calls ||
        (plan.benefit?.toLowerCase().includes('unlimited')
          ? 'Unlimited'
          : 'Check details'),
      category: this.mapPlansinfoCategory(plan.categoryName || 'Unlimited'),
      operator: apiResponse.operator || 'Unknown',
      description: plan.benefit || this.generateDescription(plan),
      benefits: this.extractBenefitsFromDescription(plan.benefit || '', plan),
    }));

    // Filter by category if specified
    if (category) {
      const targetCategory = category.toUpperCase();
      normalized = normalized.filter((p) => p.category === targetCategory);
    }

    this.logger.debug(
      `Normalized ${normalized.length} plans (filtered by: ${category || 'none'})`
    );

    return normalized;
  }

  /**
   * Map Plansinfo categories to our categories
   */
  private mapPlansinfoCategory(apiCategory: string): string {
    const mapping = {
      popular: 'POPULAR',
      trending: 'POPULAR',
      'top selling': 'POPULAR',
      data: 'DATA',
      'data only': 'DATA',
      'data pack': 'DATA',
      unlimited: 'UNLIMITED',
      'unlimited data': 'UNLIMITED',
      'unlimited plan': 'UNLIMITED',
      validity: 'VALIDITY',
      'long validity': 'VALIDITY',
      roaming: 'ROAMING',
      international: 'ROAMING',
    };

    const normalized = apiCategory?.toLowerCase().trim();
    return mapping[normalized] || 'POPULAR';
  }

  /**
   * Extract data from benefit string
   */
  private extractDataFromBenefit(benefit: string): string {
    if (!benefit) return 'Check details';

    // Match patterns like "2GB/day" or "1.5GB" or "100MB"
    const dataMatch = benefit.match(
      /(\d+(\.\d+)?\s*(GB|MB|KB)(\s*\/\s*(Day|day|month))?)/i
    );
    return dataMatch ? dataMatch[0] : 'Check details';
  }

  /**
   * Extract benefits from description text and plan object
   */
  private extractBenefitsFromDescription(
    description: string,
    plan?: any
  ): string[] {
    if (!description) {
      return ['Check operator website for complete details'];
    }

    const benefits: string[] = [];
    const desc = description.toLowerCase();

    // Use plan object if available (more accurate)
    if (plan) {
      // Data benefit
      if (plan.data) {
        benefits.push(`${plan.data} high-speed data`);
      }

      // Calling benefit
      if (plan.calls) {
        benefits.push(plan.calls);
      } else if (
        desc.includes('unlimited') &&
        (desc.includes('call') ||
          desc.includes('voice') ||
          desc.includes('local'))
      ) {
        benefits.push('Unlimited local, STD & roaming calls');
      }

      // SMS benefit
      if (plan.sms) {
        benefits.push(`${plan.sms} SMS`);
      }

      // Subscriptions
      if (plan.subscriptions && plan.subscriptions.length > 0) {
        plan.subscriptions.forEach((sub) => benefits.push(sub));
      }
    } else {
      // Fallback to regex extraction
      const dataMatch = description.match(
        /(\d+(\.\d+)?\s*(GB|MB|KB)(\s*\/\s*Day)?)/i
      );
      if (dataMatch) {
        benefits.push(`${dataMatch[0]} high-speed data`);
      }

      if (
        desc.includes('unlimited') &&
        (desc.includes('call') ||
          desc.includes('voice') ||
          desc.includes('local'))
      ) {
        benefits.push('Unlimited voice calls to any network');
      }

      const smsMatch = description.match(/(\d+)\s*SMS/i);
      if (smsMatch) {
        benefits.push(`${smsMatch[1]} SMS per day`);
      }
    }

    // Check for additional benefits in description
    if (
      desc.includes('roaming') &&
      !benefits.some((b) => b.toLowerCase().includes('roaming'))
    ) {
      benefits.push('Free national roaming included');
    }
    if (desc.includes('wynk')) {
      benefits.push('Complimentary Wynk Music subscription');
    }
    if (desc.includes('hotstar') || desc.includes('disney')) {
      benefits.push('Disney+ Hotstar Mobile subscription');
    }
    if (desc.includes('amazon') || desc.includes('prime')) {
      benefits.push('Amazon Prime benefits');
    }

    return benefits.length > 0
      ? benefits
      : ['Check operator website for complete details'];
  }

  /**
   * Extract benefits from plan object (legacy method for other sources)
   */
  private extractBenefits(plan: any): string[] {
    const benefits: string[] = [];

    // Data benefit
    if (plan.data || plan.internet || plan.data_limit) {
      const data = plan.data || plan.internet || plan.data_limit;
      benefits.push(
        `${data} high-speed data${data.includes('/day') || data.includes('per day') ? '' : ' total'}`
      );
    }

    // Calling benefit
    if (plan.voice || plan.calling || plan.calls) {
      const calling = plan.voice || plan.calling || plan.calls;
      benefits.push(
        calling.toLowerCase().includes('unlimited') ||
          calling.toLowerCase().includes('unltd')
          ? 'Unlimited voice calls to any network'
          : calling
      );
    }

    // SMS benefit
    if (plan.sms) {
      benefits.push(
        `${plan.sms} SMS${plan.sms.includes('/day') || plan.sms.includes('per day') ? '' : ' per day'}`
      );
    }

    // Validity
    if (plan.validity || plan.talktime) {
      const validity = plan.validity || plan.talktime;
      if (!validity.toLowerCase().includes('days')) {
        benefits.push(`Valid for ${validity}`);
      }
    }

    // Additional benefits from description
    if (plan.description) {
      const desc = plan.description.toLowerCase();
      if (
        desc.includes('roaming') &&
        !benefits.some((b) => b.toLowerCase().includes('roaming'))
      ) {
        benefits.push('Free national roaming');
      }
      if (desc.includes('wynk') || desc.includes('music')) {
        benefits.push('Free Wynk Music subscription');
      }
      if (desc.includes('hotstar') || desc.includes('disney')) {
        benefits.push('Disney+ Hotstar Mobile subscription');
      }
      if (desc.includes('amazon') || desc.includes('prime')) {
        benefits.push('Amazon Prime subscription');
      }
    }

    // Default if no benefits found
    if (benefits.length === 0) {
      benefits.push('Check operator website for complete details');
    }

    return benefits;
  }

  /**
   * Generate description from plan details
   */
  private generateDescription(plan: any): string {
    const parts: string[] = [];

    const calling = plan.calling || plan.voice || plan.calls;
    if (
      calling?.toLowerCase().includes('unlimited') ||
      calling?.toLowerCase().includes('unltd')
    ) {
      parts.push('Unlimited calls');
    }

    const data = plan.data || plan.internet || plan.data_limit;
    if (data) {
      parts.push(`${data} data`);
    }

    const validity = plan.validity || plan.talktime;
    if (validity) {
      parts.push(`${validity} validity`);
    }

    return parts.length > 0
      ? parts.join(' with ')
      : 'Recharge plan with voice, data and SMS benefits';
  }

  /**
   * Validate recharge request
   */
  async validateRecharge(
    dto: ValidateRechargeDto,
    userId: string
  ): Promise<{ valid: boolean; message?: string }> {
    // Check for duplicate recharge in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRecharge = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: TransactionType.RECHARGE })
      .andWhere('transaction.createdAt > :fiveMinutesAgo', { fiveMinutesAgo })
      .getOne();

    if (recentRecharge) {
      return {
        valid: false,
        message: 'Recent recharge detected. Please wait 5 minutes before retrying.',
      };
    }

    return { valid: true };
  }

  /**
   * Process mobile recharge
   */
  async processMobileRecharge(
    dto: MobileRechargeDto,
    userId: string
  ): Promise<any> {
    const {
      mobileNumber,
      operatorCode,
      circleCode,
      planId,
      amount,
      paymentMethod,
    } = dto;

    this.logger.log(
      `Processing recharge for ${mobileNumber} - ${operatorCode} - ₹${amount}`
    );

    // Duplicate prevention: block if same user + mobile + amount recharged within last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentMobileRecharge = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.category = :category', { category: TransactionCategory.MOBILE_RECHARGE })
      .andWhere('transaction.amount = :amount', { amount })
      .andWhere('transaction.createdAt > :twoMinutesAgo', { twoMinutesAgo })
      .getOne();

    if (recentMobileRecharge) {
      throw new BadRequestException('Duplicate recharge detected. Please wait a moment before retrying.');
    }

    // Create plan details from the request data
    const planDetails = {
      planId,
      planName: `₹${amount} Recharge`,
      amount,
      operatorCode,
      circleCode,
    };

    // Map paymentMethod to TransactionPaymentMethod enum
    const txnPaymentMethod = paymentMethod === 'upi'
      ? TransactionPaymentMethod.UPI
      : TransactionPaymentMethod.CARD;

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      type: TransactionType.RECHARGE,
      category: TransactionCategory.MOBILE_RECHARGE,
      status: TransactionStatus.PENDING,
      paymentMethod: txnPaymentMethod,
      amount,
      fee: 0,
      totalAmount: amount,
      description: `${operatorCode} ₹${amount} - ${mobileNumber}`,
      metadata: {
        mobileNumber,
        operatorCode,
        circleCode,
        planId,
        paymentMethod: paymentMethod || 'razorpay',
        plan: planDetails,
      },
    });

    await this.transactionRepository.save(transaction);

    // Track RE response for return value
    let reStatus: 'SUCCESS' | 'PENDING' | 'FAIL' = 'PENDING';
    let reTransid = '';

    try {
      // Get operator by name to find RE opcode
      const operator = await this.getOperatorByName(operatorCode);
      if (!operator || !operator.reOperatorId) {
        throw new BadRequestException(`Operator ${operatorCode} not found or not supported for recharge`);
      }

      this.logger.log(`Using RechargeExchange opcode: ${operator.reOperatorId} for ${operatorCode}`);

      // Generate unique transaction ID for RechargeExchange
      const transid = this.rechargeExchangeService.generateTransId();
      reTransid = transid;

      // Call RechargeExchange Transaction API
      const reResponse = await this.rechargeExchangeService.processTransaction({
        opcode: operator.reOperatorId,
        number: mobileNumber,
        amount: amount,
        transid: transid,
      });

      reStatus = reResponse.status as 'SUCCESS' | 'PENDING' | 'FAIL';

      this.logger.log(
        `RechargeExchange Response: ${reResponse.status} | RefID: ${reResponse.referenceid} | Balance: ₹${reResponse.balance}`
      );

      // Update transaction with RechargeExchange response data
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
        plan: {
          ...planDetails,
          planName: `${operatorCode} ₹${amount}`,
        },
      };

      transaction.description = `${operatorCode} ₹${amount} - ${mobileNumber}`;

      // Handle RechargeExchange response status
      if (reResponse.status === 'SUCCESS') {
        transaction.status = TransactionStatus.SUCCESS;
        await this.transactionRepository.save(transaction);

        this.logger.log(`✅ Recharge completed successfully: ${transaction.id}`);

        await this.notificationEmitter.emitRechargeSuccess(userId, {
          transactionId: transaction.id,
          amount,
          phoneNumber: mobileNumber,
          operator: operatorCode,
          currency: '₹',
        });
      } else if (reResponse.status === 'PENDING') {
        // Keep transaction as PENDING — RE will send callback or check status after 5 min
        await this.transactionRepository.save(transaction);

        this.logger.warn(`⏳ Recharge is PENDING: ${transaction.id} - Check status after 5 min`);
      } else if (reResponse.status === 'FAIL') {
        throw new BadRequestException(reResponse.message || 'Recharge failed at provider');
      }
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = error.message;
      await this.transactionRepository.save(transaction);

      this.logger.error(`❌ Recharge failed: ${transaction.id} - ${error.message}`);

      await this.notificationEmitter.emitRechargeFailed(userId, {
        transactionId: transaction.id,
        amount,
        phoneNumber: mobileNumber,
        currency: '₹',
        reason: error.message || 'Recharge failed. Please try again.',
      });

      throw error;
    }

    return {
      success: true,
      transactionId: transaction.id,
      reTransid,     // RE transid — use this for status polling if status is PENDING
      reStatus,      // 'SUCCESS' | 'PENDING'
      message: reStatus === 'SUCCESS' ? 'Recharge completed successfully' : 'Recharge is being processed. Check back in a few minutes.',
      mobileNumber,
      operator: operatorCode,
      amount,
      status: reStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
    };
  }

  /**
   * Handle RechargeExchange callback for PENDING → SUCCESS/FAIL transitions
   * RE sends: GET /?transid=&status=&optransid=&amount=&number=&opcode=
   * NOTE: RE only sends callbacks for transactions that were initially PENDING
   */
  async handleRechargeCallback(
    transid: string,
    status: string,
    optransid?: string,
    amount?: string,
  ): Promise<void> {
    this.logger.log(`📲 RE Callback: transid=${transid} status=${status} optransid=${optransid}`);

    if (!transid || !status) {
      this.logger.warn('⚠️ Callback missing transid or status — ignoring');
      return;
    }

    // Find the transaction by RE transid stored in metadata
    const transaction = await this.transactionRepository
      .createQueryBuilder('t')
      .where(`t.metadata -> 'rechargeexchange' ->> 'transid' = :transid`, { transid })
      .getOne();

    if (!transaction) {
      this.logger.warn(`⚠️ No transaction found for RE transid: ${transid}`);
      return;
    }

    // Only update if still PENDING (avoid double-processing)
    if (transaction.status !== TransactionStatus.PENDING) {
      this.logger.log(`ℹ️ Transaction ${transaction.id} already resolved (${transaction.status}) — skipping`);
      return;
    }

    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === 'SUCCESS') {
      transaction.status = TransactionStatus.SUCCESS;
      transaction.metadata = {
        ...transaction.metadata,
        rechargeexchange: {
          ...transaction.metadata?.rechargeexchange,
          optransid: optransid || transaction.metadata?.rechargeexchange?.optransid,
          status: 'SUCCESS',
          callbackAt: new Date().toISOString(),
        },
      };
      await this.transactionRepository.save(transaction);

      this.logger.log(`✅ Callback: Transaction ${transaction.id} marked SUCCESS`);

      await this.notificationEmitter.emitRechargeSuccess(transaction.userId, {
        transactionId: transaction.id,
        amount: transaction.amount,
        phoneNumber: transaction.metadata?.mobileNumber,
        operator: transaction.metadata?.operatorCode,
        currency: '₹',
      });

    } else if (normalizedStatus === 'FAIL' || normalizedStatus === 'FAILED') {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = 'Recharge failed (RE callback)';
      transaction.metadata = {
        ...transaction.metadata,
        rechargeexchange: {
          ...transaction.metadata?.rechargeexchange,
          status: 'FAIL',
          callbackAt: new Date().toISOString(),
        },
      };
      await this.transactionRepository.save(transaction);

      this.logger.warn(`❌ Callback: Transaction ${transaction.id} marked FAILED`);

      // Refund wallet if it was a wallet payment
      const isWalletPayment = transaction.metadata?.paymentMethod === 'wallet';
      if (isWalletPayment) {
        const wallet = await this.walletRepository.findOne({
          where: { id: transaction.walletId },
        });
        if (wallet) {
          wallet.balance = Number(wallet.balance) + Number(transaction.amount);
          await this.walletRepository.save(wallet);
          this.logger.log(`💰 Refunded ₹${transaction.amount} to wallet ${wallet.id}`);
        }
      }

      await this.notificationEmitter.emitRechargeFailed(transaction.userId, {
        transactionId: transaction.id,
        amount: transaction.amount,
        phoneNumber: transaction.metadata?.mobileNumber,
        currency: '₹',
        reason: 'Recharge failed. Amount will be refunded if applicable.',
      });

    } else {
      this.logger.warn(`⚠️ Unknown callback status: ${status} for transid ${transid}`);
    }
  }

  /**
   * Get recharge history
   */
  async getRechargeHistory(
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId, type: TransactionType.RECHARGE },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Add number to favorites
   */
  async addFavorite(
    dto: AddFavoriteDto,
    userId: string
  ): Promise<UserFavorite> {
    const { accountNumber, type, nickname, operatorCode, circleCode } = dto;

    // Check if already exists
    const existing = await this.userFavoriteRepository.findOne({
      where: { userId, accountNumber },
    });

    if (existing) {
      throw new BadRequestException('This number is already in your favorites');
    }

    const favorite = this.userFavoriteRepository.create({
      userId,
      accountNumber,
      type: type as FavoriteType,
      nickname,
      operatorCode,
      circleCode,
    });

    return this.userFavoriteRepository.save(favorite);
  }

  /**
   * Get user favorites
   */
  async getFavorites(
    userId: string,
    type?: FavoriteType
  ): Promise<UserFavorite[]> {
    const where: any = { userId, isActive: true };
    if (type) {
      where.type = type;
    }

    return this.userFavoriteRepository.find({
      where,
      order: { rechargeCount: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Remove favorite
   */
  async removeFavorite(favoriteId: string, userId: string): Promise<void> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { id: favoriteId, userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.userFavoriteRepository.remove(favorite);
  }

  /**
   * Get all circles from database
   * Returns cached circles to avoid hitting KWIKAPI rate limit
   */
  async getAllCircles(): Promise<Circle[]> {
    return this.circleRepository.find({
      where: { isActive: true },
      order: { circleName: 'ASC' },
    });
  }

  /**
   * Fetch circles from KWIKAPI and store in database
   * Should only be called once or when circles need to be refreshed
   * KWIKAPI allows only 2 hits/day on this endpoint
   */
  async fetchAndStoreCircles(): Promise<{
    success: boolean;
    circlesStored: number;
    message: string;
  }> {
    try {
      const apiKey = this.configService.get<string>('KWIKAPI_API_KEY');
      const url = `https://www.kwikapi.com/api/v2/circle_codes.php?api_key=${apiKey}`;

      this.logger.log('🔄 Fetching circles from KWIKAPI...');

      const response = await this.httpService.axiosRef.get(url);
      const circles = response.data?.response;

      if (!circles || !Array.isArray(circles)) {
        throw new BadRequestException('Invalid response from KWIKAPI');
      }

      this.logger.log(`✅ Fetched ${circles.length} circles from KWIKAPI`);

      // Clear existing circles
      await this.circleRepository.clear();

      // Store circles in database
      const circleEntities = circles.map((circle, index) => {
        // Extract state code from circle_name (e.g., "DELHI (DL)" -> "DL")
        const stateCodeMatch = circle.circle_name.match(/\(([A-Z]+)\)/);
        const stateCode = stateCodeMatch ? stateCodeMatch[1] : null;

        return this.circleRepository.create({
          circleCode: circle.circle_code,
          circleName: circle.circle_name,
          stateCode,
          isActive: true,
          sortOrder: index,
        });
      });

      await this.circleRepository.save(circleEntities);

      this.logger.log(`✅ Stored ${circleEntities.length} circles in database`);

      return {
        success: true,
        circlesStored: circleEntities.length,
        message: `Successfully fetched and stored ${circleEntities.length} circles`,
      };
    } catch (error) {
      this.logger.error('❌ Failed to fetch circles from KWIKAPI:', error.message);
      throw new BadRequestException(
        'Failed to fetch circles. Please try again later.'
      );
    }
  }

  /**
   * Fetch operators from KWIKAPI and store in database
   * Should only be called once or when operators need to be refreshed
   * KWIKAPI allows only 15 hits/day on this endpoint
   */
  async fetchAndStoreOperators(): Promise<{
    success: boolean;
    operatorsStored: number;
    message: string;
  }> {
    try {
      this.logger.log('🔄 Fetching operators from RechargeExchange...');

      const operators = await this.rechargeExchangeService.getOperatorList();

      if (!operators || !Array.isArray(operators)) {
        throw new BadRequestException('Invalid response from RechargeExchange');
      }

      this.logger.log(`✅ Fetched ${operators.length} operators from RechargeExchange`);

      // Clear existing operators
      await this.operatorRepository.clear();

      // Store operators — RE provides Operator name and OpCode
      const operatorEntities = operators.map((op, index) => {
        return this.operatorRepository.create({
          operatorId: op.OpCode,
          operatorName: op.Operator,
          serviceType: 'Prepaid',       // RE list is for prepaid/DTH
          status: '1',                  // All listed operators are active
          billerStatus: 'on',
          billFetch: 'NO',
          supportValidation: 'NOT_SUPPORTED',
          bbpsEnabled: 'NO',
          message: null,
          description: null,
          amountMinimum: 10,
          amountMaximum: 10000,
          isActive: true,
          sortOrder: index,
        });
      });

      await this.operatorRepository.save(operatorEntities);

      this.logger.log(`✅ Stored ${operatorEntities.length} operators in database`);

      return {
        success: true,
        operatorsStored: operatorEntities.length,
        message: `Successfully fetched and stored ${operatorEntities.length} operators from RechargeExchange`,
      };
    } catch (error) {
      this.logger.error('❌ Failed to fetch operators from RechargeExchange:', error.message);
      throw new BadRequestException('Failed to fetch operators. Please try again later.');
    }
  }

  /**
   * Get all operators from database (cached from KWIKAPI)
   * Returns cached operators to avoid hitting KWIKAPI rate limit
   */
  async getAllOperatorsFromDB(): Promise<Operator[]> {
    return this.operatorRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Get operator by KWIKAPI operator ID
   */
  async getOperatorById(operatorId: string): Promise<Operator | null> {
    return this.operatorRepository.findOne({
      where: { operatorId, isActive: true },
    });
  }

  /**
   * Get operator by name (case-insensitive, with KWIKAPI → RE alias mapping)
   */
  private async getOperatorByName(operatorName: string): Promise<Operator | null> {
    // Map common KWIKAPI provider names to RE operator name keywords
    const aliasMap: Record<string, string> = {
      jio: 'jio',
      reliance: 'jio',
      airtel: 'airtel',
      vi: 'vi',
      vodafone: 'vi',
      idea: 'vi',
      bsnl: 'bsnl',
      mtnl: 'mtnl',
      airteldigitaltv: 'airtel digital',
      dishtv: 'dish tv',
      sundirect: 'sun direct',
      tatasky: 'tata sky',
      d2h: 'videocon',
    };

    const normalized = operatorName.toLowerCase().replace(/\s+/g, '').trim();
    const searchTerm = aliasMap[normalized] || operatorName.toLowerCase().trim();

    const operators = await this.operatorRepository.find({
      where: { isActive: true },
    });

    return operators.find(op =>
      op.operatorName.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(op.operatorName.toLowerCase())
    ) || null;
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Simulate recharge API call
   * In production, replace with actual API integration
   */
  private async simulateRechargeAPI(
    transactionId: string,
    mobileNumber: string,
    operatorCode: string,
    amount: number
  ): Promise<void> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.logger.log(
      `[MOCK] Recharge API called: ${mobileNumber} - ${operatorCode} - ₹${amount}`
    );
    this.logger.log(`[MOCK] Transaction ID: ${transactionId}`);
    this.logger.log(`[MOCK] Status: SUCCESS`);

    // 95% success rate for testing
    const success = Math.random() > 0.05;
    if (!success) {
      throw new BadRequestException('Recharge failed. Please try again.');
    }
  }

  /**
   * Get mock plans for testing
   */
  private getMockPlans(operatorCode: string, category?: string): any[] {
    const allPlans = [
      // Popular plans
      {
        id: 'plan-1',
        amount: 239,
        validity: '28 days',
        data: '1.5GB/day',
        calling: 'Unlimited',
        category: 'POPULAR',
        operator: operatorCode,
        description: 'Unlimited voice calls with 1.5GB daily data',
        benefits: [
          '1.5GB data per day',
          'Unlimited voice calls to any network',
          '100 SMS/day',
          'Free national roaming',
        ],
      },
      {
        id: 'plan-2',
        amount: 299,
        validity: '28 days',
        data: '2GB/day',
        calling: 'Unlimited',
        category: 'POPULAR',
        operator: operatorCode,
        description: 'Best value plan with 2GB daily data',
        benefits: [
          '2GB data per day',
          'Unlimited voice calls',
          '100 SMS/day',
          'Free Wynk Music',
          'Free national roaming',
        ],
      },
      {
        id: 'plan-3',
        amount: 359,
        validity: '28 days',
        data: '2.5GB/day',
        calling: 'Unlimited',
        category: 'POPULAR',
        operator: operatorCode,
        description: 'Premium plan with extra data',
        benefits: [
          '2.5GB data per day',
          'Unlimited voice calls',
          '100 SMS/day',
          'Disney+ Hotstar Mobile',
          'Free national roaming',
        ],
      },
      {
        id: 'plan-4',
        amount: 479,
        validity: '56 days',
        data: '1.5GB/day',
        calling: 'Unlimited',
        category: 'POPULAR',
        operator: operatorCode,
        description: 'Long validity plan with daily data',
        benefits: [
          '1.5GB data per day for 56 days',
          'Unlimited calling',
          '100 SMS/day',
          'Free national roaming',
        ],
      },
      {
        id: 'plan-5',
        amount: 666,
        validity: '84 days',
        data: '1.5GB/day',
        calling: 'Unlimited',
        category: 'POPULAR',
        operator: operatorCode,
        description: '3-month plan with daily benefits',
        benefits: [
          '1.5GB data per day for 84 days',
          'Unlimited calling for 84 days',
          '100 SMS/day',
          'Free Wynk Music',
          'Free national roaming',
        ],
      },

      // Data plans
      {
        id: 'plan-6',
        amount: 19,
        validity: '1 day',
        data: '1GB',
        calling: 'NA',
        category: 'DATA',
        operator: operatorCode,
        description: 'Quick data top-up',
        benefits: ['1GB high-speed data', 'Valid for 1 day'],
      },
      {
        id: 'plan-7',
        amount: 48,
        validity: '3 days',
        data: '3GB',
        calling: 'NA',
        category: 'DATA',
        operator: operatorCode,
        description: 'Weekend data pack',
        benefits: ['3GB high-speed data', 'Valid for 3 days', 'No daily limit'],
      },
      {
        id: 'plan-8',
        amount: 98,
        validity: '7 days',
        data: '6GB',
        calling: 'NA',
        category: 'DATA',
        operator: operatorCode,
        description: 'Weekly data booster',
        benefits: [
          '6GB high-speed data',
          'Valid for 7 days',
          'Unlimited usage',
        ],
      },

      // Unlimited plans
      {
        id: 'plan-9',
        amount: 399,
        validity: '28 days',
        data: 'Unlimited',
        calling: 'Unlimited',
        category: 'UNLIMITED',
        operator: operatorCode,
        description: 'True unlimited data and calling',
        benefits: [
          'Unlimited 4G data',
          'Unlimited voice calls',
          'Unlimited SMS',
          'No daily limit',
          'Free national roaming',
        ],
      },
      {
        id: 'plan-10',
        amount: 719,
        validity: '56 days',
        data: 'Unlimited',
        calling: 'Unlimited',
        category: 'UNLIMITED',
        operator: operatorCode,
        description: '2-month unlimited pack',
        benefits: [
          'Unlimited 4G data for 56 days',
          'Unlimited calling',
          'Unlimited SMS',
          'Disney+ Hotstar Mobile',
          'Free national roaming',
        ],
      },
    ];

    return category
      ? allPlans.filter((plan) => plan.category === category)
      : allPlans.filter((plan) => plan.category === 'popular');
  }

  /**
   * Normalize KWIKAPI plans response to our format
   */
  private normalizeKwikApiPlans(
    apiResponse: any,
    categoryFilter?: string,
  ): any[] {
    if (!apiResponse.success || !apiResponse.plans) {
      return [];
    }

    const normalized: any[] = [];
    const categoryLabelMap = {
      DATA: 'Data',
      STV: 'Popular',
      FULLTT: 'Unlimited',
      PlanVoucher: 'Combo',
      TOPUP: 'Talktime',
      Romaing: 'Roaming',
      SMS: 'SMS',
    };

    // Log all category keys from API
    const apiCategoryKeys = Object.keys(apiResponse.plans);
    this.logger.log(`📦 KWIKAPI plan categories: [${apiCategoryKeys.join(', ')}] (${apiCategoryKeys.length} categories)`);

    // Iterate through each category
    Object.entries(apiResponse.plans).forEach(([kwikapiCategory, planData]) => {
      // Handle both array and object formats
      let plans: any[];
      if (Array.isArray(planData)) {
        plans = planData;
      } else if (planData && typeof planData === 'object') {
        // Some categories may wrap plans in an object — extract arrays from it
        plans = Object.values(planData).flat().filter((p: any) => p && typeof p === 'object' && p.rs);
      } else {
        return;
      }

      if (plans.length === 0) return;
      this.logger.log(`  → "${kwikapiCategory}" → "${categoryLabelMap[kwikapiCategory] || kwikapiCategory}" (${plans.length} plans)`);

      const categoryLabel = categoryLabelMap[kwikapiCategory] || kwikapiCategory;

      plans.forEach((plan: any, index: number) => {
        // Extract benefits from description
        const benefits = this.extractBenefitsFromKwikApiDesc(plan.desc);

        normalized.push({
          id: `kwik-${kwikapiCategory}-${plan.rs}-${index}`,
          amount: plan.rs,
          validity: plan.validity,
          data: this.extractDataFromDesc(plan.desc),
          calling: this.extractCallingFromDesc(plan.desc),
          category: categoryLabel,
          type: plan.Type,
          operator: apiResponse.operator,
          circle: apiResponse.circle,
          description: plan.desc,
          benefits,
        });
      });
    });

    this.logger.debug(
      `Normalized ${normalized.length} plans from KWIKAPI (filtered: ${categoryFilter || 'none'})`,
    );

    return normalized;
  }

  /**
   * Extract benefits from KWIKAPI plan description
   */
  private extractBenefitsFromKwikApiDesc(desc: string): string[] {
    if (!desc) return [];

    const benefits: string[] = [];

    // Split by pipe or newline
    const parts = desc.split(/\||\\n/).map((p) => p.trim());

    parts.forEach((part) => {
      if (part && part.length > 5) {
        // Skip very short parts
        // Clean up the benefit text
        const cleaned = part
          .replace(/^(Calls|Data|SMS|Additional Benenifit|Additional Benefit)\s*:\s*/i, '')
          .trim();

        if (cleaned) {
          benefits.push(cleaned);
        }
      }
    });

    return benefits.length > 0 ? benefits : [desc];
  }

  /**
   * Extract data info from description
   */
  private extractDataFromDesc(desc: string): string {
    if (!desc) return 'NA';

    // Look for patterns like "2GB/Day", "Unlimited", "3GB"
    const dataMatch = desc.match(
      /Data\s*:\s*([^|]+)|(\d+(\.\d+)?\s*(GB|MB)(\s*\/?\s*(Day|day|month))?|Unlimited)/i,
    );

    if (dataMatch) {
      return dataMatch[1]?.trim() || dataMatch[2]?.trim() || 'NA';
    }

    return 'NA';
  }

  /**
   * Extract calling info from description
   */
  private extractCallingFromDesc(desc: string): string {
    if (!desc) return 'NA';

    // Look for patterns like "Unlimited local, STD & Roaming"
    const callMatch = desc.match(/Calls\s*:\s*([^|]+)/i);

    if (callMatch) {
      return callMatch[1].trim();
    }

    if (desc.toLowerCase().includes('unlimited')) {
      return 'Unlimited';
    }

    return 'NA';
  }

  // ==================== DTH ====================

  /**
   * Get DTH plans from KWIKAPI using KWIKAPI operator ID
   */
  async getDthPlans(dto: GetDthPlansDto): Promise<any> {
    const { operatorId } = dto;

    this.logger.log(`📡 Fetching DTH plans for KWIKAPI operator ID: ${operatorId}`);

    const result = await this.kwikApiService.getDthPlans(operatorId);

    if (!result.success) {
      throw new BadRequestException(result.message || 'Failed to fetch DTH plans');
    }

    return {
      operator: result.operator,
      plans: result.plans,
    };
  }

  /**
   * Process DTH recharge
   * Plans fetched via KWIKAPI (operatorId), recharge executed via RE (reOperatorId)
   */
  async processDthRecharge(dto: DthRechargeDto, userId: string): Promise<any> {
    const { subscriberId, operatorId, operatorName, amount, paymentMethod, planName } = dto;

    this.logger.log(`Processing DTH recharge for ${subscriberId} - ${operatorName} - ₹${amount}`);

    // Duplicate prevention: block if same user + subscriber + amount recharged within last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentDthRecharge = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.category = :category', { category: TransactionCategory.DTH_RECHARGE })
      .andWhere('transaction.amount = :amount', { amount })
      .andWhere('transaction.createdAt > :twoMinutesAgo', { twoMinutesAgo })
      .getOne();

    if (recentDthRecharge) {
      throw new BadRequestException('Duplicate DTH recharge detected. Please wait a moment before retrying.');
    }

    // Map paymentMethod to TransactionPaymentMethod enum
    const txnPaymentMethod = paymentMethod === 'upi'
      ? TransactionPaymentMethod.UPI
      : TransactionPaymentMethod.CARD;

    // Create transaction record
    const transaction = this.transactionRepository.create({
      userId,
      type: TransactionType.RECHARGE,
      category: TransactionCategory.DTH_RECHARGE,
      status: TransactionStatus.PENDING,
      paymentMethod: txnPaymentMethod,
      amount,
      fee: 0,
      totalAmount: amount,
      description: `${operatorName} DTH ₹${amount} - ${subscriberId}`,
      metadata: {
        subscriberId,
        operatorId,
        operatorName,
        planName,
        paymentMethod: paymentMethod || 'razorpay',
      },
    });

    await this.transactionRepository.save(transaction);

    let reStatus: 'SUCCESS' | 'PENDING' | 'FAIL' = 'PENDING';
    let reTransid = '';

    try {
      // Look up operator by KWIKAPI operator ID to get RE opcode
      const operator = await this.operatorRepository.findOne({
        where: { operatorId, isActive: true },
      });

      if (!operator || !operator.reOperatorId) {
        throw new BadRequestException(`DTH operator not found or not supported for recharge`);
      }

      this.logger.log(`Using RE opcode: ${operator.reOperatorId} for ${operatorName}`);

      const transid = this.rechargeExchangeService.generateTransId();
      reTransid = transid;

      const reResponse = await this.rechargeExchangeService.processTransaction({
        opcode: operator.reOperatorId,
        number: subscriberId,
        amount,
        transid,
      });

      reStatus = reResponse.status as 'SUCCESS' | 'PENDING' | 'FAIL';

      this.logger.log(`RE Response: ${reResponse.status} | RefID: ${reResponse.referenceid}`);

      transaction.metadata = {
        ...transaction.metadata,
        rechargeexchange: {
          transid: reResponse.transid,
          optransid: reResponse.optransid,
          referenceid: reResponse.referenceid,
          balance: reResponse.balance,
          status: reResponse.status,
          message: reResponse.message,
        },
      };

      if (reResponse.status === 'SUCCESS') {
        transaction.status = TransactionStatus.SUCCESS;
        await this.transactionRepository.save(transaction);
        this.logger.log(`✅ DTH Recharge successful: ${transaction.id}`);

        await this.notificationEmitter.emitRechargeSuccess(userId, {
          transactionId: transaction.id,
          amount,
          phoneNumber: subscriberId,
          operator: operatorName,
          currency: '₹',
        });
      } else if (reResponse.status === 'PENDING') {
        await this.transactionRepository.save(transaction);
        this.logger.warn(`⏳ DTH Recharge PENDING: ${transaction.id}`);
      } else if (reResponse.status === 'FAIL') {
        throw new BadRequestException(reResponse.message || 'DTH recharge failed at provider');
      }
    } catch (error) {
      transaction.status = TransactionStatus.FAILED;
      transaction.failureReason = error.message;
      await this.transactionRepository.save(transaction);

      this.logger.error(`❌ DTH Recharge failed: ${transaction.id} - ${error.message}`);

      await this.notificationEmitter.emitRechargeFailed(userId, {
        transactionId: transaction.id,
        amount,
        phoneNumber: subscriberId,
        currency: '₹',
        reason: error.message || 'DTH recharge failed. Please try again.',
      });

      throw error;
    }

    return {
      success: true,
      transactionId: transaction.id,
      reTransid,
      reStatus,
      message: reStatus === 'SUCCESS' ? 'DTH recharge completed successfully' : 'DTH recharge is being processed.',
      subscriberId,
      operator: operatorName,
      amount,
      status: reStatus === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
    };
  }
}
