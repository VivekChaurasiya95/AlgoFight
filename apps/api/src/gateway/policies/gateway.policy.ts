// apps/api/src/gateway/policies/gateway.policy.ts

export interface RateLimitPolicy {
    readonly maxRequestsPerMinute: number;
    readonly burstLimit: number;
}

export interface GatewayPolicy {
    readonly maxRequestBodySizeBytes: number; // e.g. 1048576 (1MB)
    readonly allowedMethods: string[]; // ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    readonly allowedOrigins?: string[] | boolean;
    readonly ipRateLimit: RateLimitPolicy;
    readonly userRateLimit: RateLimitPolicy;
    readonly maxActiveConnections: number;
    readonly maxActiveUsers: number;
    readonly enableIpJail: boolean;
    readonly maxFailedAuthBeforeJail: number; // e.g. 10 attempts
    readonly jailDurationSeconds: number; // e.g. 60 seconds
}

export const DEFAULT_GATEWAY_POLICY: GatewayPolicy = {
    maxRequestBodySizeBytes: 1048576, // 1MB
    allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedOrigins: true,
    ipRateLimit: {
        maxRequestsPerMinute: 120,
        burstLimit: 30,
    },
    userRateLimit: {
        maxRequestsPerMinute: 180,
        burstLimit: 40,
    },
    maxActiveConnections: 500,
    maxActiveUsers: 250,
    enableIpJail: true,
    maxFailedAuthBeforeJail: 10,
    jailDurationSeconds: 60,
};
