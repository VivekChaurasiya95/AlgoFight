export interface BattleStartedPayload {
    battleId: string;
    roomId: string;
    startedAt: Date;
    participantIds: string[];
}