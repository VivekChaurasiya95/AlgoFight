import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { IntelController } from "../controllers/intel.controller";
import { config } from "@algofight/config";
import { auditService } from "../services/audit.service";
import { extractClientIp } from "../utils/ip.util";

const controller = new IntelController();
const ADMIN_SECRET = config.adminSecretKey || process.env.ADMIN_SECRET_KEY;

const verifyAdminAccess = async (request: FastifyRequest, reply: FastifyReply) => {
    const adminKey = request.headers["x-admin-key"];
    if (adminKey !== ADMIN_SECRET) {
        const clientIp = extractClientIp(request);
        auditService.recordEvent({
            category: "SECURITY",
            severity: "WARN",
            action: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
            actor: (request as any).user?.username || clientIp || "Unknown",
            ip: clientIp,
            method: request.method,
            details: `Failed admin access attempt on ${request.url}`,
        });

        return reply.status(403).send({
            error: "ACCESS_DENIED",
            message: "Level 5 SuperAdmin Clearance Required. Invalid or missing admin key.",
        });
    }

    if (!(request as any).user) {
        (request as any).user = {
            id: "super_admin",
            username: "SuperAdmin",
            role: "ADMIN",
        };
    }
};

export async function intelRoutes(app: FastifyInstance) {
    // ==========================================
    // Public Endpoints
    // ==========================================
    app.get("/intel", (req, rep) => controller.getFeed(req, rep));
    app.get("/intel/featured", (req, rep) => controller.getFeatured(req, rep));
    app.get("/intel/events", (req, rep) => controller.getEvents(req, rep));
    app.get("/intel/:slug", (req, rep) => controller.getBySlug(req, rep));

    // ==========================================
    // Admin Protected Endpoints
    // ==========================================
    app.get("/admin/intel", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminGetPosts(req, rep));
    app.post("/admin/intel", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminCreatePost(req, rep));
    app.patch("/admin/intel/:id", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminUpdatePost(req, rep));
    app.post("/admin/intel/:id/publish", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminPublishPost(req, rep));
    app.post("/admin/intel/:id/unpublish", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminUnpublishPost(req, rep));
    app.delete("/admin/intel/:id", { preHandler: [verifyAdminAccess] }, (req, rep) => controller.adminDeletePost(req, rep));
}
