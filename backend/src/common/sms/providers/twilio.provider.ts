/**
 * Twilio SMS Provider (Strategy Pattern Implementation)
 * 
 * Implements ISmsProvider for Twilio API.
 * Uses Adapter Pattern to adapt Twilio API to our interface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ISmsProvider, SmsSendResult, SmsProviderConfig } from '../interfaces/sms-provider.interface';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';

@Injectable()
export class TwilioProvider implements ISmsProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly config: SmsProviderConfig;
  private readonly formatter: PhoneNumberFormatter;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    formatter: PhoneNumberFormatter,
  ) {
    this.formatter = formatter;
    this.config = {
      accountSid: this.configService.get('TWILIO_ACCOUNT_SID'),
      authToken: this.configService.get('TWILIO_AUTH_TOKEN'),
      phoneNumber: this.configService.get('TWILIO_PHONE_NUMBER'),
    };
  }

  getProviderName(): string {
    return 'twilio';
  }

  isConfigured(): boolean {
    return !!(this.config.accountSid && this.config.authToken && this.config.phoneNumber);
  }

  formatPhoneNumber(phone: string): string {
    // Twilio accepts: +91XXXXXXXXXX (with +)
    const international = this.formatter.toInternationalFormat(phone);
    return international || phone;
  }

  isValidPhoneNumber(phone: string): boolean {
    return this.formatter.isValid(phone);
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          errorMessage: 'Twilio provider not configured',
        };
      }

      const phoneNumber = this.formatPhoneNumber(to);
      
      if (!this.isValidPhoneNumber(phoneNumber)) {
        return {
          success: false,
          errorMessage: `Invalid phone number format: ${to}`,
        };
      }

      const accountSid = this.config.accountSid as string;
      const authToken = this.config.authToken as string;
      const fromNumber = this.config.phoneNumber as string;

      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          new URLSearchParams({
            From: fromNumber,
            To: phoneNumber,
            Body: message,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            },
          },
        ),
      );

      // Adapter: Transform Twilio response to our standard format
      if (response.data && response.data.sid) {
        return {
          success: true,
          messageId: response.data.sid,
          providerData: {
            status: response.data.status,
            dateCreated: response.data.date_created,
            dateSent: response.data.date_sent,
          },
        };
      }

      return {
        success: false,
        errorMessage: 'Twilio API returned unexpected response',
        providerData: response.data,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Twilio SMS error: ${errorMessage}`);
      
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

