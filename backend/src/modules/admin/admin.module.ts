/**
 * Admin Module
 * Module for admin analytics, customer management, and settings features
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// Entities
import { Transaction } from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import { CommissionSetting } from '../../entities/commission-setting.entity';

// Analytics
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';

// Customers
import { AdminCustomersController } from './admin-customers.controller';
import { AdminCustomersService } from './admin-customers.service';

// Settings
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

// Auth
import { AdminAuthController } from './admin-auth.controller';

// Common services
import { S3Module } from '../../common/s3/s3.module';
import { CommonModule } from '../../common/common.module';
import { RechargeModule } from '../recharge/recharge.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, UserSession, CommissionSetting]),
    ConfigModule,
    S3Module,
    CommonModule,
    RechargeModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminAnalyticsController,
    AdminCustomersController,
    AdminSettingsController,
  ],
  providers: [
    AdminAnalyticsService,
    AdminCustomersService,
    AdminSettingsService,
  ],
  exports: [
    AdminAnalyticsService,
    AdminCustomersService,
    AdminSettingsService,
  ],
})
export class AdminModule {}
