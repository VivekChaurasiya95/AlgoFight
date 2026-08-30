// apps/api/src/gateway/manager/gateway.manager.ts
import { Gateway, GatewayRequest } from "../contracts/gateway";
import { GatewayContext, GatewayType } from "../contracts/gateway-context";
import { GatewayFactory } from "../factory/gateway.factory";
import { GatewayRegistry } from "../registry/gateway.registry";
import { DEFAULT_GATEWAY_POLICY } from "../policies/gateway.policy";
import { logger } from "@algofight/logger";

export class GatewayManager {
    private readonly registry: GatewayRegistry;
    private defaultGatewayId = "gw-default-user";

    constructor(registry?: GatewayRegistry) {
        this.registry = registry || new GatewayRegistry();
    }

    public async initialize(): Promise<void> {
        // Bootstrap the default public gateway
        await this.getOrCreateGateway({
            gatewayId: this.defaultGatewayId,
            contextId: "ctx-default-global",
            type: GatewayType.USER,
            name: "Default Public Gateway",
            capacity: 1000,
            policy: DEFAULT_GATEWAY_POLICY,
        });
        logger.info("GatewayManager initialized with default public gateway");
    }

    public async resolveGateway(request: GatewayRequest): Promise<Gateway> {
        // Check for specific context from header or request body
        const requestedContextId =
            request.contextId ||
            (request.headers["x-context-id"] as string) ||
            "ctx-default-global";

        let gateway = await this.registry.findByContextId(requestedContextId);

        // 🛡️ AF-006: Prevent arbitrary in-memory gateway creation from unverified client headers
        if (!gateway) {
            gateway = await this.registry.findById(this.defaultGatewayId);
        }

        if (!gateway) {
            // Failsafe: ensure default gateway exists
            gateway = await this.getOrCreateGateway({
                gatewayId: this.defaultGatewayId,
                contextId: "ctx-default-global",
                type: GatewayType.USER,
                name: "Default Public Gateway",
                capacity: 1000,
                policy: DEFAULT_GATEWAY_POLICY,
            });
        }

        return gateway;
    }

    public async getOrCreateGateway(context: GatewayContext): Promise<Gateway> {
        let existing = await this.registry.findById(context.gatewayId);
        if (existing) return existing;

        const newGateway = GatewayFactory.create(context.type, context);
        await newGateway.initialize(context);
        await newGateway.activate();

        await this.registry.register(newGateway);
        logger.info({ gatewayId: newGateway.id, contextId: context.contextId }, "Created and registered new logical Gateway");
        return newGateway;
    }

    public async getGateway(gatewayId: string): Promise<Gateway | null> {
        return this.registry.findById(gatewayId);
    }

    public async drainGateway(gatewayId: string): Promise<void> {
        const gw = await this.registry.findById(gatewayId);
        if (gw) {
            await gw.drain();
            logger.info({ gatewayId }, "Gateway draining started");
        }
    }

    public async destroyGateway(gatewayId: string): Promise<void> {
        const gw = await this.registry.findById(gatewayId);
        if (gw) {
            await gw.shutdown();
            await this.registry.unregister(gatewayId);
            logger.info({ gatewayId }, "Gateway destroyed and unregistered");
        }
    }

    public getRegistry(): GatewayRegistry {
        return this.registry;
    }
}

// Singleton manager instance for apps/api
export const gatewayManager = new GatewayManager();
