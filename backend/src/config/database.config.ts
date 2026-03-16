import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Database Configuration - CRM-Backend Approach
 *
 * This configuration follows the CRM-backend pattern:
 * - Manual schema creation using SQL scripts
 * - TypeORM synchronization DISABLED (synchronize: false)
 * - Entities used for queries only, not schema generation
 * - Database migrations handled manually
 *
 * Benefits:
 * - Predictable schema changes
 * - No TypeORM sync conflicts
 * - Production-ready approach
 * - Better performance
 */
@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 3306),
      username: this.configService.get('DB_USERNAME', 'root'),
      password: this.configService.get('DB_PASSWORD', ''),
      database: this.configService.get('DB_DATABASE', 'wyapar_pay'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],

      // CRITICAL: Synchronization is PERMANENTLY DISABLED
      // We use manual schema creation for reliability
      synchronize: false,

      logging: this.configService.get('NODE_ENV') === 'development',
      timezone: '+00:00',
      charset: 'utf8mb4',
      extra: {
        charset: 'utf8mb4_unicode_ci',
        // Query and transaction timeouts (in milliseconds)
        statement_timeout: 30000, // 30 seconds for queries
        lock_timeout: 10000, // 10 seconds for locks
        // Connection management
        waitForConnections: true,
        connectionLimit:
          this.configService.get('NODE_ENV') === 'production' ? 20 : 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      },
      // Connection pool settings for better reliability
      retryAttempts: 3,
      retryDelay: 1000,
      autoLoadEntities: false,
      keepConnectionAlive: true,
      // Connection timeout settings
      connectTimeout: 30000, // 30 seconds
      acquireTimeout: 30000, // 30 seconds
    };
  }
}
