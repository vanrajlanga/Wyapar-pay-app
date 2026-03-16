/**
 * RechargeExchange Service
 *
 * Handles: Transaction, Balance, TransactionStatus, Complain, OperatorList
 * KwikAPI remains for: operator detection, plans, circles
 */

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RECHARGEEXCHANGE_ENDPOINTS,
  RECHARGEEXCHANGE_CACHE_TTL,
  RECHARGEEXCHANGE_RETRY_CONFIG,
  RECHARGEEXCHANGE_STATUS_MAP,
} from './rechargeexchange.constants';
import {
  RechargeExchangeTransactionRequest,
  RechargeExchangeTransactionResponse,
  RechargeExchangeBalanceResponse,
  RechargeExchangeStatusRequest,
  RechargeExchangeStatusResponse,
  RechargeExchangeComplainRequest,
  RechargeExchangeComplainResponse,
  RechargeExchangeOperator,
} from './rechargeexchange.interface';

@Injectable()
export class RechargeExchangeService implements OnModuleInit {
  private readonly logger = new Logger(RechargeExchangeService.name);
  private axiosInstance: AxiosInstance;
  private userid: string;
  private token: string;

  // Balance cache (10 min TTL as per RE docs)
  private balanceCache: {
    balance: string;
    sellbalance: string;
    timestamp: number;
  } | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.userid = this.configService.get<string>('RECHARGEEXCHANGE_USERID');
    this.token = this.configService.get<string>('RECHARGEEXCHANGE_TOKEN');

    if (!this.userid || !this.token) {
      this.logger.error('❌ RECHARGEEXCHANGE_USERID or RECHARGEEXCHANGE_TOKEN not configured');
      throw new Error('RechargeExchange credentials are not configured in .env');
    }

    this.axiosInstance = axios.create({ timeout: 30000 });

    this.axiosInstance.interceptors.request.use((config) => {
      this.logger.debug(`📤 RE Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`📥 RE Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logAxiosError(error);
        return Promise.reject(error);
      },
    );

    this.logger.log('✅ RechargeExchange Service initialized');
    this.logger.log(`   - UserID: ${this.userid}`);
  }

  // ==================== TRANSACTION ====================

  /**
   * Process a mobile/DTH recharge transaction
   * Status in response: SUCCESS / FAIL / PENDING
   * IMPORTANT: Do NOT send duplicate transid
   */
  async processTransaction(
    request: RechargeExchangeTransactionRequest,
  ): Promise<RechargeExchangeTransactionResponse> {
    this.logger.log(
      `📞 Processing recharge: ${request.number} | ₹${request.amount} | TxnID: ${request.transid}`,
    );

    try {
      const response = await this.axiosInstance.get<RechargeExchangeTransactionResponse>(
        RECHARGEEXCHANGE_ENDPOINTS.TRANSACTION,
        {
          params: {
            userid: this.userid,
            token: this.token,
            opcode: request.opcode,
            number: request.number,
            amount: request.amount,
            transid: request.transid,
          },
          timeout: 120000, // 2 min for recharge
        },
      );

      const data = response.data;
      this.logger.log(
        `📥 Recharge Response: ${data.status} | RefID: ${data.referenceid} | Balance: ₹${data.balance}`,
      );

      if (data.status === 'PENDING') {
        this.logger.warn(`⏳ PENDING for transid ${data.transid} — check status after 5 min`);
      } else if (data.status === 'SUCCESS') {
        this.logger.log(`✅ SUCCESS — OpTransID: ${data.optransid}`);
      } else if (data.status === 'FAIL') {
        this.logger.error(`❌ FAIL — ${data.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(`❌ Transaction API failed for transid ${request.transid}:`, error.message);

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Recharge request timed out. Please check status after a few seconds.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        'Recharge request failed. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== BALANCE ====================

  /**
   * Get account balance
   * NOTE: Check only once per 10 min as per RE docs — uses cache
   */
  async getBalance(forceRefresh = false): Promise<RechargeExchangeBalanceResponse> {
    if (!forceRefresh && this.balanceCache) {
      const age = Date.now() - this.balanceCache.timestamp;
      if (age < RECHARGEEXCHANGE_CACHE_TTL.BALANCE * 1000) {
        this.logger.debug(
          `💾 Cached balance (${Math.floor(age / 60000)} min old): ₹${this.balanceCache.balance}`,
        );
        return {
          status: 'SUCCESS',
          message: 'Balance from cache',
          balance: this.balanceCache.balance,
          sellbalance: this.balanceCache.sellbalance,
        };
      }
    }

    this.logger.log('💰 Fetching RechargeExchange balance...');

    try {
      const response = await this.axiosInstance.get<RechargeExchangeBalanceResponse>(
        RECHARGEEXCHANGE_ENDPOINTS.BALANCE,
        { params: { userid: this.userid, token: this.token } },
      );

      const data = response.data;

      if (data.status === 'SUCCESS') {
        this.balanceCache = {
          balance: data.balance,
          sellbalance: data.sellbalance,
          timestamp: Date.now(),
        };
        this.logger.log(`✅ Balance: ₹${data.balance} | Sell Balance: ₹${data.sellbalance}`);
      }

      return data;
    } catch (error) {
      this.logger.error('❌ Balance API failed:', error.message);

      if (this.balanceCache) {
        this.logger.warn('⚠️ Returning stale cached balance as fallback');
        return {
          status: 'SUCCESS',
          message: 'Balance from stale cache',
          balance: this.balanceCache.balance,
          sellbalance: this.balanceCache.sellbalance,
        };
      }

      throw new HttpException('Failed to fetch account balance', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  clearBalanceCache(): void {
    this.balanceCache = null;
    this.logger.log('🗑️ Balance cache cleared');
  }

  // ==================== TRANSACTION STATUS ====================

  /**
   * Check transaction status by client transid
   * NOTE: Check only after 5 min as per RE docs
   * If PENDING is returned, check again after 5 min
   */
  async getTransactionStatus(transid: string): Promise<RechargeExchangeStatusResponse> {
    this.logger.log(`📊 Checking status for transid: ${transid}`);

    try {
      const response = await this.axiosInstance.get<RechargeExchangeStatusResponse>(
        RECHARGEEXCHANGE_ENDPOINTS.TRANSACTION_STATUS,
        { params: { userid: this.userid, token: this.token, transid } },
      );

      const data = response.data;
      this.logger.log(`✅ Status: ${data.status} | Amount: ₹${data.amount} | ${data.message}`);

      if (data.status === 'PENDING') {
        this.logger.warn(`⏳ Still PENDING for transid ${transid} — retry after 5 min`);
      } else if (data.status === 'SUCCESS') {
        this.logger.log(`🎉 SUCCESS — OpTransID: ${data.optransid}`);
      } else if (data.status === 'FAIL') {
        this.logger.warn(`❌ FAILED — Amount will be auto-refunded by RE`);
      }

      return data;
    } catch (error) {
      this.logger.error(`❌ Status check failed for transid ${transid}:`, error.message);
      throw new HttpException('Failed to check transaction status', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ==================== COMPLAIN ====================

  /**
   * File a complaint for a successful transaction
   * Use referenceid from the original transaction response
   * NOTE: Only for SUCCESS transactions. No duplicate complaints.
   */
  async fileComplain(
    request: RechargeExchangeComplainRequest,
  ): Promise<RechargeExchangeComplainResponse> {
    this.logger.log(`📝 Filing complaint for referenceid: ${request.referenceid}`);

    try {
      const response = await this.axiosInstance.get<RechargeExchangeComplainResponse>(
        RECHARGEEXCHANGE_ENDPOINTS.COMPLAIN,
        {
          params: {
            userid: this.userid,
            token: this.token,
            referenceid: request.referenceid,
            remark: request.remark,
          },
        },
      );

      const data = response.data;
      this.logger.log(`✅ Complaint filed: ID ${data.complainid} — ${data.message}`);
      return data;
    } catch (error) {
      this.logger.error('❌ Complain API failed:', error.message);
      throw new HttpException('Failed to file complaint', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ==================== OPERATOR LIST ====================

  /**
   * Fetch live operator list from RechargeExchange
   * No auth required for this endpoint
   */
  async getOperatorList(): Promise<RechargeExchangeOperator[]> {
    this.logger.log('🔄 Fetching operator list from RechargeExchange...');

    try {
      const response = await this.axiosInstance.get<RechargeExchangeOperator[]>(
        RECHARGEEXCHANGE_ENDPOINTS.OPERATOR_LIST,
      );

      const operators = response.data;
      this.logger.log(`✅ Fetched ${operators.length} operators from RechargeExchange`);
      return operators;
    } catch (error) {
      this.logger.error('❌ OperatorList API failed:', error.message);
      throw new HttpException('Failed to fetch operator list', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ==================== UTILITIES ====================

  /**
   * Generate unique transaction ID for RechargeExchange
   * Format: timestamp (13) + random (6) = 19 digits
   * IMPORTANT: Never reuse a transid
   */
  generateTransId(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const transid = timestamp + random;
    this.logger.debug(`Generated transid: ${transid}`);
    return transid;
  }

  /**
   * Map RechargeExchange status to internal TransactionStatus
   */
  mapStatus(reStatus: string): string {
    return RECHARGEEXCHANGE_STATUS_MAP[reStatus] ?? 'PROCESSING';
  }

  private logAxiosError(error: AxiosError): void {
    if (error.response) {
      this.logger.error(
        `❌ RE Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      this.logger.error('❌ RE No response — network/timeout error');
    } else {
      this.logger.error('❌ RE Request setup error:', error.message);
    }
  }
}
