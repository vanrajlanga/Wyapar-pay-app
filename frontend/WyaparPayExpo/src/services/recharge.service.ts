/**
 * Recharge Service
 * Handles all recharge-related API calls
 */

import { apiService } from './api.service';
import { logger } from './logger.service';
import { API_ENDPOINTS } from '../constants';
import {
  Operator,
  Circle,
  OperatorDetectionResult,
  RechargePlan,
  PlanCategory,
  ValidationResult,
  RechargeRequest,
  RechargeResponse,
  RechargeTransaction,
  Favorite,
  AddFavoriteRequest,
} from '../types/recharge';

class RechargeManagementService {
  /**
   * Detect operator from mobile number
   */
  async detectOperator(
    mobileNumber: string,
    accessToken: string
  ): Promise<OperatorDetectionResult> {
    try {
      logger.info('Detecting operator', {
        mobileNumber,
        endpoint: API_ENDPOINTS.RECHARGE.DETECT_OPERATOR,
      });

      const response = await apiService.post<OperatorDetectionResult>(
        API_ENDPOINTS.RECHARGE.DETECT_OPERATOR,
        { mobileNumber },
        accessToken
      );

      logger.info('Operator detected', { operator: response.operatorCode });
      return response;
    } catch (error) {
      logger.error('Failed to detect operator', error);
      throw error;
    }
  }

  /**
   * Get list of all supported operators
   */
  async getOperators(accessToken: string): Promise<Operator[]> {
    try {
      logger.info('Fetching operators');

      const response = await apiService.get<Operator[]>(
        API_ENDPOINTS.RECHARGE.GET_OPERATORS,
        accessToken
      );

      logger.info('Operators fetched', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch operators', error);
      throw error;
    }
  }

  /**
   * Get circles for a specific operator
   */
  async getCircles(
    operatorCode: string,
    accessToken: string
  ): Promise<Circle[]> {
    try {
      logger.info('Fetching circles', { operatorCode });

      const response = await apiService.get<Circle[]>(
        API_ENDPOINTS.RECHARGE.GET_CIRCLES(operatorCode),
        accessToken
      );

      logger.info('Circles fetched', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch circles', error);
      throw error;
    }
  }

  /**
   * Get all circles from database (cached from KWIKAPI)
   * Returns cached circles to avoid hitting KWIKAPI rate limit
   */
  async getAllCircles(accessToken: string): Promise<Array<{
    circleCode: string;
    circleName: string;
  }>> {
    try {
      logger.info('Fetching all circles from database');

      const response = await apiService.get<Array<{
        circleCode: string;
        circleName: string;
      }>>(
        API_ENDPOINTS.RECHARGE.GET_ALL_CIRCLES,
        accessToken
      );

      logger.info('All circles fetched from database', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch all circles', error);
      throw error;
    }
  }

  /**
   * Get all operators from database (cached from KWIKAPI)
   * Returns cached operators with KWIKAPI operator IDs to avoid hitting rate limit
   */
  async getAllOperatorsFromDB(accessToken: string): Promise<Array<{
    operatorId: string;
    operatorName: string;
    serviceType: string;
    status: string;
    amountMinimum: number;
    amountMaximum: number;
  }>> {
    try {
      logger.info('Fetching all operators from database');

      const response = await apiService.get<Array<{
        operatorId: string;
        operatorName: string;
        serviceType: string;
        status: string;
        amountMinimum: number;
        amountMaximum: number;
      }>>(
        API_ENDPOINTS.RECHARGE.GET_ALL_OPERATORS,
        accessToken
      );

      logger.info('All operators fetched from database', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch operators from database', error);
      throw error;
    }
  }

  /**
   * Fetch and store operators from KWIKAPI (Admin only - rate limited to 15 hits/day)
   * Should only be called when syncing operator data
   */
  async fetchAndStoreOperators(accessToken: string): Promise<{
    success: boolean;
    operatorsStored: number;
    message: string;
  }> {
    try {
      logger.info('Syncing operators from KWIKAPI to database');

      const response = await apiService.post<{
        success: boolean;
        operatorsStored: number;
        message: string;
      }>(
        API_ENDPOINTS.RECHARGE.FETCH_AND_STORE_OPERATORS,
        {},
        accessToken
      );

      logger.info('Operators synced successfully', {
        operatorsStored: response.operatorsStored
      });
      return response;
    } catch (error) {
      logger.error('Failed to sync operators', error);
      throw error;
    }
  }

  /**
   * Fetch and store circles from KWIKAPI (Admin only - rate limited to 2 hits/day)
   * Should only be called when syncing circle data
   */
  async fetchAndStoreCircles(accessToken: string): Promise<{
    success: boolean;
    circlesStored: number;
    message: string;
  }> {
    try {
      logger.info('Syncing circles from KWIKAPI to database');

      const response = await apiService.post<{
        success: boolean;
        circlesStored: number;
        message: string;
      }>(
        API_ENDPOINTS.RECHARGE.FETCH_AND_STORE_CIRCLES,
        {},
        accessToken
      );

      logger.info('Circles synced successfully', {
        circlesStored: response.circlesStored
      });
      return response;
    } catch (error) {
      logger.error('Failed to sync circles', error);
      throw error;
    }
  }

  /**
   * Get recharge plans for operator and circle (KWIKAPI)
   */
  async getPlans(
    operatorCode: string,
    circleCode?: string,
    category?: PlanCategory,
    accessToken?: string,
    operatorId?: string // KWIKAPI operator ID from detection
  ): Promise<RechargePlan[]> {
    try {
      logger.info('Fetching plans from KWIKAPI', {
        operatorCode,
        circleCode,
        category,
        operatorId,
      });

      const params = new URLSearchParams();
      params.append('operatorCode', operatorCode);
      if (circleCode) params.append('circleCode', circleCode);
      if (category) params.append('category', category);
      if (operatorId) params.append('operatorId', operatorId); // Pass KWIKAPI operator ID

      const url = `${API_ENDPOINTS.RECHARGE.GET_PLANS}?${params.toString()}`;

      const response = await apiService.get<any[]>(
        url,
        accessToken ? accessToken : undefined
      );

      // Transform plans to ensure amount is a number (KWIKAPI returns it as string)
      const plans: RechargePlan[] = response.map((plan) => ({
        ...plan,
        amount: typeof plan.amount === 'string' ? Number(plan.amount) : plan.amount,
      }));

      logger.info('Plans fetched from KWIKAPI', { count: plans.length });
      return plans;
    } catch (error) {
      logger.error('Failed to fetch plans', error);
      throw error;
    }
  }

  /**
   * Validate recharge before processing
   */
  async validateRecharge(
    mobileNumber: string,
    operatorCode: string,
    amount: number,
    accessToken: string
  ): Promise<ValidationResult> {
    try {
      logger.info('Validating recharge', {
        mobileNumber,
        operatorCode,
        amount,
      });

      const response = await apiService.post<ValidationResult>(
        API_ENDPOINTS.RECHARGE.VALIDATE,
        { mobileNumber, operatorCode, amount },
        accessToken
      );

      logger.info('Validation result', { valid: response.valid });
      return response;
    } catch (error) {
      logger.error('Validation failed', error);
      throw error;
    }
  }

  /**
   * Process mobile recharge
   */
  async processMobileRecharge(
    data: RechargeRequest,
    accessToken: string
  ): Promise<RechargeResponse> {
    try {
      logger.logUserAction('recharge_initiated', {
        mobileNumber: data.mobileNumber,
        operator: data.operatorCode,
        amount: data.amount,
      });

      const response = await apiService.post<RechargeResponse>(
        API_ENDPOINTS.RECHARGE.PROCESS_MOBILE,
        data,
        accessToken
      );

      if (response.success) {
        logger.logUserAction('recharge_success', {
          transactionId: response.transactionId,
        });
      } else {
        logger.logUserAction('recharge_failed', {
          message: response.message,
        });
      }

      return response;
    } catch (error) {
      logger.error('Recharge processing failed', error);
      throw error;
    }
  }

  /**
   * Get recharge transaction history
   */
  async getRechargeHistory(
    limit: number = 20,
    offset: number = 0,
    accessToken: string
  ): Promise<RechargeTransaction[]> {
    try {
      logger.info('Fetching recharge history', { limit, offset });

      const url = `${API_ENDPOINTS.RECHARGE.GET_HISTORY}?limit=${limit}&offset=${offset}`;

      const response = await apiService.get<RechargeTransaction[]>(
        url,
        accessToken
      );

      logger.info('History fetched', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch history', error);
      throw error;
    }
  }

  /**
   * Get user's favorite recharge numbers
   */
  async getFavorites(type?: string, accessToken?: string): Promise<Favorite[]> {
    try {
      logger.info('Fetching favorites', { type });

      const url = type
        ? `${API_ENDPOINTS.RECHARGE.GET_FAVORITES}?type=${type}`
        : API_ENDPOINTS.RECHARGE.GET_FAVORITES;

      const response = await apiService.get<Favorite[]>(
        url,
        accessToken ? accessToken : undefined
      );

      logger.info('Favorites fetched', { count: response.length });
      return response;
    } catch (error) {
      logger.error('Failed to fetch favorites', error);
      throw error;
    }
  }

  /**
   * Add a number to favorites
   */
  async addFavorite(
    data: AddFavoriteRequest,
    accessToken: string
  ): Promise<Favorite> {
    try {
      logger.info('Adding favorite', { accountNumber: data.accountNumber });

      const response = await apiService.post<Favorite>(
        API_ENDPOINTS.RECHARGE.ADD_FAVORITE,
        data,
        accessToken
      );

      logger.info('Favorite added', { id: response.id });
      return response;
    } catch (error) {
      logger.error('Failed to add favorite', error);
      throw error;
    }
  }

  /**
   * Remove a favorite
   */
  async removeFavorite(favoriteId: string, accessToken: string): Promise<void> {
    try {
      logger.info('Removing favorite', { favoriteId });

      await apiService.delete(
        API_ENDPOINTS.RECHARGE.REMOVE_FAVORITE(favoriteId),
        accessToken
      );

      logger.info('Favorite removed', { favoriteId });
    } catch (error) {
      logger.error('Failed to remove favorite', error);
      throw error;
    }
  }

  /**
   * Get KWIKAPI wallet balance
   */
  async getKwikApiBalance(
    forceRefresh: boolean = false,
    accessToken: string
  ): Promise<{
    response: {
      balance: string;
      plan_credit: string;
    };
  }> {
    try {
      logger.info('Fetching KWIKAPI balance', { forceRefresh });

      const queryParams = forceRefresh ? '?forceRefresh=true' : '';
      const response = await apiService.get<{
        response: {
          balance: string;
          plan_credit: string;
        };
      }>(`${API_ENDPOINTS.RECHARGE.KWIKAPI_BALANCE}${queryParams}`, accessToken);

      logger.info('KWIKAPI balance fetched', {
        balance: response.response.balance,
      });

      return response;
    } catch (error) {
      logger.error('Failed to fetch KWIKAPI balance', error);
      throw error;
    }
  }

  /**
   * Process recharge with KWIKAPI
   */
  async processKwikApiRecharge(data: {
    mobileNumber: string;
    amount: number;
    operatorId: string;
    orderId: string;
    accessToken: string;
  }): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    order_id: string;
    opr_id: string;
    balance: string;
    number: string;
    provider: string;
    amount: string;
    charged_amount: string;
    message: string;
  }> {
    try {
      logger.info('Processing KWIKAPI recharge', {
        mobileNumber: data.mobileNumber,
        amount: data.amount,
        orderId: data.orderId,
      });

      const response = await apiService.post<{
        status: 'PENDING' | 'SUCCESS' | 'FAILED';
        order_id: string;
        opr_id: string;
        balance: string;
        number: string;
        provider: string;
        amount: string;
        charged_amount: string;
        message: string;
      }>(
        API_ENDPOINTS.RECHARGE.KWIKAPI_RECHARGE,
        {
          number: data.mobileNumber,
          amount: data.amount,
          opid: data.operatorId,
          state_code: 0,
          order_id: data.orderId,
        },
        data.accessToken
      );

      logger.info('KWIKAPI recharge response', {
        status: response.status,
        orderId: response.order_id,
      });

      return response;
    } catch (error) {
      logger.error('KWIKAPI recharge failed', error);
      throw error;
    }
  }

  /**
   * Check KWIKAPI recharge status
   */
  async checkKwikApiStatus(
    orderId: string,
    accessToken: string
  ): Promise<{
    response: {
      order_id: string;
      operator_ref: string;
      opr_id: string;
      status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
      number: string;
      amount: string;
      service: string;
      charged_amount: string;
      closing_balance: string;
      available_balance: string;
      pid: string;
      date: string;
    };
  }> {
    try {
      logger.info('Checking KWIKAPI status', { orderId });

      const response = await apiService.get<{
        response: {
          order_id: string;
          operator_ref: string;
          opr_id: string;
          status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
          number: string;
          amount: string;
          service: string;
          charged_amount: string;
          closing_balance: string;
          available_balance: string;
          pid: string;
          date: string;
        };
      }>(`${API_ENDPOINTS.RECHARGE.KWIKAPI_STATUS}?orderId=${orderId}`, accessToken);

      logger.info('KWIKAPI status response', {
        status: response.response.status,
        orderId: response.response.order_id,
      });

      return response;
    } catch (error) {
      logger.error('Failed to check KWIKAPI status', error);
      throw error;
    }
  }

  /**
   * Complete recharge flow via /recharge/mobile (RechargeExchange)
   * Backend handles the RE transaction. If PENDING, polls /recharge/status.
   */
  async processCompleteRecharge(params: {
    mobileNumber: string;
    amount: number;
    operatorId: string;
    operatorName: string;
    accessToken: string;
  }): Promise<{
    success: boolean;
    status: 'SUCCESS' | 'FAILED' | 'TIMEOUT';
    message: string;
    data?: any;
  }> {
    try {
      logger.info('Starting recharge via /recharge/mobile', {
        mobileNumber: params.mobileNumber,
        amount: params.amount,
        operatorName: params.operatorName,
      });

      // Step 1: Call /recharge/mobile — backend handles RE transaction
      const rechargeResponse = await apiService.post<{
        success: boolean;
        transactionId: string;
        reTransid: string;
        reStatus: 'SUCCESS' | 'PENDING' | 'FAIL';
        status: string;
        message: string;
        mobileNumber: string;
        operator: string;
        amount: number;
      }>(
        API_ENDPOINTS.RECHARGE.PROCESS_MOBILE,
        {
          mobileNumber: params.mobileNumber,
          amount: params.amount,
          operatorCode: params.operatorName,
          paymentMethod: 'card', // Razorpay payment — skip wallet balance check
        },
        params.accessToken
      );

      logger.info('Recharge response from backend:', {
        status: rechargeResponse.reStatus,
        transactionId: rechargeResponse.transactionId,
        reTransid: rechargeResponse.reTransid,
      });

      // Step 2: If immediately SUCCESS, return
      if (rechargeResponse.reStatus === 'SUCCESS') {
        return {
          success: true,
          status: 'SUCCESS',
          message: 'Recharge successful!',
          data: rechargeResponse,
        };
      }

      // Step 3: If PENDING, poll /recharge/status (max 5 attempts, 30s apart)
      if (rechargeResponse.reStatus === 'PENDING' && rechargeResponse.reTransid) {
        await this.sleep(15000); // Wait 15 seconds before first status check

        for (let attempt = 1; attempt <= 5; attempt++) {
          logger.info(`RE Status Check Attempt ${attempt}/5`, {
            reTransid: rechargeResponse.reTransid,
          });

          const statusResponse = await apiService.get<{
            status: 'SUCCESS' | 'PENDING' | 'FAIL';
            transid: string;
            optransid: string;
            amount: string;
            message: string;
          }>(
            `${API_ENDPOINTS.RECHARGE.RE_STATUS}?transid=${rechargeResponse.reTransid}`,
            params.accessToken
          );

          logger.info(`RE Status Attempt ${attempt}/5:`, {
            status: statusResponse.status,
          });

          if (statusResponse.status === 'SUCCESS') {
            return {
              success: true,
              status: 'SUCCESS',
              message: 'Recharge successful!',
              data: { ...rechargeResponse, rechargeStatus: statusResponse },
            };
          } else if (statusResponse.status === 'FAIL') {
            return {
              success: false,
              status: 'FAILED',
              message: `Recharge failed: ${statusResponse.message || 'Unknown error'}`,
              data: statusResponse,
            };
          } else if (statusResponse.status === 'PENDING') {
            if (attempt < 5) {
              await this.sleep(30000); // Wait 30 seconds between attempts
            } else {
              return {
                success: false,
                status: 'TIMEOUT',
                message: 'Recharge is still processing. Please check your transaction history in a few minutes.',
              };
            }
          }
        }
      }

      return {
        success: false,
        status: 'TIMEOUT',
        message: 'Recharge status unknown. Please check your transaction history.',
      };
    } catch (error) {
      logger.error('Complete recharge flow failed', error);
      throw error;
    }
  }

  /**
   * Sleep utility for status polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch DTH plans from KWIKAPI via backend
   */
  async getDthPlans(operatorId: string): Promise<{
    operator: string;
    plans: Record<string, any[]>;
  }> {
    try {
      logger.info('Fetching DTH plans', { operatorId });
      const response = await apiService.get<{ operator: string; plans: Record<string, any[]> }>(
        `${API_ENDPOINTS.RECHARGE.DTH_PLANS}?operatorId=${operatorId}`
      );
      return response;
    } catch (error) {
      logger.error('Failed to fetch DTH plans', error);
      throw error;
    }
  }

  /**
   * Process DTH recharge via backend
   */
  async processDthRecharge(params: {
    subscriberId: string;
    operatorId: string;
    operatorName: string;
    amount: number;
    planName?: string;
    accessToken: string;
  }): Promise<{ success: boolean; status: string; message: string; data?: any }> {
    try {
      logger.info('Processing DTH recharge', {
        subscriberId: params.subscriberId,
        operatorName: params.operatorName,
        amount: params.amount,
      });

      const response = await apiService.post<{
        success: boolean;
        transactionId: string;
        reTransid: string;
        reStatus: 'SUCCESS' | 'PENDING' | 'FAIL';
        message: string;
      }>(
        API_ENDPOINTS.RECHARGE.PROCESS_DTH,
        {
          subscriberId: params.subscriberId,
          operatorId: params.operatorId,
          operatorName: params.operatorName,
          amount: params.amount,
          planName: params.planName,
          paymentMethod: 'card',
        },
        params.accessToken
      );

      if (response.reStatus === 'SUCCESS' || response.reStatus === 'PENDING') {
        return { success: true, status: response.reStatus, message: response.message, data: response };
      }

      return { success: false, status: 'FAILED', message: response.message };
    } catch (error: any) {
      logger.error('DTH recharge failed', error);
      throw error;
    }
  }
}

export const rechargeService = new RechargeManagementService();
