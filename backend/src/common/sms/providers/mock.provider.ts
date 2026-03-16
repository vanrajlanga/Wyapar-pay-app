/**
 * Mock SMS Provider (Strategy Pattern Implementation)
 * 
 * Used for testing and development when SMS is disabled.
 * Implements ISmsProvider interface for consistency.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider, SmsSendResult } from '../interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(MockSmsProvider.name);
  private readonly formatter: PhoneNumberFormatter;

  constructor(formatter: PhoneNumberFormatter) {
    this.formatter = formatter;
  }

  getProviderName(): string {
    return 'mock';
  }

  isConfigured(): boolean {
    return true; // Mock is always configured
  }

  formatPhoneNumber(phone: string): string {
    return this.formatter.toInternationalFormat(phone) || phone;
  }

  isValidPhoneNumber(phone: string): boolean {
    return this.formatter.isValid(phone);
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const phoneNumber = this.formatPhoneNumber(to);
    this.logger.log(`[MOCK SMS] Would send SMS to ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    return {
      success: false, // Returns false to indicate it's just logged
      errorMessage: 'SMS service disabled or not configured',
      providerData: {
        phone: phoneNumber,
        message: message.substring(0, 100),
        mock: true,
      },
    };
  }
}

