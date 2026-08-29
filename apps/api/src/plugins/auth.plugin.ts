// apps/api/src/plugins/auth.plugin.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { TrustContextSigner } from "../gateway/session/trust-context";

export interface AuthUser {
    id: string;
    email?: string;
    username?: string;
    role?: "ADMIN" | "USER";
}

declare module "fastify" {
    interface FastifyRequest {
        user?: AuthUser;
    }
}

async function authPlugin(app: FastifyInstance) {
    app.decorateRequest("user", undefined);

    app.addHook("preHandler", async (request: FastifyRequest) => {
        // If TrustContext is attached by Gateway, verify HMAC attestation
        if (request.trustContext) {
            const isValid = TrustContextSigner.verify(request.trustContext);
            if (!isValid) {
                request.user = undefined;
                return;
            }
            request.user = {
                id: request.trustContext.userId,
                email: request.trustContext.email,
                username: request.trustContext.username,
                role: request.trustContext.role,
            };
        }
    });
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !request.user.id || !request.trustContext) {
        return reply.status(401).send({
            error: "UNAUTHORIZED",
            message: "Valid Gateway admission and cryptographically verified Trust Context required.",
        });
    }
};

export const requireRole = (role: "ADMIN" | "USER") => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user || !request.user.id) {
            return reply.status(401).send({
                error: "UNAUTHORIZED",
                message: "Authentication required.",
            });
        }
        if (role === "ADMIN" && request.user.role !== "ADMIN") {
            const adminKey = request.headers["x-admin-key"];
            if (adminKey !== process.env.ADMIN_SECRET_KEY) {
                return reply.status(403).send({
                    error: "FORBIDDEN",
                    message: "Admin role or valid clearance required.",
                });
            }
        }
    };
};

export default fp(authPlugin, { name: "authPlugin" });
