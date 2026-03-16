/**
 * Logger Service
 * Centralized logging with support for different log levels
 * In production, logs can be sent to analytics/monitoring services
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class LoggerService {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${level}] ${timestamp} - ${message}`;
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message);

    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '');
          break;
      }
    } else {
      // In production, send to monitoring service
      // TODO: Integrate with Sentry, Firebase Analytics, or Datadog
      // Example: Sentry.captureMessage(formattedMessage, level);
    }
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  /**
   * Log general information
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error messages
   */
  error(message: string, error: any, additionalData?: any): void {
    const errorData = {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
      ...additionalData,
    };

    this.log(LogLevel.ERROR, message, errorData);

    // In production, send to error tracking service
    // TODO: Integrate with Sentry or Bugsnag
    // Example: Sentry.captureException(error, { extra: additionalData });
  }

  /**
   * Log user action for analytics
   */
  logUserAction(action: string, data?: any): void {
    this.info(`User Action: ${action}`, data);
    // TODO: Send to analytics service (Firebase Analytics, Mixpanel)
  }

  /**
   * Log API call for debugging
   */
  logApiCall(method: string, endpoint: string, data?: any): void {
    this.debug(`API ${method}: ${endpoint}`, data);
  }

  /**
   * Log API response
   */
  logApiResponse(endpoint: string, statusCode: number, data?: any): void {
    if (statusCode >= 400) {
      this.warn(`API Error: ${endpoint} - Status ${statusCode}`, data);
    } else {
      this.debug(`API Success: ${endpoint} - Status ${statusCode}`, data);
    }
  }
}

// Export singleton instance
export const logger = new LoggerService();
