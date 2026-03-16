import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { Verification } from '../../entities/verification.entity';
import { User } from '../../entities/user.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Verification, User]), EmailModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
