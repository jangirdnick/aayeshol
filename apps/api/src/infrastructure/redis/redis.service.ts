import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import type { RequestContext } from '../../auth/types/auth.types.js';

/**
 * Production-ready service providing strongly-typed helper methods for Redis operations via `@nestjs-modules/ioredis`.
 * Features automatic JSON serialization/deserialization, lifecycle event logging, and exception handling.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@InjectRedis() private readonly redisClient: Redis) {
    this.setupEventHandlers();
  }

  /**
   * Configures lifecycle event listeners for the ioredis instance.
   * Logs connection status changes, reconnections, and client errors.
   */
  private setupEventHandlers(): void {
    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redisClient.on('ready', () => {
      this.logger.log('Redis client is ready to process commands');
    });

    this.redisClient.on('error', (err: Error) => {
      this.logger.error(`Redis Client Error: ${err.message}`, err.stack);
    });

    this.redisClient.on('reconnecting', (delay?: number) => {
      this.logger.warn(`Redis client reconnecting${delay ? ` in ${delay}ms` : ''}...`);
    });

    this.redisClient.on('end', () => {
      this.logger.warn('Redis connection has been closed');
    });
  }

  private formatContext(ctx?: RequestContext): string {
    if (!ctx) return '';
    return ` [requestId=${ctx.requestId}, ip=${ctx.ipAddress ?? 'unknown'}, ua=${ctx.userAgent ?? 'unknown'}]`;
  }

  /**
   * Retrieves a raw string value stored at the specified Redis key.
   *
   * @param key - The unique Redis key to look up.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving to the string value if found, or `null` if the key does not exist.
   * @throws {Error} If Redis fails to execute the get command.
   *
   * @example
   * ```typescript
   * const token = await this.redisService.get('user:session:123');
   * ```
   */
  async get(key: string, ctx?: RequestContext): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error fetching key "${key}" from Redis: ${message}${this.formatContext(ctx)}`,
      );
      throw error;
    }
  }

  /**
   * Retrieves and automatically parses a JSON-encoded object from Redis.
   *
   * @template T - Expected data type of the parsed object.
   * @param key - The unique Redis key to look up.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving to the parsed object of type `T`, or `null` if the key does not exist / parsing fails.
   *
   * @example
   * ```typescript
   * interface UserProfile { id: string; name: string; }
   * const user = await this.redisService.getObject<UserProfile>('user:profile:123');
   * ```
   */
  async getObject<T>(key: string, ctx?: RequestContext): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error parsing or fetching object key "${key}" from Redis: ${message}${this.formatContext(ctx)}`,
      );
      return null;
    }
  }

  /**
   * Stores a raw string value in Redis with an optional Time-To-Live (TTL) expiration.
   *
   * @param key - The key under which to store the value.
   * @param value - The string value to store.
   * @param ttlSeconds - Optional expiration time in seconds.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving when the operation succeeds.
   * @throws {Error} If Redis fails to set the value.
   *
   * @example
   * ```typescript
   * await this.redisService.set('otp:123456', '998877', 300); // Expires in 5 minutes
   * ```
   */
  async set(key: string, value: string, ttlSeconds?: number, ctx?: RequestContext): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redisClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error setting key "${key}" in Redis: ${message}${this.formatContext(ctx)}`,
      );
      throw error;
    }
  }

  /**
   * Serializes a JavaScript value/object to JSON and stores it in Redis with an optional TTL.
   *
   * @param key - The key under which to store the object.
   * @param value - The object or data structure to serialize and store.
   * @param ttlSeconds - Optional expiration time in seconds.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving when the operation succeeds.
   * @throws {Error} If serialization or storage fails.
   *
   * @example
   * ```typescript
   * await this.redisService.setObject('cart:session:456', { items: [1, 2, 3] }, 3600);
   * ```
   */
  async setObject(
    key: string,
    value: unknown,
    ttlSeconds?: number,
    ctx?: RequestContext,
  ): Promise<void> {
    try {
      const stringifiedValue = JSON.stringify(value);
      await this.set(key, stringifiedValue, ttlSeconds, ctx);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error setting object key "${key}" in Redis: ${message}${this.formatContext(ctx)}`,
      );
      throw error;
    }
  }

  /**
   * Removes a key from Redis storage.
   *
   * @param key - The key to delete.
   * @param ctx - (Optional) RequestContext for structured logging
   * @returns Promise resolving when deletion completes.
   * @throws {Error} If Redis fails to delete the key.
   *
   * @example
   * ```typescript
   * await this.redisService.del('user:session:123');
   * ```
   */
  async del(key: string, ctx?: RequestContext): Promise<void> {
    try {
      await this.redisClient.del(key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error deleting key "${key}" from Redis: ${message}${this.formatContext(ctx)}`,
      );
      throw error;
    }
  }

  /**
   * Gracefully shuts down the ioredis connection when NestJS destroys the module.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Closing Redis connection...');
    await this.redisClient.quit();
  }
}
