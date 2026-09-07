// frontend/src/services/analytics.js
import { toApiUrl } from "./api.js";

class SurfingAnalyticsTracker {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        this.currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
        this.pageStartTime = Date.now();
        this.heartbeatTimer = null;
        this.initialized = false;
    }

    getOrCreateSessionId() {
        if (typeof window === "undefined") return "ssr_session";
        try {
            let sId = sessionStorage.getItem("af_session_id");
            if (!sId) {
                sId = `af_sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                sessionStorage.setItem("af_session_id", sId);
            }
            return sId;
        } catch {
            return `af_sess_${Date.now()}`;
        }
    }

    init() {
        if (this.initialized || typeof window === "undefined") return;
        this.initialized = true;

        // Periodic heartbeat every 30 seconds while page is visible
        this.heartbeatTimer = setInterval(() => {
            if (document.visibilityState === "visible") {
                this.sendHeartbeat();
            }
        }, 30000);

        // Track page hide / window unload to record accurate dwell time
        const handleUnload = () => {
            const dwellSeconds = Math.max(1, Math.round((Date.now() - this.pageStartTime) / 1000));
            this.sendBeacon({
                path: this.currentPath,
                durationOnPrevious: dwellSeconds,
            });
        };

        window.addEventListener("pagehide", handleUnload);
        window.addEventListener("beforeunload", handleUnload);
    }

    /**
     * Record route navigation transition
     */
    trackPageView(newPath, title) {
        if (!newPath || typeof window === "undefined") return;

        const now = Date.now();
        const durationOnPrevious = Math.max(0, Math.round((now - this.pageStartTime) / 1000));
        const previousPath = this.currentPath;

        this.currentPath = newPath;
        this.pageStartTime = now;

        this.sendBeacon({
            path: newPath,
            title: title || document.title,
            durationOnPrevious: previousPath !== newPath ? durationOnPrevious : 0,
            referrer: document.referrer || previousPath,
        });
    }

    /**
     * Periodic live heartbeat
     */
    sendHeartbeat() {
        const dwellSeconds = Math.max(0, Math.round((Date.now() - this.pageStartTime) / 1000));
        this.sendBeacon({
            path: this.currentPath,
            title: document.title,
            durationOnPrevious: dwellSeconds,
        });
    }

    /**
     * Non-blocking beacon transmission using navigator.sendBeacon or fetch with keepalive
     */
    sendBeacon(payload) {
        try {
            const url = toApiUrl("/api/analytics/track");
            const body = JSON.stringify({
                sessionId: this.sessionId,
                path: payload.path || this.currentPath,
                title: payload.title || (typeof document !== "undefined" ? document.title : ""),
                durationOnPrevious: payload.durationOnPrevious || 0,
                referrer: payload.referrer || "",
            });

            // Try navigator.sendBeacon first (safest and fastest during unload/transitions)
            // Using text/plain makes this a CORS-safelisted simple request, preventing OPTIONS preflight spam
            if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
                const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
                const sent = navigator.sendBeacon(url, blob);
                if (sent) return;
            }

            // Fallback to fetch with keepalive
            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
                keepalive: true,
            }).catch(() => {
                // Non-blocking telemetry
            });
        } catch {
            // Fail-safe
        }
    }

    destroy() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.initialized = false;
    }
}

export const surfingTracker = new SurfingAnalyticsTracker();
