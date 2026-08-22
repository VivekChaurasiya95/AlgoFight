// packages/events/src/handlers/metrics.handler.ts
import { DomainEvent } from "../contracts/domain-event";

const TELEMETRY_URL = process.env.TELEMETRY_SERVICE_URL || "http://localhost:8000";

export class MetricsHandler {
    async handle(event: DomainEvent): Promise<void> {
        const { eventName, payload } = event as any;

        try {
            if (eventName === "execution.completed" || eventName === "submission.completed") {
                await fetch(`${TELEMETRY_URL}/api/v1/telemetry/ingest`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        submission_id: payload.submissionId,
                        user_id: payload.userId || "unknown",
                        problem_id: payload.problemId,
                        language: payload.language || "cpp",
                        compile_time_ms: payload.compileTimeMs || 0,
                        execution_time_ms: payload.executionTimeMs || payload.durationMs || 0,
                        cpu_time_ms: payload.cpuTimeMs || 0,
                        peak_memory_kb: payload.peakMemoryKb || payload.memoryKb || 0,
                        verdict: payload.verdict || "ACCEPTED",
                        pass_count: payload.passCount || 0,
                        total_testcases: payload.totalTestcases || 0,
                    }),
                });
            } else if (eventName === "battle.finished") {
                await fetch(`${TELEMETRY_URL}/api/v1/telemetry/battle`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
        } catch (err) {
            // Non-blocking error handling
        }
    }
}
