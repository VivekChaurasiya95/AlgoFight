import crypto from "crypto";
import { TrafficTier } from "../admission/admission-policy";

export interface UserTrustContext {
    readonly userId: string;
    readonly sessionId: string | null;
    readonly gatewayId: string;
    readonly contextId: string;
    readonly issuedAt: number;
    readonly expiresAt: number;
    readonly role: "ADMIN" | "USER";
    readonly email?: string;
    readonly username?: string;
    readonly platformCode?: string;
    readonly institutionName?: string;
    readonly assignedTier: TrafficTier;
    readonly signature?: string;
}

const GATEWAY_SECRET = process.env.GATEWAY_CLUSTER_SECRET || "algofight-internal-gateway-secret-key-change-in-prod";

export class TrustContextSigner {
    public static sign(context: Omit<UserTrustContext, "signature">): string {
        const payload = `${context.userId}:${context.sessionId}:${context.gatewayId}:${context.contextId}:${context.issuedAt}:${context.expiresAt}:${context.role}:${context.assignedTier}`;
        return crypto.createHmac("sha256", GATEWAY_SECRET).update(payload).digest("hex");
    }

    public static verify(context: UserTrustContext): boolean {
        if (!context.signature) return false;
        const now = Math.floor(Date.now() / 1000);
        if (context.expiresAt <= now) return false;

        const expected = this.sign(context);
        try {
            return crypto.timingSafeEqual(Buffer.from(context.signature, "hex"), Buffer.from(expected, "hex"));
        } catch {
            return false;
        }
    }
}
