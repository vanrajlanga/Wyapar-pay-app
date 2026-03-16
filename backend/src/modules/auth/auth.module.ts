import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OtpService } from './otp.service';
import { SessionService } from './session.service';

import { User } from '../../entities/user.entity';
import { UserSession } from '../../entities/user-session.entity';
import { CommonModule } from '../../common/common.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';
import { SmsModule } from '../../common/sms/sms.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession]),
    CommonModule,
    WalletModule,
    NotificationEventsModule,
    SmsModule,
    PassportModule,
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
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    OtpService,
    SessionService,
  ],
  exports: [AuthService, OtpService, SessionService],
})
export class AuthModule {}
