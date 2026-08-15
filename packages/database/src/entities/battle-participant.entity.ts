export interface BattleParticipantEntity {
    userId: string;
    roomId: string;
    joinedAt: Date;
    isReady: boolean;
    score: number;
    rank: number | null;
    solvedAt: Date | null;
}