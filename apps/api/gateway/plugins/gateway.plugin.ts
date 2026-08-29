// apps/api/src/plugins/gateway.plugin.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import crypto from "crypto";
import { gatewayManager } from "../manager/gateway.manager";
import { admissionController } from "../admission/admission.controller";
import { UserTrustContext } from "../session/trust-context";
import { GatewayRequest } from "../contracts/gateway";
import { ipJail } from "../policies/ip-jail";
import { logger } from "@algofight/logger";

declare module "fastify" {
    interface FastifyRequest {
        trustContext?: UserTrustContext;
        requestId: string;
    }
}

async function gatewayPlugin(app: FastifyInstance) {
    // Initialize the gateway manager and bootstrap default gateway
    await gatewayManager.initialize();

    app.decorateRequest("trustContext", undefined);
    app.decorateRequest("requestId", "");

    app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
        const start = performance.now();

        // 1. Assign / propagate Request & Correlation ID
        const incomingRequestId = (request.headers["x-request-id"] || request.headers["x-correlation-id"]) as string;
        const requestId = incomingRequestId || `req_${crypto.randomUUID()}`;
        request.requestId = requestId;
        reply.header("x-request-id", requestId);

        // 2. Extract reliable client IP (with trusted proxy support)
        const ip =
            (request.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
            request.socket.remoteAddress ||
            "127.0.0.1";

        // 3. Build GatewayRequest
        const gwRequest: GatewayRequest = {
            id: requestId,
            ip,
            method: request.method,
            url: request.url,
            path: request.routerPath || request.url.split("?")[0],
            headers: request.headers,
            contentLength: request.headers["content-length"] ? parseInt(request.headers["content-length"], 10) : undefined,
            contextId: (request.headers["x-context-id"] as string) || undefined,
            timestamp: Date.now(),
        };

        // 4. Resolve Target Logical Gateway (Context A, B, C...)
        const gateway = await gatewayManager.resolveGateway(gwRequest);

        // 5. Apply Request Filtering (Method, Size, State)
        const decision = await gateway.filter(gwRequest);
        if (decision.action === "REJECT") {
            return reply.status(decision.statusCode || 400).send({
                error: "GATEWAY_REQUEST_FILTERED",
                message: decision.reason,
            });
        }

        // 6. Cryptographic Authentication & Token Verification
        const identity = await gateway.authenticate(gwRequest);
        if (request.headers.authorization && !identity) {
            ipJail.recordFailedAttempt(ip, gateway.context.policy.maxFailedAuthBeforeJail, gateway.context.policy.jailDurationSeconds);
        }

        // 7. Admission Control (Capacity, Rate Limiting, Revocation, Priority Shedding)
        const admission = await admissionController.processAdmission(gateway, identity, gwRequest);
        if (!admission.admitted) {
            return reply.status(admission.statusCode).send({
                error: "GATEWAY_ADMISSION_REJECTED",
                message: admission.reason,
            });
        }

        // 8. Attach UserTrustContext & Legacy request.user
        if (admission.trustContext) {
            request.trustContext = admission.trustContext;
            request.user = {
                id: admission.trustContext.userId,
                email: admission.trustContext.email,
                username: admission.trustContext.username,
                role: admission.trustContext.role,
            };
            reply.header("x-gateway-id", admission.trustContext.gatewayId);
            reply.header("x-context-id", admission.trustContext.contextId);
        }

        const durationMs = (performance.now() - start).toFixed(2);
        reply.header("x-gateway-latency-ms", durationMs);
    });
}

export default fp(gatewayPlugin, { name: "gatewayPlugin" });
