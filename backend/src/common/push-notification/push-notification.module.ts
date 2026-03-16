import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { User } from '../../entities/user.entity';
import { NotificationLog } from '../../entities/notification-log.entity';
import { NotificationQueue } from '../../entities/notification-queue.entity';

// Services and Providers
import { PushNotificationService } from './push-notification.service';
import { PushNotificationProcessor } from './push-notification.processor';
import { ExpoPushProvider } from './providers/expo-push.provider';

// Interfaces
import { IPushNotificationProvider } from './interfaces/push-provider.interface';

/**
 * Push Notification Module - Provider Agnostic Design
 *
 * This module implements the Strategy pattern to support multiple push providers.
 * Currently configured for Expo, but easily extensible to FCM, OneSignal, etc.
 *
 * Features:
 * - Provider abstraction via interfaces
 * - Dependency injection for provider switching
 * - Queue-based processing for reliability
 * - Comprehensive error handling and logging
 * - Memory leak prevention in queue processing
 */
@Module({
  imports: [
    // Database entities
    TypeOrmModule.forFeature([User, NotificationLog, NotificationQueue]),

    // Bull queue for background processing
    BullModule.registerQueueAsync({
      name: 'push-notifications',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: configService.get('REDIS_ENABLED') === 'true' ? {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        } : undefined, // Use in-memory if Redis disabled
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50, // Keep last 50 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
        settings: {
          lockDuration: 30000, // 30 seconds lock duration
          lockRenewTime: 15000, // Renew lock every 15 seconds
          stalledInterval: 30000, // Check for stalled jobs every 30 seconds
          maxStalledCount: 3, // Max stalled count before marking as failed
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Push notification service
    PushNotificationService,

    // Queue processor
    PushNotificationProcessor,

    // Provider implementations (Strategy Pattern)
    {
      provide: 'PUSH_PROVIDER',
      useClass: ExpoPushProvider, // Real Expo provider
    },
  ],
  exports: [
    PushNotificationService,
  ],
})
export class PushNotificationModule {}

