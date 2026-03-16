import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { KycService } from './kyc.service';
import { ProfileService } from './profile.service';
import { DocumentService } from './document.service';

import { User } from '../../entities/user.entity';
import { UserDocument } from '../../entities/user-document.entity';
import { KycVerification } from '../../entities/kyc-verification.entity';
import { CommonModule } from '../../common/common.module';
import { NotificationEventsModule } from '../../common/notifications/notification-events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserDocument, KycVerification]),
    CommonModule,
    NotificationEventsModule,
    // Conditionally register Bull queue only if Redis is enabled
    ...(process.env.REDIS_ENABLED === 'true'
      ? [
          BullModule.registerQueue({
            name: 'kyc-processing',
          }),
        ]
      : []),
  ],
  controllers: [UserController],
  providers: [UserService, KycService, ProfileService, DocumentService],
  exports: [UserService, KycService, ProfileService, DocumentService],
})
export class UserModule {}
