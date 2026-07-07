export class InvitationService {
    async createInvitation(
        senderId: string,
        receiverId: string, 
        roomId: string,
    ): Promise<void> {
        throw new Error("Not implement");
    }
 
    async acceptInvitation(
        invitaionId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async rejectInvitation(
        invitaionId: string,
    ): Promise<void> {
        throw new Error("Mot implemented");
    }

    async cancleInvitation(
        invitationId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }
}