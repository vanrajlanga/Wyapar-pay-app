import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentModule } from './modules/payment/payment.module';
import { RechargeModule } from './modules/recharge/recharge.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

// Common
import { CommonModule } from './common/common.module';
import { S3Module } from './common/s3/s3.module';
import { PushNotificationModule } from './common/push-notification/push-notification.module';
import { NotificationModule } from './common/templates/notification.module';
import { NotificationEventsModule } from './common/notifications/notification-events.module';

// Health
import { HealthModule } from './health/health.module';

// Middleware
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Event Emitter for notification events
    EventEmitterModule.forRoot(),

    // Database
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Redis & Bull Queue (Conditional)
    ...(process.env.REDIS_ENABLED === 'true'
      ? [
          BullModule.forRootAsync({
            useClass: RedisConfig,
          }),
        ]
      : []),

    // Rate Limiting (In-memory when Redis is disabled)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isRedisEnabled =
          configService.get('REDIS_ENABLED', 'false') === 'true';

        if (isRedisEnabled) {
          // Use Redis for rate limiting
          return [
            {
              ttl: parseInt(process.env.THROTTLE_TTL) || 60,
              limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
            },
          ];
        } else {
          // Use in-memory rate limiting
          return [
            {
              ttl: parseInt(process.env.THROTTLE_TTL) || 60,
              limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
              storage: undefined, // Use in-memory storage
            },
          ];
        }
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    AuthModule,
    UserModule,
    WalletModule,
    PaymentModule,
    RechargeModule,
    TransactionModule,
    NotificationsModule,
    AdminModule,
    CommonModule,
    S3Module,
    PushNotificationModule,
    NotificationModule,
    NotificationEventsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply RequestIdMiddleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
