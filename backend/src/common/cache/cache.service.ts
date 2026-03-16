import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expiry: number }>();
  private isRedisEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.isRedisEnabled =
      this.configService.get('REDIS_ENABLED', 'false') === 'true';
  }

  async get(key: string): Promise<any> {
    if (this.isRedisEnabled) {
      // Redis implementation would go here
      // For now, return null to indicate cache miss
      return null;
    }

    // In-memory cache implementation
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (this.isRedisEnabled) {
      // Redis implementation would go here
      return;
    }

    // In-memory cache implementation
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisEnabled) {
      // Redis implementation would go here
      return;
    }

    // In-memory cache implementation
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.isRedisEnabled) {
      // Redis implementation would go here
      return false;
    }

    // In-memory cache implementation
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Clean up expired entries (call this periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
