import Redis from 'ioredis';

export interface CacheStats {
  type: 'redis' | 'memory';
  keysCount: number;
  hits: number;
  misses: number;
}

class CacheManager {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiry: number }>();
  private hits = 0;
  private misses = 0;
  private type: 'redis' | 'memory' = 'memory';

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        console.log('[Cache] Redis URL detected. Attempting connection...');
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          connectTimeout: 5000,
        });

        this.redis.on('connect', () => {
          this.type = 'redis';
          console.log('[Cache] Redis connection established successfully.');
        });

        this.redis.on('error', (err) => {
          console.error('[Cache] Redis error, falling back to Memory cache:', err.message);
          this.type = 'memory';
        });
      } catch (err) {
        console.error('[Cache] Failed to initialize Redis client, falling back to Memory:', err);
        this.type = 'memory';
      }
    } else {
      console.log('[Cache] No Redis URL provided. Using in-memory cache.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.type === 'redis' && this.redis) {
      try {
        const val = await this.redis.get(key);
        if (val) {
          this.hits++;
          return JSON.parse(val) as T;
        }
      } catch (err) {
        console.error('[Cache] Redis GET failed, using memory fallback:', err);
      }
    }

    // Memory cache lookup
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (memoryItem.expiry > Date.now()) {
        this.hits++;
        return memoryItem.value as T;
      }
      // Expired
      this.memoryCache.delete(key);
    }

    this.misses++;
    return null;
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    if (this.type === 'redis' && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.error('[Cache] Redis SET failed:', err);
      }
    }

    // Memory cache set
    const expiry = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    if (this.type === 'redis' && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (err) {
        console.error('[Cache] Redis DEL failed:', err);
      }
    }
    this.memoryCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.type === 'redis' && this.redis) {
      try {
        await this.redis.flushdb();
        return;
      } catch (err) {
        console.error('[Cache] Redis FLUSHDB failed:', err);
      }
    }
    this.memoryCache.clear();
  }

  getStats(): CacheStats {
    return {
      type: this.type,
      keysCount: this.type === 'redis' ? -1 : this.memoryCache.size, // Redis keysCount is async, return -1 for simple sync dashboard
      hits: this.hits,
      misses: this.misses,
    };
  }
}

export const cache = new CacheManager();
