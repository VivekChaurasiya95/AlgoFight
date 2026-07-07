export interface BattleRoomEntity {
    id: string;
    hostid: string;
    maxPlayers: number;
    ParticipantIds: string[];
    status: "WAITING" | "READY" | "RUNNING" | "FINISHED";
    createdAt: Date;

}