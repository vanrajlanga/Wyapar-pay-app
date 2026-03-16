/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiService, ApiError } from './api.service';
import { logger } from './logger.service';
import { API_ENDPOINTS, DEFAULT_TEST_CREDENTIALS } from '../constants';

// Types
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string;
    isEmailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  isNewUser?: boolean; // True if user was auto-registered via OTP login
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  identifier: string; // phone or email
  password: string;
}

export interface OtpCredentials {
  identifier: string; // phone or email
  otp: string;
}

export interface EmailVerificationData {
  userId: string;
  code: string;
}

/**
 * Authentication Service Class
 */
class AuthenticationService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      logger.logUserAction('register_attempt', {
        email: data.email,
        phone: data.phone,
      });

      const result = await apiService.post<RegisterResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      logger.logUserAction('register_success', { userId: result.userId });
      return result;
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Login with password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      logger.logUserAction('login_attempt', {
        identifier: credentials.identifier,
      });

      const result = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      logger.logUserAction('login_success', { userId: result.user.id });
      return result;
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Login with OTP
   */
  async loginWithOtp(credentials: OtpCredentials): Promise<AuthResponse> {
    try {
      logger.logUserAction('otp_login_attempt', {
        identifier: credentials.identifier,
      });

      const result = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.OTP_LOGIN,
        credentials
      );

      logger.logUserAction('otp_login_success', { userId: result.user.id });
      return result;
    } catch (error) {
      logger.error('OTP login failed', error);
      throw error;
    }
  }

  /**
   * Request OTP for login/verification
   */
  async requestOtp(identifier: string): Promise<{ message: string }> {
    try {
      logger.logUserAction('otp_request', { identifier });

      const result = await apiService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.REQUEST_OTP,
        { identifier }
      );

      logger.info('OTP requested successfully', { identifier });
      return result;
    } catch (error) {
      logger.error('OTP request failed', error);
      throw error;
    }
  }

  /**
   * Verify email with code
   */
  async verifyEmail(data: EmailVerificationData): Promise<{ message: string }> {
    try {
      logger.logUserAction('email_verification_attempt', {
        userId: data.userId,
      });

      const result = await apiService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.VERIFY_EMAIL,
        data
      );

      logger.logUserAction('email_verification_success', {
        userId: data.userId,
      });
      return result;
    } catch (error) {
      logger.error('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Resend email verification code
   */
  async resendVerification(
    userId: string,
    email: string
  ): Promise<{ message: string }> {
    try {
      logger.logUserAction('resend_verification_attempt', { userId, email });

      const result = await apiService.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
        { userId, email }
      );

      logger.info('Verification email resent', { userId, email });
      return result;
    } catch (error) {
      logger.error('Resend verification failed', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      logger.logUserAction('logout_attempt');

      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });

      logger.logUserAction('logout_success');
    } catch (error) {
      logger.error('Logout failed', error);
      // Don't throw - logout should always succeed locally
    }
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await apiService.get('/user/profile', accessToken);
      return true;
    } catch (error) {
      logger.warn('Token validation failed', error);
      throw error; // Re-throw to trigger refresh in AuthContext
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      logger.info('Refreshing access token');

      const result = await apiService.post<{
        accessToken: string;
        refreshToken: string;
      }>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });

      logger.info('Token refreshed successfully');
      return result;
    } catch (error) {
      logger.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Validate default test credentials (for development only)
   */
  isDefaultCredentials(identifier: string, password: string): boolean {
    if (!DEFAULT_TEST_CREDENTIALS) {
      return false; // No test credentials in production
    }
    const isPhoneMatch =
      identifier === DEFAULT_TEST_CREDENTIALS.PHONE &&
      password === DEFAULT_TEST_CREDENTIALS.PASSWORD;
    const isEmailMatch =
      identifier === DEFAULT_TEST_CREDENTIALS.EMAIL &&
      password === DEFAULT_TEST_CREDENTIALS.PASSWORD;

    return isPhoneMatch || isEmailMatch;
  }

  /**
   * Get mock auth response for testing (development only)
   */
  getMockAuthResponse(identifier: string): AuthResponse {
    if (!DEFAULT_TEST_CREDENTIALS) {
      throw new Error('Test credentials not available in production');
    }
    return {
      user: {
        id: 'default-admin-id',
        name: 'Admin User',
        phone: DEFAULT_TEST_CREDENTIALS.PHONE,
        email: DEFAULT_TEST_CREDENTIALS.EMAIL,
        isEmailVerified: true,
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
