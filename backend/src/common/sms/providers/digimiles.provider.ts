/**
 * Digimiles SMS Provider (Strategy Pattern Implementation)
 * 
 * Implements ISmsProvider for Digimiles AOC Portal API.
 * Uses Adapter Pattern to adapt Digimiles API to our interface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ISmsProvider, SmsSendResult, SmsProviderConfig } from '../interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';

@Injectable()
export class DigimilesProvider implements ISmsProvider {
  private readonly logger = new Logger(DigimilesProvider.name);
  private readonly config: SmsProviderConfig;
  private readonly formatter: PhoneNumberFormatter;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    formatter: PhoneNumberFormatter,
  ) {
    this.formatter = formatter;
    this.config = {
      apiKey: this.configService.get('SMS_API_KEY'),
      apiUrl: this.configService.get('SMS_API_URL', 'https://api.aoc-portal.com/v1/sms'),
      senderId: this.configService.get('SMS_SENDER_ID', 'WYAPAY'),
    };
  }

  getProviderName(): string {
    return 'digimiles';
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.apiUrl && this.config.senderId);
  }

  formatPhoneNumber(phone: string): string {
    // Digimiles requires: 91XXXXXXXXXX (no +)
    return this.formatter.toNumericFormat(phone);
  }

  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length >= 12 && formatted.length <= 13; // 91 + 10-11 digits
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          errorMessage: 'Digimiles provider not configured',
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);

      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          errorMessage: `Invalid phone number format: ${to}`,
        };
      }

      // Digimiles uses query parameters, not JSON body
      // Build URL with query parameters
      const url = new URL(this.config.apiUrl as string);
      url.searchParams.append('apikey', this.config.apiKey as string);
      url.searchParams.append('type', 'TRANS');
      url.searchParams.append('text', message);
      url.searchParams.append('to', phoneNumber);
      url.searchParams.append('sender', this.config.senderId as string);

      const response = await firstValueFrom(
        this.httpService.get(url.toString()),
      );

      // Adapter: Transform Digimiles response to our standard format
      if (response.data && 
          (response.data.status === 'OK' || response.data.message === 'Message Sent Successfully!') && 
          !response.data.error) {
        this.logger.log(`✅ SMS sent via Digimiles. Message ID: ${response.data.id || 'N/A'}`);
        return {
          success: true,
          messageId: response.data.id,
          providerData: {
            recipient: response.data.data?.[0]?.recipient,
            messageId: response.data.data?.[0]?.messageId,
            totalCount: response.data.totalCount,
          },
        };
      }

      if (response.data && response.data.error) {
        return {
          success: false,
          errorMessage: response.data.message || 'Unknown error',
          providerData: response.data,
        };
      }

      return {
        success: false,
        errorMessage: 'Unexpected response format',
        providerData: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Digimiles SMS error: ${errorMessage}`);
      
      const providerData: Record<string, unknown> = {};
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        providerData.response = axiosError.response?.data;
      }

      return {
        success: false,
        errorMessage,
        providerData,
      };
    }
  }
}

