/**
 * Recharge Context
 * Global state management for recharge operations
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { rechargeService } from '../services/recharge.service';
import { logger } from '../services/logger.service';
import { useAuth } from './AuthContext';
import {
  RechargeState,
  RechargeFormData,
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

interface RechargeContextType extends RechargeState {
  // Operator detection
  detectOperator: (
    mobileNumber: string
  ) => Promise<OperatorDetectionResult | null>;

  // Operators & circles
  loadOperators: () => Promise<void>;
  loadCircles: (operatorCode: string) => Promise<void>;

  // Plans
  loadPlans: (
    operatorCode: string,
    circleCode?: string,
    category?: PlanCategory
  ) => Promise<void>;
  setSelectedCategory: (category: PlanCategory) => void;

  // Form data
  updateFormData: (data: Partial<RechargeFormData>) => void;
  resetFormData: () => void;
  clearFormData: () => void; // Alias for resetFormData

  // Validation
  validateRecharge: (
    mobileNumber: string,
    operatorCode: string,
    amount: number
  ) => Promise<boolean>;

  // Transaction
  lastTransaction: RechargeResponse | null; // Last completed transaction
  setLastTransaction: (transaction: RechargeResponse | null) => void;
  processRecharge: (data: RechargeRequest) => Promise<RechargeResponse | null>;
  loadTransactionHistory: (limit?: number, offset?: number) => Promise<void>;

  // Favorites
  loadFavorites: (type?: string) => Promise<void>;
  addToFavorites: (data: AddFavoriteRequest) => Promise<void>;
  removeFromFavorites: (favoriteId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  resetState: () => void;
}

const initialFormData: RechargeFormData = {
  mobileNumber: '',
  operatorCode: '',
  operatorName: '',
  circleCode: '',
  circleName: '',
  amount: 0,
  paymentMethod: 'wallet',
};

const initialState: RechargeState = {
  formData: initialFormData,
  operators: [],
  circles: [],
  detectedOperator: null,
  plans: [],
  selectedCategory: 'popular',
  validationResult: null,
  currentTransaction: null,
  transactionHistory: [],
  favorites: [],
  isDetecting: false,
  isLoadingPlans: false,
  isValidating: false,
  isProcessing: false,
  isLoadingHistory: false,
  isLoadingFavorites: false,
  error: null,
};

const RechargeContext = createContext<RechargeContextType | undefined>(
  undefined
);

export const RechargeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { tokens } = useAuth();
  const [state, setState] = useState<RechargeState>(initialState);

  // Helper to get token
  const getToken = useCallback(() => {
    logger.debug('Getting authentication token', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.accessToken,
    });

    if (!tokens?.accessToken) {
      logger.warn('No access token available in RechargeContext');
      throw new Error('Not authenticated');
    }

    return tokens.accessToken;
  }, [tokens]);

  // Detect operator
  const detectOperator = useCallback(
    async (mobileNumber: string): Promise<OperatorDetectionResult | null> => {
      try {
        setState((prev) => ({ ...prev, isDetecting: true, error: null }));

        logger.debug('Starting operator detection', { mobileNumber });
        const token = getToken();

        const result = await rechargeService.detectOperator(
          mobileNumber,
          token
        );

        logger.info('Operator detection successful', {
          operator: result.operatorCode,
        });
        setState((prev) => ({
          ...prev,
          detectedOperator: result,
          isDetecting: false,
        }));

        return result;
      } catch (error: any) {
        logger.error('Failed to detect operator', error);
        setState((prev) => ({
          ...prev,
          isDetecting: false,
          error: error.message || 'Failed to detect operator',
        }));
        return null;
      }
    },
    [getToken]
  );

  // Load operators
  const loadOperators = useCallback(async () => {
    try {
      const token = getToken();
      const operators = await rechargeService.getOperators(token);

      setState((prev) => ({ ...prev, operators }));
    } catch (error: any) {
      logger.error('Failed to load operators', error);
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to load operators',
      }));
    }
  }, [getToken]);

  // Load circles
  const loadCircles = useCallback(
    async (operatorCode: string) => {
      try {
        const token = getToken();
        const circles = await rechargeService.getCircles(operatorCode, token);

        setState((prev) => ({ ...prev, circles }));
      } catch (error: any) {
        logger.error('Failed to load circles', error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to load circles',
        }));
      }
    },
    [getToken]
  );

  // Load plans
  const loadPlans = useCallback(
    async (
      operatorCode: string,
      circleCode?: string,
      category?: PlanCategory
    ) => {
      try {
        setState((prev) => ({ ...prev, isLoadingPlans: true, error: null }));

        const token = getToken();

        // Get operatorId and numeric circleCode from detectedOperator if available
        // KWIKAPI requires numeric circle code (e.g., "8"), not string (e.g., "GUJARAT")
        const operatorId = state.detectedOperator?.operatorId;
        const kwikApiCircleCode = state.detectedOperator?.circleCode;

        // Use KWIKAPI numeric circle code if available, otherwise fallback to parameter
        const finalCircleCode = kwikApiCircleCode || circleCode;

        logger.debug('Loading plans with KWIKAPI data', {
          operatorCode,
          circleCode: finalCircleCode,
          originalCircleCode: circleCode,
          kwikApiCircleCode,
          operatorId,
          category: category || state.selectedCategory,
        });

        const plans = await rechargeService.getPlans(
          operatorCode,
          finalCircleCode,
          category || state.selectedCategory,
          token,
          operatorId // Pass KWIKAPI operator ID
        );

        setState((prev) => ({
          ...prev,
          plans,
          isLoadingPlans: false,
        }));
      } catch (error: any) {
        logger.error('Failed to load plans', error);
        setState((prev) => ({
          ...prev,
          isLoadingPlans: false,
          error: error.message || 'Failed to load plans',
        }));
      }
    },
    [getToken, state.selectedCategory, state.detectedOperator]
  );

  // Set selected category
  const setSelectedCategory = useCallback((category: PlanCategory) => {
    setState((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  // Update form data
  const updateFormData = useCallback((data: Partial<RechargeFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: prev.formData
        ? { ...prev.formData, ...data }
        : { ...initialFormData, ...data },
    }));
  }, []);

  // Reset form data
  const resetFormData = useCallback(() => {
    setState((prev) => ({ ...prev, formData: initialFormData }));
  }, []);

  // Validate recharge
  const validateRecharge = useCallback(
    async (
      mobileNumber: string,
      operatorCode: string,
      amount: number
    ): Promise<boolean> => {
      try {
        setState((prev) => ({ ...prev, isValidating: true, error: null }));

        const token = getToken();
        const result = await rechargeService.validateRecharge(
          mobileNumber,
          operatorCode,
          amount,
          token
        );

        setState((prev) => ({
          ...prev,
          validationResult: result,
          isValidating: false,
        }));

        return result.valid;
      } catch (error: any) {
        logger.error('Validation failed', error);
        setState((prev) => ({
          ...prev,
          isValidating: false,
          validationResult: {
            valid: false,
            message: error.message || 'Validation failed',
          },
        }));
        return false;
      }
    },
    [getToken]
  );

  // Process recharge
  const processRecharge = useCallback(
    async (data: RechargeRequest): Promise<RechargeResponse | null> => {
      try {
        setState((prev) => ({ ...prev, isProcessing: true, error: null }));

        const token = getToken();
        const result = await rechargeService.processMobileRecharge(data, token);

        setState((prev) => ({
          ...prev,
          currentTransaction: result,
          isProcessing: false,
        }));

        // Reload history after successful recharge
        if (result.success) {
          await loadTransactionHistory();
        }

        return result;
      } catch (error: any) {
        logger.error('Recharge processing failed', error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error.message || 'Recharge failed',
        }));
        return null;
      }
    },
    [getToken]
  );

  // Load transaction history
  const loadTransactionHistory = useCallback(
    async (limit: number = 20, offset: number = 0) => {
      try {
        setState((prev) => ({ ...prev, isLoadingHistory: true, error: null }));

        const token = getToken();
        const history = await rechargeService.getRechargeHistory(
          limit,
          offset,
          token
        );

        setState((prev) => ({
          ...prev,
          transactionHistory: history,
          isLoadingHistory: false,
        }));
      } catch (error: any) {
        logger.error('Failed to load history', error);
        setState((prev) => ({
          ...prev,
          isLoadingHistory: false,
          error: error.message || 'Failed to load history',
        }));
      }
    },
    [getToken]
  );

  // Load favorites
  const loadFavorites = useCallback(
    async (type?: string) => {
      try {
        setState((prev) => ({
          ...prev,
          isLoadingFavorites: true,
          error: null,
        }));

        const token = getToken();
        const favorites = await rechargeService.getFavorites(type, token);

        setState((prev) => ({
          ...prev,
          favorites,
          isLoadingFavorites: false,
        }));
      } catch (error: any) {
        logger.error('Failed to load favorites', error);
        setState((prev) => ({
          ...prev,
          isLoadingFavorites: false,
          error: error.message || 'Failed to load favorites',
        }));
      }
    },
    [getToken]
  );

  // Add to favorites
  const addToFavorites = useCallback(
    async (data: AddFavoriteRequest) => {
      try {
        const token = getToken();
        await rechargeService.addFavorite(data, token);

        // Reload favorites
        await loadFavorites(data.type);
      } catch (error: any) {
        logger.error('Failed to add favorite', error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to add favorite',
        }));
        throw error;
      }
    },
    [getToken, loadFavorites]
  );

  // Remove from favorites
  const removeFromFavorites = useCallback(
    async (favoriteId: string) => {
      try {
        const token = getToken();
        await rechargeService.removeFavorite(favoriteId, token);

        // Update local state
        setState((prev) => ({
          ...prev,
          favorites: prev.favorites.filter((f) => f.id !== favoriteId),
        }));
      } catch (error: any) {
        logger.error('Failed to remove favorite', error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to remove favorite',
        }));
        throw error;
      }
    },
    [getToken]
  );

  // Set last transaction
  const setLastTransaction = useCallback((transaction: RechargeResponse | null) => {
    setState((prev) => ({ ...prev, currentTransaction: transaction }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const value: RechargeContextType = {
    ...state,
    detectOperator,
    loadOperators,
    loadCircles,
    loadPlans,
    setSelectedCategory,
    updateFormData,
    resetFormData,
    clearFormData: resetFormData, // Alias
    lastTransaction: state.currentTransaction, // Alias
    setLastTransaction,
    validateRecharge,
    processRecharge,
    loadTransactionHistory,
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    clearError,
    resetState,
  };

  return (
    <RechargeContext.Provider value={value}>
      {children}
    </RechargeContext.Provider>
  );
};

export const useRecharge = (): RechargeContextType => {
  const context = useContext(RechargeContext);
  if (!context) {
    throw new Error('useRecharge must be used within a RechargeProvider');
  }
  return context;
};
