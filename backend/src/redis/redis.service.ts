import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Resilient Redis wrapper.
 *
 * If REDIS_URL is unset or Redis is unreachable, every method degrades to a
 * safe no-op (cache miss / skipped write) so the app keeps working without
 * Redis. This lets the platform boot in environments without Redis while
 * using it for caching and (later) queues when it is available.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('RedisService');
  private client: Redis | null = null;
  private healthy = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set — caching disabled (running without Redis)');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });
    this.client.on('ready', () => {
      this.healthy = true;
      this.logger.log('Redis connected');
    });
    this.client.on('error', (e) => {
      if (this.healthy) this.logger.warn(`Redis error: ${e.message}`);
      this.healthy = false;
    });
    this.client.on('end', () => {
      this.healthy = false;
    });
  }

  get isEnabled() {
    return !!this.client && this.healthy;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled) return null;
    try {
      const raw = await this.client!.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.isEnabled) return;
    try {
      await this.client!.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* ignore — cache is best-effort */
    }
  }

  /** Delete keys matching a glob pattern (used for cache invalidation). */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isEnabled) return;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length) await this.client!.del(keys);
    } catch {
      /* ignore */
    }
  }

  /** Read-through helper: return cached value or compute, cache and return it. */
  async wrap<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await compute();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
