/**
 * KWIKAPI Service
 *
 * Main service for interacting with KWIKAPI recharge and bill payment gateway
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
import { KwikApiConfig } from './kwikapi.config';
import { KWIKAPI_ENDPOINTS, RETRY_CONFIG, HTTP_STATUS, CACHE_TTL } from './kwikapi.constants';
import {
  KwikApiRechargeRequest,
  KwikApiRechargeResponse,
  KwikApiPlanRequest,
  KwikApiPlansResponse,
  KwikApiDetectOperatorRequest,
  KwikApiDetectOperatorResponse,
  KwikApiStatusRequest,
  KwikApiStatusResponse,
  KwikApiBalanceResponse,
  KwikApiOperatorsResponse,
  KwikApiCirclesResponse,
  KwikApiBaseResponse,
} from './kwikapi.interface';

@Injectable()
export class KwikApiService implements OnModuleInit {
  private readonly logger = new Logger(KwikApiService.name);
  private axiosInstance: AxiosInstance;
  private config: KwikApiConfig;

  // Balance cache
  private balanceCache: {
    balance: string;
    plan_credit: string;
    timestamp: number;
  } | null = null;

  constructor(
    private configService: ConfigService,
  ) {
    this.config = new KwikApiConfig(configService);
  }

  /**
   * Initialize service on module load
   */
  async onModuleInit() {
    try {
      this.config.validate();
      this.initializeAxios();
      this.logger.log('✅ KWIKAPI Service initialized successfully');
    } catch (error) {
      this.logger.error('❌ KWIKAPI Service initialization failed:', error.message);
      if (this.config.isEnabled) {
        throw error;
      }
    }
  }

  /**
   * Initialize Axios instance with interceptors
   * Note: KWIKAPI uses form-data, not JSON
   */
  private initializeAxios() {
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        // KWIKAPI doesn't use Authorization header, API key is sent in request body
        'Accept': 'application/json',
      },
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `📤 KWIKAPI Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        this.logger.error('Request Interceptor Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `📥 KWIKAPI Response: ${response.status} ${response.config.url}`,
        );
        return response;
      },
      (error) => {
        this.handleApiError(error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any,
    params?: any,
    retryCount = 0,
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>({
        method,
        url: endpoint,
        data,
        params,
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      // Check if we should retry
      const shouldRetry =
        retryCount < this.config.retryAttempts &&
        status &&
        RETRY_CONFIG.RETRYABLE_STATUS_CODES.includes(status);

      if (shouldRetry) {
        const delay = Math.min(
          this.config.retryDelay * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount),
          RETRY_CONFIG.MAX_DELAY,
        );

        this.logger.warn(
          `⚠️  Retrying request (${retryCount + 1}/${this.config.retryAttempts}) after ${delay}ms...`,
        );

        await this.sleep(delay);
        return this.makeRequest<T>(method, endpoint, data, params, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors
   */
  private handleApiError(error: AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      this.logger.error(
        `❌ KWIKAPI Error [${status}]: ${data?.message || data?.error || 'Unknown error'}`,
      );

      // Log full error in debug mode
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.debug('Full error response:', JSON.stringify(data, null, 2));
      }
    } else if (error.request) {
      this.logger.error('❌ KWIKAPI No Response - Network/Timeout Error');
    } else {
      this.logger.error('❌ KWIKAPI Request Setup Error:', error.message);
    }
  }

  /**
   * Check if KWIKAPI is enabled
   */
  isEnabled(): boolean {
    return this.config.isEnabled;
  }

  // ==================== RECHARGE APIs ====================

  /**
   * Process mobile recharge
   *
   * IMPORTANT:
   * - This API returns PENDING status initially
   * - ALWAYS call checkRechargeStatus() separately to get final status
   * - Don't trust the immediate response for success confirmation
   *
   * @param request - Recharge request parameters
   * @returns Initial recharge response (usually PENDING)
   */
  async processRecharge(
    request: KwikApiRechargeRequest,
  ): Promise<KwikApiRechargeResponse> {
    this.logger.log(
      `📞 Processing recharge: ${request.number} | ₹${request.amount} | Order: ${request.order_id}`,
    );
    this.logger.debug(`Operator ID: ${request.opid} | State Code: ${request.state_code}`);

    try {
      // Call KWIKAPI recharge endpoint with high timeout
      const response = await this.axiosInstance.get<KwikApiRechargeResponse>(
        KWIKAPI_ENDPOINTS.MOBILE_RECHARGE,
        {
          params: {
            api_key: this.config.apiKey,
            number: request.number,
            amount: request.amount,
            opid: request.opid,
            state_code: request.state_code,
            order_id: request.order_id,
          },
          timeout: 120000, // 120 seconds (KWIKAPI recommends no timeout, but we set high value)
        },
      );

      const data = response.data;

      // Log the response
      this.logger.log(
        `📥 Recharge Response: ${data.status} | Provider: ${data.provider} | Charged: ₹${data.charged_amount}`,
      );
      this.logger.log(`💰 KWIKAPI Balance: ₹${data.balance}`);
      this.logger.log(`📝 Message: ${data.message}`);

      // Warning about status checking
      if (data.status === 'PENDING') {
        this.logger.warn(
          `⚠️  Status is PENDING for order ${data.order_id} - MUST check status separately!`,
        );
      } else if (data.status === 'SUCCESS') {
        this.logger.log(`✅ Immediate SUCCESS for order ${data.order_id} (verify via status API)`);
      } else if (data.status === 'FAILED') {
        this.logger.error(`❌ Immediate FAILED for order ${data.order_id}: ${data.message}`);
      }

      return data;
    } catch (error) {
      this.logger.error(
        `❌ Recharge API call failed for order ${request.order_id}:`,
        error.message,
      );

      if (error.response) {
        this.logger.error('Response:', JSON.stringify(error.response.data));
      }

      if (error.code === 'ECONNABORTED') {
        this.logger.error('⏱️  Request timeout - recharge may still be processing');
        throw new HttpException(
          'Recharge request timeout. Please check status after a few seconds.',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        'Recharge request failed. Please try again.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== PLAN APIs ====================

  /**
   * Get recharge plans for operator and circle
   * KWIKAPI v2 - Uses form-data
   */
  async getPlans(
    operatorId: string,
    circleCode: string,
  ): Promise<KwikApiPlansResponse> {
    this.logger.debug(
      `Fetching plans for operator ID: ${operatorId}, circle: ${circleCode}`,
    );

    try {
      // Create form-data
      const formData = new URLSearchParams();
      formData.append('api_key', this.config.apiKey);
      formData.append('opid', operatorId);
      formData.append('state_code', circleCode);

      const response = await this.axiosInstance.post<KwikApiPlansResponse>(
        KWIKAPI_ENDPOINTS.GET_PLANS,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.success) {
        // Count total plans
        const totalPlans = Object.values(response.data.plans || {}).reduce(
          (sum, plans) => sum + (plans?.length || 0),
          0,
        );

        this.logger.debug(
          `✅ Found ${totalPlans} plans for ${response.data.operator} in ${response.data.circle}`,
        );
        this.logger.debug(`💰 Credit Balance: ${response.data.hit_credit}`);
      } else {
        this.logger.warn(`⚠️  Plans fetch failed: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch plans:', error.message);
      if (error.response) {
        this.logger.error('Response:', JSON.stringify(error.response.data));
      }
      throw new HttpException(
        'Failed to fetch recharge plans',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get DTH plans for operator
   * KWIKAPI v2 - DTH_plans.php (no circle code needed)
   */
  async getDthPlans(operatorId: string): Promise<any> {
    this.logger.debug(`Fetching DTH plans for operator ID: ${operatorId}`);

    try {
      const formData = new URLSearchParams();
      formData.append('api_key', this.config.apiKey);
      formData.append('opid', operatorId);

      const response = await this.axiosInstance.post(
        KWIKAPI_ENDPOINTS.DTH_PLANS,
        formData.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      if (response.data.success) {
        this.logger.debug(`✅ DTH plans fetched for ${response.data.operator}`);
      } else {
        this.logger.warn(`⚠️  DTH plans fetch failed: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch DTH plans:', error.message);
      throw new HttpException('Failed to fetch DTH plans', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  // ==================== OPERATOR APIs ====================

  /**
   * Detect operator from mobile number
   * KWIKAPI v2 - Uses form-data
   */
  async detectOperator(mobileNumber: string): Promise<KwikApiDetectOperatorResponse> {
    this.logger.debug(`Detecting operator for ${mobileNumber}`);

    try {
      // Create form-data
      const formData = new URLSearchParams();
      formData.append('api_key', this.config.apiKey);
      formData.append('number', mobileNumber);

      const response = await this.axiosInstance.post<KwikApiDetectOperatorResponse>(
        KWIKAPI_ENDPOINTS.DETECT_OPERATOR,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.success) {
        this.logger.debug(
          `✅ Detected: ${response.data.details.provider} in ${response.data.details.circle_name}`,
        );
        this.logger.debug(`💰 Credit Balance: ${response.data.credit_balance}`);
      } else {
        this.logger.warn(`⚠️  Detection failed: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      this.logger.error('Operator detection failed:', error.message);
      if (error.response) {
        this.logger.error('Response:', JSON.stringify(error.response.data));
      }
      throw new HttpException(
        'Failed to detect operator',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get list of all operators
   */
  async getOperators(): Promise<KwikApiOperatorsResponse> {
    this.logger.debug('Fetching operator list');

    try {
      const response = await this.makeRequest<KwikApiOperatorsResponse>(
        'get',
        KWIKAPI_ENDPOINTS.GET_OPERATORS,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to fetch operators:', error.message);
      throw new HttpException(
        'Failed to fetch operator list',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get list of circles
   */
  async getCircles(): Promise<KwikApiCirclesResponse> {
    this.logger.debug('Fetching circle list');

    try {
      const response = await this.makeRequest<KwikApiCirclesResponse>(
        'get',
        KWIKAPI_ENDPOINTS.GET_CIRCLES,
      );

      return response;
    } catch (error) {
      this.logger.error('Failed to fetch circles:', error.message);
      throw new HttpException(
        'Failed to fetch circle list',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== TRANSACTION APIs ====================

  /**
   * Check transaction status
   * Note: 3 hits/transaction is allowed on this API
   *
   * @param orderId - Your unique order ID used during recharge
   * @returns Transaction status details
   */
  async checkRechargeStatus(orderId: string): Promise<KwikApiStatusResponse> {
    this.logger.log(`📊 Checking status for order: ${orderId}`);

    try {
      const response = await this.axiosInstance.get<KwikApiStatusResponse>(
        KWIKAPI_ENDPOINTS.CHECK_STATUS,
        {
          params: {
            api_key: this.config.apiKey,
            order_id: orderId,
          },
        },
      );

      if (response.data.response) {
        const status = response.data.response.status;
        const amount = response.data.response.amount;

        this.logger.log(
          `✅ Status fetched: ${status} | Amount: ₹${amount} | Order: ${orderId}`,
        );

        if (status === 'SUCCESS') {
          this.logger.log(`🎉 Recharge successful! Operator Ref: ${response.data.response.operator_ref}`);
        } else if (status === 'FAILED') {
          this.logger.warn(`⚠️  Recharge failed for order: ${orderId}`);
        } else if (status === 'PENDING') {
          this.logger.log(`⏳ Recharge pending for order: ${orderId}`);
        }
      }

      return response.data;
    } catch (error) {
      this.logger.error(`❌ Failed to check status for order: ${orderId}`, error.message);
      if (error.response) {
        this.logger.error('Response:', JSON.stringify(error.response.data));
      }
      throw new HttpException(
        'Failed to check transaction status',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ==================== ACCOUNT APIs ====================

  /**
   * Get KWIKAPI wallet balance
   * Note: 2 hits/hour is allowed on this API
   * Uses caching to respect rate limit (30 min cache)
   *
   * @param forceRefresh - Force refresh cache (default: false)
   * @returns Account balance and plan credit
   */
  async getWalletBalance(forceRefresh = false): Promise<KwikApiBalanceResponse> {
    // Check cache first (if not forcing refresh)
    if (!forceRefresh && this.balanceCache) {
      const cacheAge = Date.now() - this.balanceCache.timestamp;
      const cacheMaxAge = CACHE_TTL.BALANCE * 1000; // Convert to milliseconds

      if (cacheAge < cacheMaxAge) {
        const cacheAgeMinutes = Math.floor(cacheAge / 60000);
        this.logger.debug(
          `💾 Using cached balance (age: ${cacheAgeMinutes} min) | Balance: ₹${this.balanceCache.balance}`,
        );

        return {
          response: {
            balance: this.balanceCache.balance,
            plan_credit: this.balanceCache.plan_credit,
          },
        };
      } else {
        this.logger.debug('⏰ Cache expired, fetching fresh balance...');
      }
    }

    this.logger.log('💰 Fetching KWIKAPI wallet balance from API...');

    try {
      const response = await this.axiosInstance.get<KwikApiBalanceResponse>(
        KWIKAPI_ENDPOINTS.GET_BALANCE,
        {
          params: {
            api_key: this.config.apiKey,
          },
        },
      );

      if (response.data.response) {
        const { balance, plan_credit } = response.data.response;

        // Update cache
        this.balanceCache = {
          balance,
          plan_credit,
          timestamp: Date.now(),
        };

        this.logger.log(`✅ Balance fetched: ₹${balance} | Plan Credit: ${plan_credit}`);
        this.logger.debug('💾 Balance cached for 30 minutes');
      }

      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to fetch wallet balance:', error.message);
      if (error.response) {
        this.logger.error('Response:', JSON.stringify(error.response.data));
      }

      // Return cached balance if available (fallback)
      if (this.balanceCache) {
        this.logger.warn('⚠️  Using stale cache as fallback');
        return {
          response: {
            balance: this.balanceCache.balance,
            plan_credit: this.balanceCache.plan_credit,
          },
        };
      }

      throw new HttpException(
        'Failed to fetch account balance',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Clear balance cache (useful for admin operations)
   */
  clearBalanceCache(): void {
    this.balanceCache = null;
    this.logger.log('🗑️  Balance cache cleared');
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate unique order ID for KWIKAPI
   * Max 20 digits as per KWIKAPI requirement
   *
   * Format: timestamp (13 digits) + random (6 digits) = 19 digits
   * Example: 1706123456789123456
   *
   * @returns Unique order ID string (max 20 digits)
   */
  generateOrderId(): string {
    const timestamp = Date.now().toString(); // 13 digits
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0'); // 6 digits

    const orderId = timestamp + random; // 19 digits total

    this.logger.debug(`Generated order ID: ${orderId} (${orderId.length} digits)`);
    return orderId;
  }

  /**
   * Test KWIKAPI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('Testing KWIKAPI connection...');
      const response = await this.getWalletBalance(true); // Force refresh to test actual API
      this.logger.log('✅ KWIKAPI connection test successful');
      return !!response.response;
    } catch (error) {
      this.logger.error('❌ KWIKAPI connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfiguration() {
    return this.config.getConfig();
  }
}
