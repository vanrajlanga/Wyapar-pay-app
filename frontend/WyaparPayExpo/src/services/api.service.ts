/**
 * API Service
 * Centralized HTTP client with error handling, timeout, and logging
 */

import { API_CONFIG, ERROR_MESSAGES } from '../constants';
import { logger } from './logger.service';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Service Class
 */
class ApiService {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryableErrors: number[];

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}`;
    // Use constant from timing.ts instead of API_CONFIG.TIMEOUT for consistency
    this.timeout = API_CONFIG.TIMEOUT;
    this.maxRetries = 3; // Maximum retry attempts
    this.retryableErrors = [408, 429, 500, 502, 503, 504]; // HTTP status codes that should be retried
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any, statusCode?: number): boolean {
    // Retry on timeout/abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return true;
    }

    // Retry on network errors
    if (error instanceof Error && (
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout')
    )) {
      return true;
    }

    // Retry on specific HTTP status codes
    if (statusCode && this.retryableErrors.includes(statusCode)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * Math.pow(2, attempt - 1), 4000);
  }

  /**
   * Internal request method with timeout, retry logic, and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt: number = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const url = `${this.baseUrl}${endpoint}`;

    // Log API call (only on first attempt to avoid spam)
    if (retryAttempt === 0) {
      logger.logApiCall(
        options.method || 'GET',
        endpoint,
        options.body ? JSON.parse(options.body as string) : undefined
      );
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Parse response
      const data = await response.json();

      // Log response (only on success or final failure)
      if (response.ok || retryAttempt >= this.maxRetries) {
        logger.logApiResponse(endpoint, response.status, data);
      }

      // Handle non-OK responses
      if (!response.ok) {
        const error = new ApiError(
          data.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG,
          response.status,
          data
        );

        // Retry if error is retryable and we haven't exceeded max retries
        if (
          this.isRetryableError(error, response.status) &&
          retryAttempt < this.maxRetries
        ) {
          const delay = this.getRetryDelay(retryAttempt + 1);
          logger.debug(`Retrying request (attempt ${retryAttempt + 1}/${this.maxRetries}) after ${delay}ms`, {
            endpoint,
            status: response.status,
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));

          // Retry the request
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }

        throw error;
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle specific error types
      if (error instanceof ApiError) {
        // If it's a retryable error and we haven't exceeded max retries, retry
        if (
          this.isRetryableError(error, error.statusCode) &&
          retryAttempt < this.maxRetries
        ) {
          const delay = this.getRetryDelay(retryAttempt + 1);
          logger.debug(`Retrying request after error (attempt ${retryAttempt + 1}/${this.maxRetries}) after ${delay}ms`, {
            endpoint,
            statusCode: error.statusCode,
            message: error.message,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }
        throw error;
      }

      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        // Retry timeout errors
        if (retryAttempt < this.maxRetries) {
          const delay = this.getRetryDelay(retryAttempt + 1);
          logger.debug(`Retrying after timeout (attempt ${retryAttempt + 1}/${this.maxRetries}) after ${delay}ms`, {
            endpoint,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }

        logger.error('API request timeout', error, { endpoint, attempt: retryAttempt + 1 });
        throw new ApiError('Request timeout. Please check your connection and try again.');
      }

      // Network errors - retry
      if (error instanceof Error && (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch')
      )) {
        if (retryAttempt < this.maxRetries) {
          const delay = this.getRetryDelay(retryAttempt + 1);
          logger.debug(`Retrying after network error (attempt ${retryAttempt + 1}/${this.maxRetries}) after ${delay}ms`, {
            endpoint,
            message: error.message,
          });

          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }
      }

      // Final error logging
      if (retryAttempt >= this.maxRetries) {
        logger.error('API request failed after all retries', error, {
          endpoint,
          attempts: retryAttempt + 1,
        });
      }

      // Network error
      logger.error('API network error', error, { endpoint });
      throw new ApiError(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
