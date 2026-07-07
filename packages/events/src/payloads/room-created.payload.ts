export interface RoomCreatedPayload {
    roomId: string;
    hostId: string;
    maxPlayers: number;
    createdAt: Date;
}