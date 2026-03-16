import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isRedisEnabled: boolean;
  private inMemoryStore: Map<string, { value: string; expiry?: number }> =
    new Map();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.isRedisEnabled =
      this.configService.get('REDIS_ENABLED', 'false') === 'true';

    if (!this.isRedisEnabled) {
      console.log('⚠️ Redis disabled - using in-memory alternatives');
      // Start cleanup interval for in-memory store
      setInterval(() => this.cleanupInMemoryStore(), 60000); // Cleanup every minute
      return;
    }

    this.client = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
      password: this.configService.get('REDIS_PASSWORD'),
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await this.client.connect();
    console.log('✅ Redis connected');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  private cleanupInMemoryStore() {
    const now = Date.now();
    for (const [key, data] of this.inMemoryStore.entries()) {
      if (data.expiry && data.expiry < now) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  // OTP Management
  async setOtp(
    key: string,
    otp: string,
    ttlSeconds: number = 300
  ): Promise<void> {
    if (this.isRedisEnabled && this.client) {
      await this.client.setEx(`otp:${key}`, ttlSeconds, otp);
    } else {
      // In-memory fallback
      const expiry = Date.now() + ttlSeconds * 1000;
      this.inMemoryStore.set(`otp:${key}`, { value: otp, expiry });
    }
  }

  async getOtp(key: string): Promise<string | null> {
    if (this.isRedisEnabled && this.client) {
      return await this.client.get(`otp:${key}`);
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(`otp:${key}`);
      if (!data) return null;
      if (data.expiry && data.expiry < Date.now()) {
        this.inMemoryStore.delete(`otp:${key}`);
        return null;
      }
      return data.value;
    }
  }

  async deleteOtp(key: string): Promise<void> {
    if (this.isRedisEnabled && this.client) {
      await this.client.del(`otp:${key}`);
    } else {
      // In-memory fallback
      this.inMemoryStore.delete(`otp:${key}`);
    }
  }

  // Rate Limiting
  async incrementRateLimit(
    key: string,
    ttlSeconds: number = 60
  ): Promise<number> {
    if (this.isRedisEnabled && this.client) {
      const multi = this.client.multi();
      multi.incr(`rate_limit:${key}`);
      multi.expire(`rate_limit:${key}`, ttlSeconds);
      const results = await multi.exec();
      return results[0] as number;
    } else {
      // In-memory fallback
      const rateLimitKey = `rate_limit:${key}`;
      const data = this.inMemoryStore.get(rateLimitKey);
      const now = Date.now();
      const expiry = now + ttlSeconds * 1000;

      if (!data || (data.expiry && data.expiry < now)) {
        this.inMemoryStore.set(rateLimitKey, { value: '1', expiry });
        return 1;
      } else {
        const newCount = parseInt(data.value) + 1;
        this.inMemoryStore.set(rateLimitKey, {
          value: newCount.toString(),
          expiry: data.expiry,
        });
        return newCount;
      }
    }
  }

  async getRateLimit(key: string): Promise<number> {
    if (this.isRedisEnabled && this.client) {
      const count = await this.client.get(`rate_limit:${key}`);
      return count ? parseInt(count) : 0;
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(`rate_limit:${key}`);
      if (!data) return 0;
      if (data.expiry && data.expiry < Date.now()) {
        this.inMemoryStore.delete(`rate_limit:${key}`);
        return 0;
      }
      return parseInt(data.value);
    }
  }

  // Session Management
  async setSession(key: string, data: any, ttlSeconds: number): Promise<void> {
    if (this.isRedisEnabled && this.client) {
      await this.client.setEx(
        `session:${key}`,
        ttlSeconds,
        JSON.stringify(data)
      );
    } else {
      // In-memory fallback
      const expiry = Date.now() + ttlSeconds * 1000;
      this.inMemoryStore.set(`session:${key}`, {
        value: JSON.stringify(data),
        expiry,
      });
    }
  }

  async getSession(key: string): Promise<any> {
    if (this.isRedisEnabled && this.client) {
      const data = await this.client.get(`session:${key}`);
      return data ? JSON.parse(data) : null;
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(`session:${key}`);
      if (!data) return null;
      if (data.expiry && data.expiry < Date.now()) {
        this.inMemoryStore.delete(`session:${key}`);
        return null;
      }
      return JSON.parse(data.value);
    }
  }

  async deleteSession(key: string): Promise<void> {
    if (this.isRedisEnabled && this.client) {
      await this.client.del(`session:${key}`);
    } else {
      // In-memory fallback
      this.inMemoryStore.delete(`session:${key}`);
    }
  }

  // Cache Management
  async setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
    await this.client.setEx(`cache:${key}`, ttlSeconds, JSON.stringify(data));
  }

  async getCache(key: string): Promise<any> {
    const data = await this.client.get(`cache:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteCache(key: string): Promise<void> {
    await this.client.del(`cache:${key}`);
  }

  // Lock Management
  async acquireLock(key: string, ttlSeconds: number = 10): Promise<boolean> {
    const result = await this.client.set(`lock:${key}`, '1', {
      EX: ttlSeconds,
      NX: true,
    });
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.client.del(`lock:${key}`);
  }

  // Generic Redis operations
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // Additional methods for rate limiting guard
  async incr(key: string): Promise<number> {
    if (this.isRedisEnabled && this.client) {
      return await this.client.incr(key);
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(key);
      const count = data ? (parseInt(data.value) || 0) + 1 : 1;
      this.inMemoryStore.set(key, { value: count.toString(), expiry: null });
      return count;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (this.isRedisEnabled && this.client) {
      const result = await this.client.expire(key, seconds);
      return Boolean(result);
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(key);
      if (data) {
        data.expiry = Date.now() + seconds * 1000;
        this.inMemoryStore.set(key, data);
        return true;
      }
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (this.isRedisEnabled && this.client) {
      return await this.client.ttl(key);
    } else {
      // In-memory fallback
      const data = this.inMemoryStore.get(key);
      if (data && data.expiry) {
        const remaining = Math.max(
          0,
          Math.floor((data.expiry - Date.now()) / 1000)
        );
        return remaining;
      }
      return -2; // Key doesn't exist
    }
  }
}
