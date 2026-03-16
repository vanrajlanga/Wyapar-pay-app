/**
 * SMS Provider Factory (Factory Pattern)
 * 
 * Creates appropriate SMS provider based on configuration.
 * Follows Open/Closed Principle - open for extension, closed for modification.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only responsible for creating providers
 * - Open/Closed: Can add new providers without modifying this factory
 * - Dependency Inversion: Depends on ISmsProvider abstraction
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from '../interfaces/sms-provider.interface';
import { DigimilesProvider } from '../providers/digimiles.provider';
import { TwilioProvider } from '../providers/twilio.provider';
import { Msg91Provider } from '../providers/msg91.provider';
import { TextLocalProvider } from '../providers/textlocal.provider';
import { MockSmsProvider } from '../providers/mock.provider';
import { PhoneNumberFormatter } from '../services/phone-number-formatter.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SmsProviderFactory {
  private readonly logger = new Logger(SmsProviderFactory.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private formatter: PhoneNumberFormatter,
  ) {}

  /**
   * Create SMS provider based on configuration
   * Factory Pattern: Centralized creation logic
   */
  createProvider(): ISmsProvider {
    const providerName = this.configService.get('SMS_PROVIDER', 'generic').toLowerCase();
    const enabled = this.configService.get('SMS_ENABLED', 'true') === 'true';

    // If disabled, return mock provider
    if (!enabled) {
      this.logger.log('SMS disabled, using mock provider');
      return new MockSmsProvider(this.formatter);
    }

    // Factory: Create provider based on name
    switch (providerName) {
      case 'digimiles':
      case 'generic':
        return new DigimilesProvider(this.configService, this.httpService, this.formatter);
      
      case 'twilio':
        return new TwilioProvider(this.configService, this.httpService, this.formatter);
      
      case 'msg91':
        return new Msg91Provider(this.configService, this.httpService, this.formatter);
      
      case 'textlocal':
        return new TextLocalProvider(this.configService, this.httpService, this.formatter);
      
      case 'mock':
        return new MockSmsProvider(this.formatter);
      
      default:
        this.logger.warn(`Unknown provider: ${providerName}, using mock provider`);
        return new MockSmsProvider(this.formatter);
    }
  }

  /**
   * Create fallback chain of providers (Chain of Responsibility Pattern)
   * Tries primary provider first, then falls back to others if it fails
   */
  createProviderChain(): ISmsProvider[] {
    const primary = this.createProvider();
    const providers: ISmsProvider[] = [primary];

    // Add fallback providers if primary is not mock
    if (primary.getProviderName() !== 'mock') {
      // Add other configured providers as fallbacks
      const fallbackProviders = ['twilio', 'msg91', 'textlocal', 'digimiles'];
      
      for (const providerName of fallbackProviders) {
        if (providerName !== primary.getProviderName()) {
          try {
            const provider = this.createProviderByName(providerName);
            if (provider && provider.isConfigured()) {
              providers.push(provider);
            }
          } catch {
            // Skip if provider can't be created
          }
        }
      }
    }

    return providers;
  }

  /**
   * Create specific provider by name
   */
  private createProviderByName(name: string): ISmsProvider | null {
    switch (name) {
      case 'digimiles':
      case 'generic':
        return new DigimilesProvider(this.configService, this.httpService, this.formatter);
      case 'twilio':
        return new TwilioProvider(this.configService, this.httpService, this.formatter);
      case 'msg91':
        return new Msg91Provider(this.configService, this.httpService, this.formatter);
      case 'textlocal':
        return new TextLocalProvider(this.configService, this.httpService, this.formatter);
      default:
        return null;
    }
  }
}

