// apps/api/src/gateway/session/revocation-store.ts

export class RevocationStore {
    private readonly revokedTokens = new Set<string>();
    private readonly revokedUsers = new Map<string, number>(); // userId -> revokeAllBeforeTimestamp
    private readonly revokedSessions = new Set<string>();

    public revokeToken(token: string): void {
        this.revokedTokens.add(token);
    }

    public revokeUser(userId: string): void {
        this.revokedUsers.set(userId, Date.now());
    }

    public revokeSession(sessionId: string): void {
        this.revokedSessions.add(sessionId);
    }

    public isRevoked(params: { token?: string; userId?: string; sessionId?: string; issuedAt?: number }): boolean {
        if (params.token && this.revokedTokens.has(params.token)) {
            return true;
        }
        if (params.sessionId && this.revokedSessions.has(params.sessionId)) {
            return true;
        }
        if (params.userId && this.revokedUsers.has(params.userId)) {
            const revokedAt = this.revokedUsers.get(params.userId)!;
            const tokenIssued = params.issuedAt ? params.issuedAt * 1000 : 0;
            if (tokenIssued <= revokedAt) {
                return true;
            }
        }
        return false;
    }
}

export const revocationStore = new RevocationStore();
