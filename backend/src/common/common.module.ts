import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { EncryptionModule } from './encryption/encryption.module';
import { ValidationModule } from './validation/validation.module';
import { CacheModule } from './cache/cache.module';
import { EmailModule } from './email/email.module';
import { VerificationModule } from './verification/verification.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    RedisModule,
    EncryptionModule,
    ValidationModule,
    CacheModule,
    EmailModule,
    VerificationModule,
    AuditModule,
  ],
  exports: [
    RedisModule,
    EncryptionModule,
    ValidationModule,
    CacheModule,
    EmailModule,
    VerificationModule,
    AuditModule,
  ],
})
export class CommonModule {}
