import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SmsService } from './sms.service';
import { PhoneNumberFormatter } from './services/phone-number-formatter.service';
import { SmsProviderFactory } from './factories/sms-provider.factory';
import { SmsChainHandler } from './services/sms-chain-handler.service';

// Providers
import { DigimilesProvider } from './providers/digimiles.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { Msg91Provider } from './providers/msg91.provider';
import { TextLocalProvider } from './providers/textlocal.provider';
import { MockSmsProvider } from './providers/mock.provider';

/**
 * SMS Module (Refactored with SOLID Principles)
 * 
 * Design Patterns:
 * - Strategy Pattern: Multiple provider implementations via ISmsProvider
 * - Factory Pattern: SmsProviderFactory creates appropriate provider
 * - Dependency Injection: Providers injected via NestJS DI
 * 
 * SOLID Principles:
 * - Single Responsibility: Each provider handles one SMS service
 * - Open/Closed: Easy to add new providers without modifying existing code
 * - Liskov Substitution: All providers implement ISmsProvider interface
 * - Interface Segregation: Clean ISmsProvider interface
 * - Dependency Inversion: Depends on ISmsProvider abstraction
 */
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [
    // Core services
    SmsService,
    PhoneNumberFormatter,
    SmsProviderFactory,
    SmsChainHandler,

    // Provider implementations (can be injected for testing)
    DigimilesProvider,
    TwilioProvider,
    Msg91Provider,
    TextLocalProvider,
    MockSmsProvider,

    // Provider registration (Strategy Pattern)
    // Primary provider is selected by factory based on config
    {
      provide: 'SMS_PROVIDER',
      useFactory: (factory: SmsProviderFactory) => factory.createProvider(),
      inject: [SmsProviderFactory],
    },
  ],
  exports: [
    SmsService,
    PhoneNumberFormatter,
    SmsProviderFactory,
    // Export providers for testing
    DigimilesProvider,
    TwilioProvider,
    Msg91Provider,
    TextLocalProvider,
    MockSmsProvider,
  ],
})
export class SmsModule {}

