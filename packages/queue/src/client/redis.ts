import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
export const redisConnection = redisUrl
    ? new IORedis(redisUrl, {
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