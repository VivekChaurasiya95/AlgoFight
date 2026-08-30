import { createRedisClient } from "../../utils/redis.client";
import { logger } from "@algofight/logger";

export class InvitationService {
    private readonly redis = createRedisClient();

    async createInvitation(
        senderId: string,
        receiverId: string, 
        roomId: string,
    ): Promise<{ id: string; senderId: string; receiverId: string; roomId: string }> {
        const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const invitation = { id, senderId, receiverId, roomId, status: "PENDING", createdAt: Date.now() };
        await this.redis.set(`invitation:${id}`, JSON.stringify(invitation), "EX", 300);
        logger.info({ id, senderId, receiverId, roomId }, "Created battle invitation");
        return invitation;
    }
 
    async acceptInvitation(invitationId: string): Promise<any | null> {
        const raw = await this.redis.get(`invitation:${invitationId}`);
        if (!raw) return null;
        const inv = JSON.parse(raw);
        inv.status = "ACCEPTED";
        await this.redis.del(`invitation:${invitationId}`);
        return inv;
    }

    async rejectInvitation(invitationId: string): Promise<void> {
        await this.redis.del(`invitation:${invitationId}`);
    }

    async cancelInvitation(invitationId: string): Promise<void> {
        await this.redis.del(`invitation:${invitationId}`);
    }
}