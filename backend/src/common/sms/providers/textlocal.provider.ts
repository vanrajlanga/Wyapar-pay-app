/**
 * TextLocal SMS Provider (Strategy Pattern Implementation)
 * 
 * Implements ISmsProvider for TextLocal API.
 * Uses Adapter Pattern to adapt TextLocal API to our interface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ISmsProvider, SmsSendResult, SmsProviderConfig } from '../interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';

@Injectable()
export class TextLocalProvider implements ISmsProvider {
  private readonly logger = new Logger(TextLocalProvider.name);
  private readonly config: SmsProviderConfig;
  private readonly formatter: PhoneNumberFormatter;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    formatter: PhoneNumberFormatter,
  ) {
    this.formatter = formatter;
    this.config = {
      apiKey: this.configService.get('TEXTLOCAL_API_KEY') || this.configService.get('SMS_API_KEY'),
      senderId: this.configService.get('TEXTLOCAL_SENDER_ID') || this.configService.get('SMS_SENDER_ID', 'WYAPAR'),
    };
  }

  getProviderName(): string {
    return 'textlocal';
  }

  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.senderId);
  }

  formatPhoneNumber(phone: string): string {
    // TextLocal requires: 91XXXXXXXXXX (no +)
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
          errorMessage: 'TextLocal provider not configured',
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          errorMessage: `Invalid phone number format: ${to}`,
        };
      }

      const apiKey = this.config.apiKey as string;
      const senderId = this.config.senderId as string;

      const payload = {
        apikey: apiKey,
        sender: senderId,
        numbers: phoneNumber,
        message: message,
      };

      const response = await firstValueFrom(
        this.httpService.post('https://api.textlocal.in/send/', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // Adapter: Transform TextLocal response to our standard format
      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          messageId: response.data.batch_id || response.data.messages?.[0]?.id,
          providerData: {
            balance: response.data.balance,
            cost: response.data.cost,
            num_messages: response.data.num_messages,
          },
        };
      }

      return {
        success: false,
        errorMessage: response.data.errors?.[0]?.message || 'TextLocal API error',
        providerData: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`TextLocal SMS error: ${errorMessage}`);
      
      return {
        success: false,
        errorMessage,
        providerData: error instanceof Error && 'response' in error 
          ? { response: (error as { response?: { data?: unknown } }).response?.data }
          : {},
      };
    }
  }
}

