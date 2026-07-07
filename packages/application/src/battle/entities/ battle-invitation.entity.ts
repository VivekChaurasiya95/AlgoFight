export interface BattleInvitationEntity {
    id: string;
    roomId: string;
    senderId: string;
    receiverId: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED"
    createdAt: Date;
}