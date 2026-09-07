// frontend/src/services/analytics/canonicalEvent.js
/**
 * Canonical Analytics Event Model (Implementation Plan Specification Section 4)
 * Guarantees consistent structure, unique event_id for deduplication, and priority routing.
 */

export const AnalyticsPriority = {
    CRITICAL: "CRITICAL", // Immediate send, bypass buffer (e.g. auth, security, major battle events)
    HIGH: "HIGH",         // Important milestones, short batch window (e.g. page_view, submission)
    NORMAL: "NORMAL",     // Standard interactions, buffered batching (e.g. clicks, features)
    LOW: "LOW",           // Passive telemetry, aggregated/sampled (e.g. hovers, UI scroll)
};

export const EventCategory = {
    PRODUCT: "PRODUCT",         // Routed to both Firebase & AlgoFight (page_view, signup, login)
    PLATFORM: "PLATFORM",       // Routed to AlgoFight (battle, submission, code execution)
    INFRASTRUCTURE: "INFRA",    // Handled by platform telemetry (no third-party)
};

function generateUUID() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function createCanonicalEvent(eventName, properties = {}, options = {}) {
    const now = Date.now();
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const currentTitle = typeof document !== "undefined" ? document.title : "";

    return {
        event_id: options.eventId || generateUUID(),
        event_name: eventName,
        timestamp: now,
        priority: options.priority || AnalyticsPriority.NORMAL,
        category: options.category || EventCategory.PRODUCT,
        session_id: options.sessionId || "",
        anonymous_id: options.anonymousId || "",
        user_id: options.userId || null,
        page: {
            path: properties.path || currentPath,
            title: properties.title || currentTitle,
            referrer: typeof document !== "undefined" ? document.referrer : "",
        },
        context: {
            environment: import.meta.env.MODE || "production",
            platform: "web",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        },
        properties: {
            ...properties,
        },
    };
}
