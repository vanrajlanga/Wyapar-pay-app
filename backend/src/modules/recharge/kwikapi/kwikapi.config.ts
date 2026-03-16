/**
 * KWIKAPI Configuration
 *
 * Configuration class for KWIKAPI service
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KwikApiConfig {
  constructor(private configService: ConfigService) {}

  /**
   * Check if KWIKAPI is enabled
   */
  get isEnabled(): boolean {
    return this.configService.get<boolean>('KWIKAPI_ENABLED', true);
  }

  /**
   * Get current environment (uat or production)
   */
  get environment(): 'uat' | 'production' {
    const env = this.configService.get<string>('KWIKAPI_ENVIRONMENT', 'uat');
    return env === 'production' ? 'production' : 'uat';
  }

  /**
   * Get base URL based on environment
   */
  get baseUrl(): string {
    if (this.environment === 'production') {
      return this.configService.get<string>(
        'KWIKAPI_PRODUCTION_URL',
        'https://www.kwikapi.com',
      );
    }
    return this.configService.get<string>(
      'KWIKAPI_UAT_URL',
      'https://uat.kwikapi.com',
    );
  }

  /**
   * Get API key
   */
  get apiKey(): string {
    const apiKey = this.configService.get<string>('KWIKAPI_API_KEY');
    if (!apiKey || apiKey === 'your_kwikapi_key_here') {
      throw new Error(
        'KWIKAPI_API_KEY is not configured. Please set it in .env file',
      );
    }
    return apiKey;
  }

  /**
   * Get request timeout in milliseconds
   */
  get timeout(): number {
    return this.configService.get<number>('KWIKAPI_TIMEOUT', 30000);
  }

  /**
   * Get retry attempts
   */
  get retryAttempts(): number {
    return this.configService.get<number>('KWIKAPI_RETRY_ATTEMPTS', 3);
  }

  /**
   * Get retry delay in milliseconds
   */
  get retryDelay(): number {
    return this.configService.get<number>('KWIKAPI_RETRY_DELAY', 1000);
  }

  /**
   * Validate configuration
   */
  validate(): void {
    if (!this.isEnabled) {
      console.warn('⚠️  KWIKAPI is disabled. Set KWIKAPI_ENABLED=true to enable.');
      return;
    }

    try {
      // This will throw if API key is not configured
      this.apiKey;

      console.log('✅ KWIKAPI Configuration:');
      console.log(`   - Environment: ${this.environment}`);
      console.log(`   - Base URL: ${this.baseUrl}`);
      console.log(`   - API Key: ${this.apiKey.substring(0, 10)}...`);
      console.log(`   - Timeout: ${this.timeout}ms`);
      console.log(`   - Retry Attempts: ${this.retryAttempts}`);
    } catch (error) {
      console.error('❌ KWIKAPI Configuration Error:', error.message);
      throw error;
    }
  }

  /**
   * Get full configuration object
   */
  getConfig() {
    return {
      enabled: this.isEnabled,
      environment: this.environment,
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
    };
  }
}
