import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

/**
 * User Rate Limit Guard
 *
 * Implements per-user rate limiting to prevent abuse by individual users
 * even if they distribute requests across multiple IPs (e.g., using proxies)
 *
 * Features:
 * - Limits requests per user per time window
 * - Uses Redis for distributed rate limiting (falls back to in-memory)
 * - Configurable limits per endpoint using decorators
 * - Returns rate limit info in headers
 */

// Decorator to set custom rate limits per endpoint
export const USER_RATE_LIMIT_KEY = 'user_rate_limit';
export const UserRateLimit = (limit: number, ttl: number = 60) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      USER_RATE_LIMIT_KEY,
      { limit, ttl },
      descriptor.value
    );
    return descriptor;
  };
};

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  // In-memory fallback storage when Redis is disabled
  private inMemoryStore = new Map<string, { count: number; resetAt: number }>();

  // Default rate limits
  private readonly defaultLimit = 100; // requests
  private readonly defaultTTL = 60; // seconds

  constructor(
    private reflector: Reflector,
    private redisService: RedisService
  ) {
    // Clean up in-memory store periodically
    setInterval(() => this.cleanupInMemoryStore(), 60000); // every minute
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const userId = request.user?.id;

    // Skip rate limiting for unauthenticated requests
    // (they are handled by global ThrottlerGuard)
    if (!userId) {
      return true;
    }

    // Get custom limits from decorator or use defaults
    const handler = context.getHandler();
    const rateLimitConfig = this.reflector.get<{ limit: number; ttl: number }>(
      USER_RATE_LIMIT_KEY,
      handler
    );
    const limit = rateLimitConfig?.limit || this.defaultLimit;
    const ttl = rateLimitConfig?.ttl || this.defaultTTL;

    // Try Redis first, fall back to in-memory
    let count: number;
    let resetAt: number;

    try {
      const result = await this.incrementRedis(userId, ttl);
      count = result.count;
      resetAt = result.resetAt;
    } catch (error) {
      // Fallback to in-memory storage
      const result = this.incrementInMemory(userId, ttl);
      count = result.count;
      resetAt = result.resetAt;
    }

    // Add rate limit headers
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
    response.setHeader('X-RateLimit-Reset', resetAt);

    // Check if limit exceeded
    if (count > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          error: 'Rate Limit Exceeded',
          retryAfter: resetAt - Math.floor(Date.now() / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  /**
   * Increment counter in Redis
   */
  private async incrementRedis(
    userId: string,
    ttl: number
  ): Promise<{ count: number; resetAt: number }> {
    const key = `rate_limit:user:${userId}`;

    // Increment counter
    const count = await this.redisService.incr(key);

    // Set expiry on first request
    if (count === 1) {
      await this.redisService.expire(key, ttl);
    }

    // Get TTL to calculate reset time
    const remainingTTL = await this.redisService.ttl(key);
    const resetAt = Math.floor(Date.now() / 1000) + remainingTTL;

    return { count, resetAt };
  }

  /**
   * Increment counter in memory (fallback when Redis is disabled)
   */
  private incrementInMemory(
    userId: string,
    ttl: number
  ): { count: number; resetAt: number } {
    const now = Date.now();
    const key = `user:${userId}`;

    let entry = this.inMemoryStore.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        resetAt: now + ttl * 1000,
      };
    } else {
      entry.count++;
    }

    this.inMemoryStore.set(key, entry);

    return {
      count: entry.count,
      resetAt: Math.floor(entry.resetAt / 1000),
    };
  }

  /**
   * Clean up expired entries from in-memory store
   */
  private cleanupInMemoryStore() {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (entry.resetAt < now) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}
