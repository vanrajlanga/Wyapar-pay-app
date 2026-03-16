/**
 * SMS Service (Refactored with SOLID Principles)
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only orchestrates SMS sending, delegates to providers
 * - Open/Closed: Open for extension (new providers), closed for modification
 * - Liskov Substitution: All providers implement ISmsProvider interface
 * - Interface Segregation: Uses focused ISmsProvider interface
 * - Dependency Inversion: Depends on ISmsProvider abstraction, not concrete implementations
 * 
 * Design Patterns:
 * - Strategy Pattern: Uses ISmsProvider for different provider strategies
 * - Factory Pattern: Uses SmsProviderFactory to create providers
 * - Chain of Responsibility: Uses SmsChainHandler for fallback providers
 * - Adapter Pattern: Each provider adapts its API to ISmsProvider interface
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider, SmsSendResult } from './interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from './services/phone-number-formatter.service';
import { SmsProviderFactory } from './factories/sms-provider.factory';
import { SmsChainHandler } from './services/sms-chain-handler.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly enabled: boolean;
  private readonly useFallback: boolean;
  private provider: ISmsProvider;
  private providerChain: ISmsProvider[];

  constructor(
    private configService: ConfigService,
    private formatter: PhoneNumberFormatter,
    private providerFactory: SmsProviderFactory,
    @Optional() private chainHandler?: SmsChainHandler,
    @Optional() @Inject('SMS_PROVIDER') injectedProvider?: ISmsProvider,
  ) {
    this.enabled = this.configService.get('SMS_ENABLED', 'true') === 'true';
    this.useFallback = this.configService.get('SMS_USE_FALLBACK', 'false') === 'true';

    // Use injected provider if available (for testing), otherwise create from factory
    if (injectedProvider) {
      this.provider = injectedProvider;
      this.logger.log(`📱 SMS service using injected provider: ${this.provider.getProviderName()}`);
    } else {
      this.provider = this.providerFactory.createProvider();
      this.logger.log(`📱 SMS service initialized with provider: ${this.provider.getProviderName()}`);
    }

    // Initialize provider chain if fallback is enabled
    if (this.useFallback) {
      this.providerChain = this.providerFactory.createProviderChain();
      this.logger.log(`📱 SMS fallback enabled with ${this.providerChain.length} providers`);
    }

    // Log configuration status
    if (!this.enabled) {
      this.logger.warn('⚠️  SMS service disabled. SMS will be logged only.');
    } else if (!this.provider.isConfigured()) {
      this.logger.warn('⚠️  SMS provider not configured. SMS will be logged only.');
    }
  }

  /**
   * Send SMS to a phone number
   * 
   * Uses Strategy Pattern: Delegates to appropriate provider
   * Uses Chain of Responsibility: Falls back to other providers if enabled
   * 
   * @param to - Phone number (with country code, e.g., +919876543210)
   * @param message - SMS message content
   * @returns Promise<boolean> - true if sent successfully, false otherwise
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      // Validate phone number format
      if (!this.formatter.isValid(to)) {
        this.logger.error(`Invalid phone number format: ${to}`);
        return false;
      }

      // If SMS is disabled, just log
      if (!this.enabled) {
        this.logger.log(`[SMS LOG] Would send SMS to ${to}: ${message.substring(0, 50)}...`);
        return false;
      }

      // Use chain of responsibility if fallback is enabled
      if (this.useFallback && this.chainHandler && this.providerChain) {
        const result = await this.chainHandler.sendWithChain(
          this.providerChain,
          to,
          message,
        );
        return result.success;
      }

      // Use single provider (Strategy Pattern)
      if (!this.provider.isConfigured()) {
        this.logger.warn('SMS provider not configured, logging only');
        this.logger.log(`[SMS LOG] Would send SMS to ${to}: ${message.substring(0, 50)}...`);
        return false;
      }

      const formattedPhone = this.provider.formatPhoneNumber(to);
      
      if (!this.provider.isValidPhoneNumber(formattedPhone)) {
        this.logger.error(`Invalid phone number for provider ${this.provider.getProviderName()}: ${to}`);
        return false;
      }

      const result = await this.provider.sendSms(formattedPhone, message);

      if (result.success) {
        this.logger.log(
          `✅ SMS sent successfully via ${this.provider.getProviderName()} to ${to}`,
        );
        if (result.messageId) {
          this.logger.debug(`Message ID: ${result.messageId}`);
        }
      } else {
        this.logger.error(
          `❌ Failed to send SMS via ${this.provider.getProviderName()}: ${result.errorMessage}`,
        );
      }

      return result.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error sending SMS to ${to}: ${errorMessage}`, error.stack);
      return false;
    }
  }

  /**
   * Send SMS and get detailed result
   * 
   * @param to - Phone number
   * @param message - SMS message content
   * @returns Promise with detailed send result
   */
  async sendSmsWithResult(to: string, message: string): Promise<SmsSendResult> {
    try {
      // Validate phone number format
      if (!this.formatter.isValid(to)) {
        return {
          success: false,
          errorMessage: `Invalid phone number format: ${to}`,
        };
      }

      // If SMS is disabled, return mock result
      if (!this.enabled) {
        return {
          success: false,
          errorMessage: 'SMS service disabled',
          providerData: {
            phone: to,
            message: message.substring(0, 100),
            logged: true,
          },
        };
      }

      // Use chain of responsibility if fallback is enabled
      if (this.useFallback && this.chainHandler && this.providerChain) {
        return await this.chainHandler.sendWithChain(this.providerChain, to, message);
      }

      // Use single provider
      if (!this.provider.isConfigured()) {
        return {
          success: false,
          errorMessage: 'SMS provider not configured',
        };
      }

      const formattedPhone = this.provider.formatPhoneNumber(to);
      
      if (!this.provider.isValidPhoneNumber(formattedPhone)) {
        return {
          success: false,
          errorMessage: `Invalid phone number for provider: ${to}`,
        };
      }

      return await this.provider.sendSms(formattedPhone, message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending SMS: ${errorMessage}`);
      return {
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * Check if SMS service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled && this.provider.isConfigured();
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    enabled: boolean;
    provider: string;
    configured: boolean;
    fallbackEnabled: boolean;
  } {
    return {
      enabled: this.enabled,
      provider: this.provider.getProviderName(),
      configured: this.provider.isConfigured(),
      fallbackEnabled: this.useFallback,
    };
  }
}
