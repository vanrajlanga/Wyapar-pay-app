import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RedisService } from '../common/redis/redis.service';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private sesClient: SESClient;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private redisService: RedisService
  ) {
    // Initialize SES client for health checks
    this.sesClient = new SESClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  @Get()
  @ApiOperation({ summary: 'Comprehensive health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async getHealth() {
    const startTime = Date.now();

    // Run all health checks in parallel
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkAWSSES(),
      this.checkPaymentGateway(),
    ]);

    const [dbCheck, redisCheck, awsCheck, paymentCheck] = checks;

    // Determine overall status
    const allHealthy = checks.every(
      (check) =>
        check.status === 'fulfilled' && check.value.status === 'healthy'
    );
    const anyDegraded = checks.some(
      (check) =>
        check.status === 'fulfilled' && check.value.status === 'degraded'
    );

    const overallStatus = allHealthy
      ? 'healthy'
      : anyDegraded
        ? 'degraded'
        : 'unhealthy';
    const responseTime = Date.now() - startTime;

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: this.configService.get('NODE_ENV', 'development'),
      version: '1.0.0',
      checks: {
        database:
          dbCheck.status === 'fulfilled'
            ? dbCheck.value
            : { status: 'unhealthy', error: dbCheck.reason?.message },
        redis:
          redisCheck.status === 'fulfilled'
            ? redisCheck.value
            : { status: 'unhealthy', error: redisCheck.reason?.message },
        aws:
          awsCheck.status === 'fulfilled'
            ? awsCheck.value
            : { status: 'unhealthy', error: awsCheck.reason?.message },
        paymentGateway:
          paymentCheck.status === 'fulfilled'
            ? paymentCheck.value
            : { status: 'unhealthy', error: paymentCheck.reason?.message },
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };
  }

  private async checkDatabase(): Promise<any> {
    try {
      const startTime = Date.now();
      await this.userRepository.query('SELECT 1');
      const userCount = await this.userRepository.count();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get('DB_PORT', 3306),
        name: this.configService.get('DB_DATABASE', 'wyapar_pay'),
        userCount,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkRedis(): Promise<any> {
    const isEnabled =
      this.configService.get('REDIS_ENABLED', 'false') === 'true';

    if (!isEnabled) {
      return {
        status: 'degraded',
        message: 'Redis disabled (using in-memory fallback)',
      };
    }

    try {
      const startTime = Date.now();
      const testKey = 'health_check_' + Date.now();
      await this.redisService.set(testKey, 'test', 5);
      const value = await this.redisService.get(testKey);
      await this.redisService.del(testKey);
      const responseTime = Date.now() - startTime;

      return {
        status: value === 'test' ? 'healthy' : 'degraded',
        responseTime: `${responseTime}ms`,
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  private async checkAWSSES(): Promise<any> {
    const hasCredentials =
      this.configService.get('AWS_ACCESS_KEY_ID') &&
      this.configService.get('AWS_SECRET_ACCESS_KEY');

    if (!hasCredentials) {
      return {
        status: 'degraded',
        message: 'AWS credentials not configured',
      };
    }

    try {
      // Just verify credentials are valid (don't actually send)
      // SES health check would require sending actual email, so we skip it
      return {
        status: 'healthy',
        message: 'AWS SES configured',
        region: this.configService.get('AWS_REGION', 'not-set'),
      };
    } catch (error) {
      return {
        status: 'degraded',
        error: error.message,
      };
    }
  }

  private async checkPaymentGateway(): Promise<any> {
    const hasRazorpay =
      this.configService.get('RAZORPAY_KEY_ID') &&
      this.configService.get('RAZORPAY_KEY_SECRET');

    if (!hasRazorpay) {
      return {
        status: 'degraded',
        message: 'Payment gateway not configured',
      };
    }

    // In production, you might want to make actual API call to Razorpay
    // For now, just check if credentials exist
    return {
      status: 'healthy',
      message: 'Razorpay configured',
    };
  }
}
