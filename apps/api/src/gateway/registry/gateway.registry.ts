// apps/api/src/gateway/registry/gateway.registry.ts
import { Gateway } from "../contracts/gateway";
import { GatewayState } from "../state/gateway.state";
import { GatewayMetrics } from "../contracts/gateway-metrics";

export interface GatewayRecord {
    readonly gatewayId: string;
    readonly contextId: string;
    readonly state: GatewayState;
    readonly capacity: number;
    readonly activeUsers: number;
    readonly activeConnections: number;
    readonly createdAt: Date;
    readonly activatedAt?: Date;
    readonly lastHeartbeat: Date;
}

export class GatewayRegistry {
    private readonly gateways = new Map<string, Gateway>();
    private readonly contextIndex = new Map<string, string>(); // contextId -> gatewayId

    public async register(gateway: Gateway): Promise<void> {
        this.gateways.set(gateway.id, gateway);
        this.contextIndex.set(gateway.context.contextId, gateway.id);
    }

    public async unregister(gatewayId: string): Promise<void> {
        const gw = this.gateways.get(gatewayId);
        if (gw) {
            this.contextIndex.delete(gw.context.contextId);
            this.gateways.delete(gatewayId);
        }
    }

    public async findById(gatewayId: string): Promise<Gateway | null> {
        return this.gateways.get(gatewayId) || null;
    }

    public async findByContextId(contextId: string): Promise<Gateway | null> {
        const gwId = this.contextIndex.get(contextId);
        return gwId ? this.gateways.get(gwId) || null : null;
    }

    public async getAllActive(): Promise<Gateway[]> {
        return Array.from(this.gateways.values()).filter(
            (g) => g.getState() === GatewayState.ACTIVE || g.getState() === GatewayState.READY
        );
    }

    public async getAllRecords(): Promise<GatewayMetrics[]> {
        return Array.from(this.gateways.values()).map((g) => g.getMetrics());
    }
}
