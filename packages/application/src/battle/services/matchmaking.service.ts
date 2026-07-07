export class MatchmakingService {
    
    async findAutomaticMatch(
        userId: string,
    ): Promise<string | null> {
        throw new Error("Not implemented");
    }

    async sendBattleInvite(
        senderId: string, 
        receiverId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async acceptInvite(
        invitationId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async declineInvite(
        invitationId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async cancleSearch(
        userId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }
}