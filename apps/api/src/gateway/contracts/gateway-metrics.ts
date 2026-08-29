import { GatewayState } from "../state/gateway.state";

export interface GatewayMetrics {
    readonly gatewayId: string;
    readonly contextId: string;
    readonly state: GatewayState;
    readonly capacity: number;
    readonly activeUsers: number;
    readonly activeConnections: number;
    readonly totalRequests: number;
    readonly totalAdmissions: number;
    readonly totalRejections: number;
    readonly totalErrors: number;
    readonly utilization: number; // 0.0 to 1.0 (activeUsers / capacity)
    readonly lastHeartbeat: number;
}