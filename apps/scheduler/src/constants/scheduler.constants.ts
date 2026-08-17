export const SCHEDULER_INTERVALS = {
    STALE_CHECK: 30_000,
    BATTLE_EXPIRATION_CHECK: 10_000,
} as const;

export const RETRY_POLICY = {
    MAX_RETRIES: 3,
} as const;

export const RECOVERY_POLICY = {
    STALE_THRESHOLD_MS:
        5 * 60 * 1000,
    MAX_RETRIES: 3,

} as const;