import { BattleRoomEntity } from "../entities/battle-room.entity";

export interface BattleRoomRepository {

    createRoom(
        room: BattleRoomEntity,
    ): Promise<BattleRoomEntity>;

    getroomById(
        roomId: string,
    ): Promise<BattleRoomEntity | null>;

    joinRoom(
        roomId: string,
        userId: string,
    ): Promise<void>;

    leaveRoom(
        roomId: string,
        userId: string,
    ): Promise<void>;

    deleteRoom(
        roomId: string,
    ): Promise<void>;
}