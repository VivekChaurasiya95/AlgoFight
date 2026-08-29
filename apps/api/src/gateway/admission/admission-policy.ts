// apps/api/src/gateway/admission/admission-policy.ts

export type TrafficTier = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4" | "BUSY";

export interface TrafficClassifierRule {
    matches(path: string, method: string): boolean;
    readonly tier: TrafficTier;
    readonly priority?: number; // Higher numbers evaluated first
}

export interface SheddingThresholds {
    readonly [tier: string]: number;
}

export const DEFAULT_SHEDDING_THRESHOLDS: SheddingThresholds = {
    TIER_4: 0.90, // Shed background polls when load > 90%
    TIER_3: 0.93, // Shed practice runs when load > 93%
    TIER_2: 0.96, // Shed matchmaking/auth when load > 96%
    TIER_1: 0.98, // Shed non-critical battle queries when load > 98%
    BUSY: 1.00,   // Full saturation boundary
};

export class PathPrefixClassifierRule implements TrafficClassifierRule {
    constructor(
        private readonly prefixes: string[],
        public readonly tier: TrafficTier,
        public readonly priority: number = 10
    ) { }

    public matches(path: string, _method: string): boolean {
        const normalized = path.toLowerCase();
        return this.prefixes.some((prefix) => normalized.startsWith(prefix) || normalized.includes(prefix));
    }
}

export class RegexClassifierRule implements TrafficClassifierRule {
    constructor(
        private readonly pattern: RegExp,
        public readonly tier: TrafficTier,
        public readonly priority: number = 20
    ) { }

    public matches(path: string, _method: string): boolean {
        return this.pattern.test(path);
    }
}

export class AdmissionPolicyEngine {
    private readonly rules: TrafficClassifierRule[] = [];
    private readonly sheddingThresholds: SheddingThresholds;
    private readonly defaultTier: TrafficTier;

    constructor(
        customRules?: TrafficClassifierRule[],
        sheddingThresholds: SheddingThresholds = DEFAULT_SHEDDING_THRESHOLDS,
        defaultTier: TrafficTier = "TIER_4"
    ) {
        this.sheddingThresholds = sheddingThresholds;
        this.defaultTier = defaultTier;

        if (customRules && customRules.length > 0) {
            customRules.forEach((r) => this.registerRule(r));
        } else {
            this.registerDefaultRules();
        }
    }

    public registerRule(rule: TrafficClassifierRule): this {
        this.rules.push(rule);
        this.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        return this;
    }

    public classifyTraffic(path: string, method: string): TrafficTier {
        for (const rule of this.rules) {
            if (rule.matches(path, method)) {
                return rule.tier;
            }
        }
        return this.defaultTier;
    }

    public shouldAdmit(tier: TrafficTier, utilization: number): boolean {
        const maxThreshold = this.sheddingThresholds[tier] ?? 1.0;
        return utilization <= maxThreshold;
    }

    private registerDefaultRules(): void {
        // TIER 1: Critical Live Battle
        this.registerRule(new PathPrefixClassifierRule(["/submit", "/battle", "/execute"], "TIER_1", 30));

        // TIER 2: Matchmaking & Auth
        this.registerRule(new PathPrefixClassifierRule(["/matchmaking", "/auth"], "TIER_2", 20));

        // TIER 3: Practice & Problem View
        this.registerRule(new PathPrefixClassifierRule(["/problems", "/practice", "/test"], "TIER_3", 10));
    }
}

export const admissionPolicyEngine = new AdmissionPolicyEngine();
