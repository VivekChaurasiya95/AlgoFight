// apps/api/src/gateway/state/gateway-state-machine.ts
import { GatewayState } from "./gateway.state";
import { logger } from "@algofight/logger";

export class GatewayStateMachine {
    private currentState: GatewayState;
    private readonly gatewayId: string;

    private static readonly LEGAL_TRANSITIONS: Record<GatewayState, GatewayState[]> = {
        [GatewayState.CREATED]: [GatewayState.WARMING, GatewayState.DESTROYED],
        [GatewayState.WARMING]: [GatewayState.READY, GatewayState.FAILED, GatewayState.DESTROYED],
        [GatewayState.READY]: [GatewayState.ACTIVE, GatewayState.DRAINING, GatewayState.DESTROYED],
        [GatewayState.ACTIVE]: [GatewayState.DRAINING, GatewayState.DEGRADED, GatewayState.DESTROYED],
        [GatewayState.DEGRADED]: [GatewayState.ACTIVE, GatewayState.DRAINING, GatewayState.FAILED, GatewayState.DESTROYED],
        [GatewayState.DRAINING]: [GatewayState.COMPLETED, GatewayState.DESTROYED],
        [GatewayState.COMPLETED]: [GatewayState.DESTROYED],
        [GatewayState.FAILED]: [GatewayState.WARMING, GatewayState.DESTROYED],
        [GatewayState.DESTROYED]: [], // Terminal state
    };

    constructor(gatewayId: string, initialState: GatewayState = GatewayState.CREATED) {
        this.gatewayId = gatewayId;
        this.currentState = initialState;
    }

    public getState(): GatewayState {
        return this.currentState;
    }

    public canTransitionTo(targetState: GatewayState): boolean {
        const allowed = GatewayStateMachine.LEGAL_TRANSITIONS[this.currentState] || [];
        return allowed.includes(targetState);
    }

    public transition(targetState: GatewayState, reason?: string): void {
        if (!this.canTransitionTo(targetState)) {
            const err = `Illegal Gateway state transition: ${this.currentState} -> ${targetState} for gateway ${this.gatewayId}`;
            logger.error({ gatewayId: this.gatewayId, from: this.currentState, to: targetState, reason }, err);
            throw new Error(err);
        }

        const previous = this.currentState;
        this.currentState = targetState;
        logger.info(
            { gatewayId: this.gatewayId, from: previous, to: targetState, reason },
            `Gateway state changed: ${previous} -> ${targetState}`
        );
    }
}
