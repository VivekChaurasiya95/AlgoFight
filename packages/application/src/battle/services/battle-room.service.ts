import { BattleRoomEntity } from "../entities/battle-room.entity";

export class BattleRoomService {
    async createRoom(
        hostId: string,
        maxPlayers: number,
    ): Promise<BattleRoomEntity> {
        throw new Error("Not Implemented");
    }

    async joinRoom(
        roomId: string, 
        userId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async leaveRoom(
        roomId: string,
        userId: string, 
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async readyPlayer(
        roomIdd: string, 
        userId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }

    async startBattle(
        roomId: string,
    ): Promise<void> {
        throw new Error("Not implemented");
    }
}