// apps/api/src/gateway/session/user-session.ts
import crypto from "crypto";

export interface UserSession {
    readonly sessionId: string;
    readonly userId: string;
    readonly gatewayId: string;
    readonly contextId: string;
    readonly createdAt: number;
    readonly lastActiveAt: number;
    readonly ip: string;
    readonly userAgent?: string;
}

export class UserSessionStore {
    private readonly sessions = new Map<string, UserSession>(); // sessionId -> UserSession
    private readonly userToSession = new Map<string, string>(); // userId -> sessionId

    public createSession(params: { userId: string; gatewayId: string; contextId: string; ip: string; userAgent?: string }): UserSession {
        const sessionId = `sess_${crypto.randomBytes(16).toString("hex")}`;
        const now = Date.now();
        const session: UserSession = {
            sessionId,
            userId: params.userId,
            gatewayId: params.gatewayId,
            contextId: params.contextId,
            createdAt: now,
            lastActiveAt: now,
            ip: params.ip,
            userAgent: params.userAgent,
        };

        this.sessions.set(sessionId, session);
        this.userToSession.set(params.userId, sessionId);
        return session;
    }

    public getSession(sessionId: string): UserSession | null {
        const s = this.sessions.get(sessionId);
        if (!s) return null;
        return s;
    }

    public getSessionByUserId(userId: string): UserSession | null {
        const sessionId = this.userToSession.get(userId);
        return sessionId ? this.getSession(sessionId) : null;
    }

    public touchSession(sessionId: string): void {
        const s = this.sessions.get(sessionId);
        if (s) {
            (s as any).lastActiveAt = Date.now();
        }
    }

    public invalidateSession(sessionId: string): void {
        const s = this.sessions.get(sessionId);
        if (s) {
            this.userToSession.delete(s.userId);
            this.sessions.delete(sessionId);
        }
    }
}

export const userSessionStore = new UserSessionStore();
