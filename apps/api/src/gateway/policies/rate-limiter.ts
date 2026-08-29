interface RateBucket {
    tokens: number;
    lastRefill: number;
}
export class MultiDimensionalRateLimiter {
    private readonly buckets = new Map<string, RateBucket>();

    public checkRateLimit(key: string, maxRequestPerMinute: number,
        burstLimit: number
    ): { allowed: boolean; retryAfterSeconds: number } {
        const now = Date.now();
        const refillRatePerMs = maxRequestPerMinute / 60000;

        let bucket = this.buckets.get(key);
        if (!bucket) {
            bucket = {
                tokens: burstLimit,
                lastRefill: now,
            };
            this.buckets.set(key, bucket);
        }
        const elapsedMs = now - bucket.lastRefill;
        const tokensToAdd = elapsedMs * refillRatePerMs;
        bucket.tokens = Math.min(burstLimit, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return { allowed: true, retryAfterSeconds: 0 };
        }
        const missingTokens = 1 - bucket.tokens;
        const retryAfterSeconds =
            Math.ceil(missingTokens / (refillRatePerMs * 1000));
        return { allowed: false, retryAfterSeconds };
    }
}
export const gatewayRateLimiter = new MultiDimensionalRateLimiter();