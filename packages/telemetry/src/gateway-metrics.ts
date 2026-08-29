// packages/telemetry/src/gateway-metrics.ts

export interface GatewayMetricPoint {
    name: string;
    value: number;
    labels?: Record<string, string>;
    timestamp: number;
}

export class GatewayTelemetryCollector {
    // Fixed-capacity circular ring buffer to prevent unbounded RAM growth / OOM crashes
    private static readonly MAX_BUFFER_SIZE = 2000;
    private readonly metrics: GatewayMetricPoint[] = [];

    // Aggregated Counters for permanent high-speed counters
    public totalRequests = 0;
    public totalAdmissions = 0;
    public totalRejections = 0;
    public totalErrors = 0;

    private pushMetric(point: GatewayMetricPoint): void {
        if (this.metrics.length >= GatewayTelemetryCollector.MAX_BUFFER_SIZE) {
            this.metrics.shift(); // Evict oldest point to keep memory strictly constant
        }
        this.metrics.push(point);
    }

    // 1. Request Counter
    public recordRequest(gatewayId: string, contextId: string, method: string, status: number): void {
        this.totalRequests++;
        this.pushMetric({
            name: "gateway_requests_total",
            value: 1,
            labels: {
                gateway_id: gatewayId,
                context_id: contextId,
                method,
                status: String(status),
            },
            timestamp: Date.now(),
        });
    }

    // 2. Admission Counter
    public recordAdmission(gatewayId: string, contextId: string, tier: string): void {
        this.totalAdmissions++;
        this.pushMetric({
            name: "gateway_admissions_total",
            value: 1,
            labels: {
                gateway_id: gatewayId,
                context_id: contextId,
                tier,
            },
            timestamp: Date.now(),
        });
    }

    // 3. Rejection Counter
    public recordRejection(gatewayId: string, contextId: string, reason: string): void {
        this.totalRejections++;
        this.pushMetric({
            name: "gateway_rejections_total",
            value: 1,
            labels: {
                gateway_id: gatewayId,
                context_id: contextId,
                reason,
            },
            timestamp: Date.now(),
        });
    }

    // 4. Request Latency
    public recordLatency(gatewayId: string, durationMs: number): void {
        this.pushMetric({
            name: "gateway_request_duration_seconds",
            value: durationMs / 1000,
            labels: { gateway_id: gatewayId },
            timestamp: Date.now(),
        });
    }

    // 5. Lifecycle Transition Counter
    public recordLifecycleTransition(gatewayId: string, fromState: string, toState: string): void {
        this.pushMetric({
            name: "gateway_lifecycle_transitions_total",
            value: 1,
            labels: {
                gateway_id: gatewayId,
                from_state: fromState,
                to_state: toState,
            },
            timestamp: Date.now(),
        });
    }

    // 6. Gauge Snapshot: Users & Capacity
    public recordGauges(gatewayId: string, contextId: string, activeUsers: number, capacity: number, utilization: number): void {
        const now = Date.now();
        this.pushMetric({
            name: "gateway_active_users",
            value: activeUsers,
            labels: { gateway_id: gatewayId, context_id: contextId },
            timestamp: now,
        });
        this.pushMetric({
            name: "gateway_capacity",
            value: capacity,
            labels: { gateway_id: gatewayId, context_id: contextId },
            timestamp: now,
        });
        this.pushMetric({
            name: "gateway_utilization",
            value: utilization,
            labels: { gateway_id: gatewayId, context_id: contextId },
            timestamp: now,
        });
    }

    public getRecentMetrics(): GatewayMetricPoint[] {
        return [...this.metrics];
    }

    public clear(): void {
        this.metrics.length = 0;
    }
}

export const gatewayTelemetryCollector = new GatewayTelemetryCollector();
