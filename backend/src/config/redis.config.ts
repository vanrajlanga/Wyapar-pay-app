import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BullModuleOptions,
  SharedBullConfigurationFactory,
} from '@nestjs/bull';

@Injectable()
export class RedisConfig implements SharedBullConfigurationFactory {
  constructor(private configService: ConfigService) {}

  createSharedConfiguration(): BullModuleOptions {
    const isRedisEnabled =
      this.configService.get('REDIS_ENABLED', 'false') === 'true';

    if (!isRedisEnabled) {
      return {
        redis: {
          host: 'localhost',
          port: 6379,
        },
        // Disable Redis by using a dummy configuration
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
        },
      };
    }

    return {
      redis: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      },
    };
  }
}
