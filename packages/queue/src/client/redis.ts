import IORedis from "ioredis";
export const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,

    maxRetriesPerRequest: null,

    retryStrategy(time) {
        return Math.min(time * 50, 2000);
    },
});