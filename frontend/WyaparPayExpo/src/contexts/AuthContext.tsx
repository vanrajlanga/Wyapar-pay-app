/**
 * Authentication Context
 * Manages authentication state and operations across the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { showSuccessEvent, showErrorEvent } from '../utils/toast-events';
import {
  authService,
  AuthResponse,
  RegisterData,
  LoginCredentials,
  OtpCredentials,
} from '../services/auth.service';
import { logger } from '../services/logger.service';
import {
  SECURE_STORAGE_KEYS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  DEFAULT_TEST_CREDENTIALS,
} from '../constants';
import { ApiError, apiService } from '../services/api.service';
import { UserData, UserTokens } from '../types/user';

// Re-export types for convenience
export type { UserData, UserTokens };

interface AuthContextType {
  // State
  user: UserData | null;
  tokens: UserTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ userId: string; email: string }>;
  loginWithOtp: (credentials: OtpCredentials) => Promise<{ isNewUser?: boolean }>;
  requestOtp: (identifier: string) => Promise<void>;
  verifyEmail: (userId: string, code: string) => Promise<void>;
  resendVerification: (userId: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [tokens, setTokens] = useState<UserTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state
  const isAuthenticated = !!user && !!tokens;

  /**
   * Load persisted authentication on mount
   */
  useEffect(() => {
    loadPersistedAuth();
  }, []);

  /**
   * Load authentication from secure storage
   */
  const loadPersistedAuth = async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        setTokens({ accessToken, refreshToken });
        setUser(JSON.parse(userData));
        logger.info('Authentication restored from storage');
      }
    } catch (error) {
      logger.error('Failed to load persisted auth', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Persist authentication to secure storage
   */
  const persistAuth = async (authData: AuthResponse) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.ACCESS_TOKEN,
          authData.tokens.accessToken
        ),
        SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.REFRESH_TOKEN,
          authData.tokens.refreshToken
        ),
        SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.USER_DATA,
          JSON.stringify({
            id: authData.user.id,
            name: authData.user.name,
            phone: authData.user.phone,
            email: authData.user.email,
            isEmailVerified: authData.user.isEmailVerified,
          })
        ),
      ]);
      logger.info('Authentication persisted to storage');
    } catch (error) {
      logger.error('Failed to persist auth', error);
    }
  };

  /**
   * Clear authentication from secure storage
   */
  const clearAuth = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.USER_DATA),
      ]);
      logger.info('Authentication cleared from storage');
    } catch (error) {
      logger.error('Failed to clear auth', error);
    }
  };

  /**
   * Login with password
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);

      // Use real backend login to get valid JWT tokens
      const result = await authService.login(credentials);

      const userData: UserData = {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        isEmailVerified: result.user.isEmailVerified,
      };

      setUser(userData);
      setTokens(result.tokens);
      await persistAuth(result);

      // No alert, direct navigation handled by screen
    } catch (error) {
      logger.error('Login failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      const defaultCredsMessage = DEFAULT_TEST_CREDENTIALS
        ? ` For testing, use: ${DEFAULT_TEST_CREDENTIALS.PHONE} or ${DEFAULT_TEST_CREDENTIALS.EMAIL}`
        : '';
      showErrorEvent('Login Failed', errorMessage + defaultCredsMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (
    data: RegisterData
  ): Promise<{ userId: string; email: string }> => {
    try {
      setIsLoading(true);

      const result = await authService.register(data);

      // Don't auto-login after registration - user needs to verify email
      logger.info('Registration successful, email verification required');

      return {
        userId: result.userId,
        email: data.email, // Use the email from input since backend doesn't return it
      };
    } catch (error) {
      logger.error('Registration failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      showErrorEvent('Registration Failed', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with OTP
   */
  const loginWithOtp = async (credentials: OtpCredentials): Promise<{ isNewUser?: boolean }> => {
    try {
      setIsLoading(true);

      // Use real backend OTP login to get valid JWT tokens
      const result = await authService.loginWithOtp(credentials);

      const userData: UserData = {
        id: result.user.id,
        name: result.user.name,
        phone: result.user.phone,
        email: result.user.email,
        isEmailVerified: result.user.isEmailVerified,
      };

      setUser(userData);
      setTokens(result.tokens);
      await persistAuth(result);

      logger.info('OTP login successful', { isNewUser: result.isNewUser });

      // Return isNewUser flag for navigation logic
      return { isNewUser: result.isNewUser };
    } catch (error) {
      logger.error('OTP login failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      showErrorEvent('OTP Login Failed', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request OTP for login
   */
  const requestOtp = async (identifier: string): Promise<void> => {
    try {
      setIsLoading(true);

      // Call backend API to send OTP
      await authService.requestOtp(identifier);
      showSuccessEvent('OTP Sent', `OTP has been sent to ${identifier}`);
    } catch (error) {
      logger.error('OTP request failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      showErrorEvent('OTP Request Failed', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify email with code
   */
  const verifyEmail = async (userId: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);

      await authService.verifyEmail({ userId, code });

      // Update user verification status
      if (user) {
        const updatedUser = { ...user, isEmailVerified: true };
        setUser(updatedUser);
        await SecureStore.setItemAsync(
          SECURE_STORAGE_KEYS.USER_DATA,
          JSON.stringify(updatedUser)
        );
      }

      showSuccessEvent('Success', 'Email verified successfully!');
    } catch (error) {
      logger.error('Email verification failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      showErrorEvent('Verification Failed', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend email verification
   */
  const resendVerification = async (
    userId: string,
    email: string
  ): Promise<void> => {
    try {
      setIsLoading(true);

      await authService.resendVerification(userId, email);

      showSuccessEvent('Success', 'Verification email sent!');
    } catch (error) {
      logger.error('Resend verification failed', error);
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : ERROR_MESSAGES.NETWORK_ERROR;
      showErrorEvent('Failed to Resend', errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (tokens?.refreshToken) {
        await authService.logout(tokens.refreshToken);
      }

      setUser(null);
      setTokens(null);
      await clearAuth();

      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      // Clear local state anyway
      setUser(null);
      setTokens(null);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh authentication (e.g., after token refresh)
   */
  const refreshAuth = async (): Promise<void> => {
    try {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await authService.refreshToken(tokens.refreshToken);

      setTokens(newTokens);
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.ACCESS_TOKEN,
        newTokens.accessToken
      );
      await SecureStore.setItemAsync(
        SECURE_STORAGE_KEYS.REFRESH_TOKEN,
        newTokens.refreshToken
      );

      logger.info('Authentication refreshed');
    } catch (error) {
      logger.error('Auth refresh failed', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  /**
   * Restore session from secure storage (used by biometric login)
   */
  const restoreSession = async (): Promise<boolean> => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_STORAGE_KEYS.USER_DATA),
      ]);

      if (!accessToken || !refreshToken) return false;

      // If we have cached user data, use it
      if (userData) {
        setTokens({ accessToken, refreshToken });
        setUser(JSON.parse(userData));
        return true;
      }

      // Otherwise fetch profile from API using the token
      try {
        const profile = await apiService.get<any>('/user/profile', accessToken);
        const userObj: UserData = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          isEmailVerified: profile.isEmailVerified,
          isPhoneVerified: profile.isPhoneVerified,
          status: profile.status,
          kycStatus: profile.kycStatus,
        };
        setTokens({ accessToken, refreshToken });
        setUser(userObj);
        // Cache for next time
        await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.USER_DATA, JSON.stringify(userObj));
        return true;
      } catch (apiError) {
        logger.error('Failed to fetch profile during session restore', apiError);
        return false;
      }
    } catch (error) {
      logger.error('Failed to restore session', error);
      return false;
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    loginWithOtp,
    requestOtp,
    verifyEmail,
    resendVerification,
    logout,
    refreshAuth,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
