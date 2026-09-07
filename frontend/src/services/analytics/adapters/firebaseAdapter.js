// frontend/src/services/analytics/adapters/firebaseAdapter.js
/**
 * Firebase Analytics Adapter (Implementation Plan Specification Section 3 & 5)
 * Lazily loads Firebase Analytics only when product events occur, removing it from
 * the critical initial render path.
 */

let firebaseAnalyticsInstance = null;
let isInitializing = false;

async function getLazyFirebaseAnalytics() {
    if (firebaseAnalyticsInstance) return firebaseAnalyticsInstance;
    if (typeof window === "undefined") return null;

    if (isInitializing) {
        // Wait briefly if initialization in-flight
        await new Promise((resolve) => setTimeout(resolve, 50));
        return firebaseAnalyticsInstance;
    }

    isInitializing = true;
    try {
        const { getAnalytics, logEvent } = await import("firebase/analytics");
        const { app } = await import("../../../firebaseConfig.js");
        if (app) {
            firebaseAnalyticsInstance = {
                analytics: getAnalytics(app),
                logEvent,
            };
        }
    } catch {
        // Firebase analytics optional / blocked by ad-blocker
    } finally {
        isInitializing = false;
    }

    return firebaseAnalyticsInstance;
}

export class FirebaseAdapter {
    /**
     * Send event to Firebase only if product-relevant
     */
    static async sendEvent(canonicalEvent) {
        // Filter: only product-level milestone events reach Firebase
        const allowedFirebaseEvents = new Set([
            "page_view",
            "login",
            "sign_up",
            "signup_started",
            "signup_completed",
            "cta_clicked",
            "feature_viewed",
        ]);

        const normalizedName = canonicalEvent.event_name.replace(/-/g, "_");
        if (!allowedFirebaseEvents.has(normalizedName)) {
            return;
        }

        try {
            const instance = await getLazyFirebaseAnalytics();
            if (instance && instance.analytics && instance.logEvent) {
                instance.logEvent(instance.analytics, normalizedName, {
                    page_path: canonicalEvent.page.path,
                    page_title: canonicalEvent.page.title,
                    ...canonicalEvent.properties,
                });
            }
        } catch {
            // Silently swallow third-party analytics errors
        }
    }
}
