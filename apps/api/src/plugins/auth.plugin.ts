import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import crypto from "crypto";
import { logger } from "@algofight/logger";

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

// In-memory cache for Google Public Certificates
let cachedCertificates: Record<string, string> = {};
let certsExpiry = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
    const now = Date.now();
    if (now < certsExpiry && Object.keys(cachedCertificates).length > 0) {
        return cachedCertificates;
    }

    try {
        const res = await fetch(
            "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
            { signal: AbortSignal.timeout(3000) }
        );
        if (res.ok) {
            cachedCertificates = await res.json();
            // Cache for 6 hours
            certsExpiry = now + 6 * 60 * 60 * 1000;
        }
    } catch (err: any) {
        logger.warn({ error: err.message }, "Failed to refresh Google Firebase public certificates");
    }

    return cachedCertificates;
}

function verifyJwtSignature(token: string, publicCerts: Record<string, string>): any | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf-8"));
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));

    // Verify Algorithm
    if (header.alg !== "RS256" || !header.kid) {
        return null;
    }

    // Verify Expiration & Issued Time
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
        return null;
    }

    const cert = publicCerts[header.kid];
    if (!cert) return null;

    // Cryptographic signature verification using Node.js crypto
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${headerB64}.${payloadB64}`);
    const signature = Buffer.from(signatureB64, "base64url");

    const isValid = verifier.verify(cert, signature);
    return isValid ? payload : null;
}

async function authPlugin(app: FastifyInstance) {
    app.decorateRequest("user", undefined);

    app.addHook("preHandler", async (request: FastifyRequest) => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return;
        }

        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) return;

        try {
            const publicKeys = await getGooglePublicKeys();
            const verifiedPayload = verifyJwtSignature(token, publicKeys);

            if (verifiedPayload) {
                const userId = verifiedPayload.user_id || verifiedPayload.uid || verifiedPayload.sub;
                request.user = {
                    id: String(userId),
                    email: verifiedPayload.email,
                    username: verifiedPayload.name || verifiedPayload.email?.split("@")[0],
                    role: verifiedPayload.admin || verifiedPayload.role === "ADMIN" ? "ADMIN" : "USER",
                };
                return;
            }

            // Fallback for local development if testing with synthetic tokens
            if (process.env.NODE_ENV !== "production") {
                const parts = token.split(".");
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
                    const userId = payload.user_id || payload.uid || payload.sub || payload.id;
                    if (userId) {
                        request.user = {
                            id: String(userId),
                            email: payload.email,
                            username: payload.name || payload.email?.split("@")[0],
                            role: payload.role === "ADMIN" ? "ADMIN" : "USER",
                        };
                    }
                }
            }
        } catch (error: any) {
            logger.debug({ error: error.message }, "Auth token validation failure");
        }
    });
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !request.user.id) {
        return reply.status(401).send({
            error: "UNAUTHORIZED",
            message: "Cryptographically verified authentication required to perform this action.",
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