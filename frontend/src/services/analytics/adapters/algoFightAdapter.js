// frontend/src/services/analytics/adapters/algoFightAdapter.js
import { toApiUrl } from "../../api.js";

export class AlgoFightAdapter {
    /**
     * Send a batch of canonical events to AlgoFight API
     */
    static async sendBatch(events) {
        if (!events || events.length === 0) return;

        const url = toApiUrl("/api/analytics/batch");
        const body = JSON.stringify(events);

        try {
            // Use fetch with keepalive
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                keepalive: true,
            });
        } catch (err) {
            // Fail-safe non-blocking telemetry
        }
    }

    /**
     * Send immediate beacon (used during visibilitychange/pagehide)
     */
    static sendBeacon(events) {
        if (!events || events.length === 0) return false;

        const url = toApiUrl("/api/analytics/batch");
        const body = JSON.stringify(events);

        try {
            if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                // Using text/plain is CORS-safelisted and avoids OPTIONS preflight roundtrips
                const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
                return navigator.sendBeacon(url, blob);
            }
        } catch {
            // Fall-through to fetch
        }

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
            keepalive: true,
        }).catch(() => {});

        return true;
    }
}
