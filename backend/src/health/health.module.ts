import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { User } from '../entities/user.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CommonModule, // For RedisService
  ],
  controllers: [HealthController],
})
export class HealthModule {}
