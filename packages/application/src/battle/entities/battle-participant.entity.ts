export interface BattleParticipantEntity {
    userId: string;
    roomId: string;
    joinedAt: Date;
    isReady: boolean;
    score: number;
}