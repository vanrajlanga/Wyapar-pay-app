/**
 * SMS Chain Handler (Chain of Responsibility Pattern)
 * 
 * Handles SMS sending with fallback providers.
 * If primary provider fails, tries next provider in chain.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles provider chain execution
 * - Open/Closed: Can add new providers without modifying this handler
 */

import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, SmsSendResult } from '../interfaces/sms-provider.interface';

@Injectable()
export class SmsChainHandler {
  private readonly logger = new Logger(SmsChainHandler.name);

  /**
   * Send SMS using provider chain (Chain of Responsibility Pattern)
   * Tries each provider in sequence until one succeeds
   */
  async sendWithChain(
    providers: ISmsProvider[],
    phoneNumber: string,
    message: string,
  ): Promise<SmsSendResult> {
    if (providers.length === 0) {
      return {
        success: false,
        errorMessage: 'No SMS providers available',
      };
    }

    let lastError: SmsSendResult | null = null;

    for (const provider of providers) {
      try {
        this.logger.debug(`Trying SMS provider: ${provider.getProviderName()}`);

        if (!provider.isConfigured()) {
          this.logger.warn(`Provider ${provider.getProviderName()} not configured, skipping`);
          continue;
        }

        const formattedPhone = provider.formatPhoneNumber(phoneNumber);
        
        if (!provider.isValidPhoneNumber(formattedPhone)) {
          this.logger.warn(`Invalid phone number for provider ${provider.getProviderName()}`);
          continue;
        }

        const result = await provider.sendSms(formattedPhone, message);

        if (result.success) {
          this.logger.log(`✅ SMS sent successfully via ${provider.getProviderName()}`);
          return result;
        }

        // Store error for logging
        lastError = result;
        this.logger.warn(
          `Provider ${provider.getProviderName()} failed: ${result.errorMessage}`,
        );

        // Continue to next provider in chain
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Provider ${provider.getProviderName()} threw error: ${errorMessage}`);
        lastError = {
          success: false,
          errorMessage,
        };
        // Continue to next provider
      }
    }

    // All providers failed
    this.logger.error(`❌ All SMS providers failed. Last error: ${lastError?.errorMessage}`);
    return lastError || {
      success: false,
      errorMessage: 'All SMS providers failed',
    };
  }
}

