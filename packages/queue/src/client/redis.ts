import IORedis from "ioredis";

const rawUrl = process.env.REDIS_URL || (process.env.REDIS_HOST?.startsWith("redis://") || process.env.REDIS_HOST?.startsWith("valkey://") || process.env.REDIS_HOST?.startsWith("rediss://") ? process.env.REDIS_HOST : null);

export const redisConnection = rawUrl
    ? new IORedis(rawUrl, {
          maxRetriesPerRequest: null,
          retryStrategy(time) {
              return Math.min(time * 50, 2000);
          },
      })
    : new IORedis({
          host: process.env.REDIS_HOST || "localhost",
          port: Number(process.env.REDIS_PORT) || 6379,
          maxRetriesPerRequest: null,
          retryStrategy(time) {
              return Math.min(time * 50, 2000);
          },
      });