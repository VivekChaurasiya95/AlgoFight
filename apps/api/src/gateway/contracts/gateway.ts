import { GatewayContext } from "../contracts/gateway-context";
import { GatewayState } from "../state/gateway.state";
import { GatewayMetrics } from "../contracts/gateway-metrics";

export interface GatewayRequest {
    readonly id: string;
    readonly ip: string;
    readonly method: string;
    readonly url: string;
    readonly path: string;
    readonly headers: Record<string, string | string[] | undefined>
    readonly body?: any;
    readonly contentLength?: number;
    readonly contextId?: string;
    readonly timestamp: number;
}

export interface UserIdentity {
    readonly id: string;
    readonly email?: string;
    readonly username?: string;
    readonly role: "ADMIN" | "USER";
    readonly platformCode?: string;
    readonly institutionName?: string;
    readonly rawToken?: string;
}
export type GatewayDecisionAction = "ALLOW" | "REJECT" | "THROTTLE" | "DROP";


export interface GatewayDecision {
    readonly action: GatewayDecisionAction;
    readonly statusCode?: number;
    readonly reason?: string;
    readonly headersToAdd?: Record<string, string | string[]>;

}

export interface AdmissionResult {
    readonly admitted: boolean;
    readonly reason?: string;
    readonly statusCode?: number;
    readonly retryAfterSeconds?: number;
    readonly assignedTier?: "TIER_1" | "TIER_2" | "TIER_3" | "" | "CUSTOM" | "FREE_TIER"
}

export interface Gateway {
    readonly id: string;
    readonly context: GatewayContext;

    initialize(
        context: GatewayContext
    ): Promise<void>;
    authenticate(request: GatewayRequest
    ): Promise<UserIdentity | null>;
    filter(request: GatewayRequest): Promise<GatewayDecision>;
    admit(identity: UserIdentity, request: GatewayRequest): Promise<AdmissionResult>;
    activate(): Promise<void>;
    drain(): Promise<void>;
    shutdown(): Promise<void>;
    getState(): GatewayState;
    getMetrics(): GatewayMetrics;
    recordHeartbeat(): void;

}
