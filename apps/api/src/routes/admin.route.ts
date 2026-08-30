import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AdminController } from "../controllers/admin.controller";
import { config } from "@algofight/config";

const controller = new AdminController();
const ADMIN_SECRET = config.adminSecretKey || process.env.ADMIN_SECRET_KEY;

// Auth Hook to enforce SuperAdmin Clearance
const verifyAdminAccess = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminKey = request.headers["x-admin-key"];
    if (adminKey !== ADMIN_SECRET) {
        return reply.status(403).send({
            error: "ACCESS_DENIED",
            message: "Level 5 SuperAdmin Clearance Required. Invalid or missing admin key.",
        });
    }
};

export async function adminRoutes(app: FastifyInstance) {
    // 1. Verify Passkey Endpoint (used by frontend login gate)
    app.post("/admin/auth/verify", async (request, reply) => {
        const { key } = (request.body as any) || {};
        if (key === ADMIN_SECRET) {
            return { success: true, message: "SuperAdmin clearance granted." };
        }
        return reply.status(401).send({ success: false, message: "Invalid SuperAdmin Passkey." });
    });

    // 2. Protected Telemetry & Master Metrics
    app.get("/admin/metrics", { preHandler: [verifyAdminAccess] }, async () => {
        return controller.getSystemMetrics();
    });

    // 3. Protected User & Institutional Code Registry
    app.get("/admin/users", { preHandler: [verifyAdminAccess] }, async (request) => {
        const query = request.query as any;
        return controller.listPlatformUsers({
            search: query.search,
            limit: query.limit ? parseInt(query.limit, 10) : 50,
        });
    });
    // 4. Proxy for Linux Telemetry Health (Bypasses Ad-Blockers)
    app.get("/admin/linux-status", async (request, reply) => {
        const rawTelemetryUrl = process.env.LINUX_TELEMETRY_URL || "http://localhost:8000";
        const linuxBaseUrl = rawTelemetryUrl.replace(/\/dashboard\/?$/, "").replace(/\/$/, "");
        
        try {
            const res = await fetch(`${linuxBaseUrl}/healthz`);
            if (res.ok) {
                return { status: "ONLINE" };
            }
            return reply.status(502).send({ status: "OFFLINE" });
        } catch (err) {
            return reply.status(502).send({ status: "OFFLINE" });
        }
    });
}
