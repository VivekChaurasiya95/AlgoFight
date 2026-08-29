// apps/api/src/gateway/events/gateway.events.ts
import { DomainEvent } from "@algofight/events";

export class GatewayActivatedEvent implements DomainEvent<{ gatewayId: string; contextId: string }> {
    public readonly eventName = "gateway.activated";
    public readonly occurredAt = new Date();
    public readonly payload: { gatewayId: string; contextId: string };

    constructor(gatewayId: string, contextId: string) {
        this.payload = { gatewayId, contextId };
    }
}

export class GatewayDegradedEvent implements DomainEvent<{ gatewayId: string; reason: string }> {
    public readonly eventName = "gateway.degraded";
    public readonly occurredAt = new Date();
    public readonly payload: { gatewayId: string; reason: string };

    constructor(gatewayId: string, reason: string) {
        this.payload = { gatewayId, reason };
    }
}

export class UserAdmittedEvent implements DomainEvent<{ gatewayId: string; userId: string; contextId: string }> {
    public readonly eventName = "gateway.user_admitted";
    public readonly occurredAt = new Date();
    public readonly payload: { gatewayId: string; userId: string; contextId: string };

    constructor(gatewayId: string, userId: string, contextId: string) {
        this.payload = { gatewayId, userId, contextId };
    }
}

export class UserRejectedEvent implements DomainEvent<{ gatewayId: string; reason: string; ip: string }> {
    public readonly eventName = "gateway.user_rejected";
    public readonly occurredAt = new Date();
    public readonly payload: { gatewayId: string; reason: string; ip: string };

    constructor(gatewayId: string, reason: string, ip: string) {
        this.payload = { gatewayId, reason, ip };
    }
}
