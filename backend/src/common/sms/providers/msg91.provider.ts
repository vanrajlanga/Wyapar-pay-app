/**
 * MSG91 SMS Provider (Strategy Pattern Implementation)
 * 
 * Implements ISmsProvider for MSG91 API.
 * Uses Adapter Pattern to adapt MSG91 API to our interface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ISmsProvider, SmsSendResult, SmsProviderConfig } from '../interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';

@Injectable()
export class Msg91Provider implements ISmsProvider {
  private readonly logger = new Logger(Msg91Provider.name);
  private readonly config: SmsProviderConfig;
  private readonly formatter: PhoneNumberFormatter;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    formatter: PhoneNumberFormatter,
  ) {
    this.formatter = formatter;
    this.config = {
      authKey: this.configService.get('MSG91_AUTH_KEY') || this.configService.get('SMS_API_KEY'),
      senderId: this.configService.get('MSG91_SENDER_ID') || this.configService.get('SMS_SENDER_ID', 'WYAPAR'),
      route: this.configService.get('MSG91_ROUTE', '4'),
    };
  }

  getProviderName(): string {
    return 'msg91';
  }

  isConfigured(): boolean {
    return !!(this.config.authKey && this.config.senderId);
  }

  formatPhoneNumber(phone: string): string {
    // MSG91 requires: XXXXXXXXXX (no country code, no +)
    const numeric = this.formatter.toNumericFormat(phone);
    // Remove 91 prefix for MSG91
    return numeric.startsWith('91') ? numeric.substring(2) : numeric;
  }

  isValidPhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone);
    return formatted.length === 10; // Indian mobile numbers are 10 digits
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          errorMessage: 'MSG91 provider not configured',
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          errorMessage: `Invalid phone number format: ${to}`,
        };
      }

      const authKey = this.config.authKey as string;
      const senderId = this.config.senderId as string;
      const route = this.config.route as string;

      const payload = {
        sender: senderId,
        route: route,
        country: '91', // India country code
        sms: [
          {
            message: message,
            to: [phoneNumber],
          },
        ],
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `https://control.msg91.com/api/v2/sendsms?authkey=${authKey}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Adapter: Transform MSG91 response to our standard format
      if (response.data && response.data.type === 'success') {
        return {
          success: true,
          messageId: response.data.message_id || response.data.request_id,
          providerData: response.data,
        };
      }

      return {
        success: false,
        errorMessage: response.data.message || 'MSG91 API error',
        providerData: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MSG91 SMS error: ${errorMessage}`);
      
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

