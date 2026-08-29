// apps/api/src/gateway/state/gateway.state.ts

export enum GatewayState {
    CREATED = "CREATED",
    WARMING = "WARMING",
    READY = "READY",
    ACTIVE = "ACTIVE",
    DRAINING = "DRAINING",
    COMPLETED = "COMPLETED",
    DESTROYED = "DESTROYED",
    FAILED = "FAILED",
    DEGRADED = "DEGRADED",
}
