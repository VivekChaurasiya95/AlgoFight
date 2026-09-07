// apps/api/src/routes/analytics.route.ts
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { analyticsService } from "../services/analytics.service";
import { auditService } from "../services/audit.service";
import { extractClientIp } from "../utils/ip.util";
import { config } from "@algofight/config";

const ADMIN_SECRET = config.adminSecretKey || process.env.ADMIN_SECRET_KEY;

// Strict SuperAdmin security gate
const verifyAdminAccess = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminKey = request.headers["x-admin-key"];
    if (!adminKey || adminKey !== ADMIN_SECRET) {
        const clientIp = extractClientIp(request);
        auditService.recordEvent({
            category: "SECURITY",
            severity: "WARN",
            action: "UNAUTHORIZED_ANALYTICS_ACCESS",
            actor: clientIp,
            ip: clientIp,
            method: request.method,
            details: `Unauthorized attempt to query analytics dashboard from ${clientIp}`,
        });

        return reply.status(403).send({
            error: "ACCESS_DENIED",
            message: "Level 5 SuperAdmin Clearance Required to view platform analytics.",
        });
    }
};

// Strict input validation schema for tracking beacons to prevent payload injection
const TrackBeaconSchema = z.object({
    sessionId: z.string().max(80).optional(),
    path: z.string().max(120).default("/"),
    title: z.string().max(100).optional(),
    durationOnPrevious: z.number().min(0).max(86400).optional(),
    referrer: z.string().max(250).optional(),
    username: z.string().max(50).optional(),
});

export async function analyticsRoutes(app: FastifyInstance) {
    /**
     * 1. Public Ingestion Endpoint: POST /analytics/track
     * Receives client-side route transitions and heartbeat pings.
     * Rate-limited, payload-capped, isolated from core application failures.
     */
    app.post(
        "/analytics/track",
        {
            config: {
                rateLimit: {
                    max: 300,
                    timeWindow: "1 minute",
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                let rawPayload = request.body;
                if (typeof rawPayload === "string") {
                    try {
                        rawPayload = JSON.parse(rawPayload);
                    } catch {
                        rawPayload = {};
                    }
                }
                const parseResult = TrackBeaconSchema.safeParse(rawPayload || {});
                if (!parseResult.success) {
                    return reply.status(200).send({ ok: false }); // Silent safe return
                }

                const data = parseResult.data;
                const clientIp = extractClientIp(request);
                const userObj = (request as any).user || (data.username ? { username: data.username } : undefined);

                analyticsService.recordPageVisit({
                    sessionId: data.sessionId || `sess_${clientIp}`,
                    ip: clientIp,
                    path: data.path,
                    title: data.title,
                    durationOnPrevious: data.durationOnPrevious,
                    referrer: data.referrer,
                    userAgent: request.headers["user-agent"],
                    user: userObj,
                });

                // Record audit log for significant surfing milestones (when meaningful duration spent)
                if (data.durationOnPrevious && data.durationOnPrevious > 5) {
                    auditService.recordEvent({
                        category: "PAGE_VIEW",
                        severity: "INFO",
                        action: "PAGE_SURF",
                        actor: userObj?.username || "Guest Combatant",
                        ip: clientIp,
                        method: "GET",
                        details: `Surfed ${data.path} for ${Math.round(data.durationOnPrevious)}s`,
                        metadata: { path: data.path, duration: data.durationOnPrevious },
                    });
                }

                return reply.send({ success: true });
            } catch {
                // Non-blocking telemetry isolation
                return reply.send({ success: true });
            }
        }
    );

    /**
     * 1b. Public Batch Ingestion Endpoint: POST /analytics/batch
     * Receives batched canonical events from the Unified Analytics Core.
     * Prevents single-request-per-event network spam and deduplicates by eventId.
     */
    app.post(
        "/analytics/batch",
        {
            config: {
                rateLimit: {
                    max: 120,
                    timeWindow: "1 minute",
                },
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                let rawPayload: any = request.body;
                if (typeof rawPayload === "string") {
                    try {
                        rawPayload = JSON.parse(rawPayload);
                    } catch {
                        rawPayload = [];
                    }
                }

                const events: any[] = Array.isArray(rawPayload) ? rawPayload : ((rawPayload as any)?.events || []);
                const clientIp = extractClientIp(request);

                for (const ev of events) {
                    if (!ev || typeof ev !== "object") continue;
                    if (ev.eventName === "page_view" || ev.event_name === "page_view" || ev.path) {
                        analyticsService.recordPageVisit({
                            sessionId: ev.sessionId || ev.session_id || `sess_${clientIp}`,
                            ip: clientIp,
                            path: ev.path || ev.page?.path || "/",
                            title: ev.title || ev.page?.title || "",
                            durationOnPrevious: ev.durationOnPrevious || ev.properties?.duration || 0,
                            referrer: ev.referrer || "",
                            userAgent: request.headers["user-agent"],
                            user: ev.user,
                        });
                    }
                }

                return reply.send({ success: true, processed: events.length });
            } catch {
                return reply.send({ success: true });
            }
        }
    );

    /**
     * 2. Protected Analytics Snapshot: GET /admin/analytics
     * Returns full statistical, logical, visual metrics payload for Control Hub.
     */
    app.get(
        "/admin/analytics",
        { preHandler: [verifyAdminAccess] },
        async (_request: FastifyRequest, reply: FastifyReply) => {
            const snapshot = analyticsService.getSnapshot();
            return reply.send(snapshot);
        }
    );
}
