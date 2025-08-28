import { Redis } from '@upstash/redis';
import type { Env } from '../types';
import type { Logger } from '../utils/logger';

export class UpstashAssetStorage {
  private redis: Redis;
  private logger: Logger;

  constructor(env: Env, logger: Logger) {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Missing required Upstash Redis environment variables');
    }

    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    this.logger = logger;
  }

  async store(key: string, data: ArrayBuffer, ttl = 3600): Promise<void> {
    try {
      const base64 = Buffer.from(data).toString('base64');
      await this.redis.setex(key, ttl, base64);
      this.logger.info('Asset stored in Upstash Redis', { key, size: data.byteLength, ttl });
    } catch (error) {
      this.logger.error('Failed to store asset in Upstash Redis', error, { key });
      throw error;
    }
  }

  async retrieve(key: string): Promise<ArrayBuffer | null> {
    try {
      const base64 = await this.redis.get<string>(key);
      if (!base64) {
        this.logger.info('Asset not found in Upstash Redis', { key });
        return null;
      }
      
      const buffer = Buffer.from(base64, 'base64');
      this.logger.info('Asset retrieved from Upstash Redis', { key, size: buffer.length });
      return buffer.buffer;
    } catch (error) {
      this.logger.error('Failed to retrieve asset from Upstash Redis', error, { key });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.info('Asset deleted from Upstash Redis', { key });
    } catch (error) {
      this.logger.error('Failed to delete asset from Upstash Redis', error, { key });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Failed to check asset existence in Upstash Redis', error, { key });
      return false;
    }
  }
} 