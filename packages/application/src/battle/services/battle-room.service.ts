import {
    BattleRoomRepository,
    BattleRoomEntity,
    ProblemRepository,
} from "@algofight/database";
import { RoomCodeGenerator } from "../utils/room-code.generator";
import { RatingService } from "./rating.service";

export interface CreateRoomDto {
    hostId: string;
    maxPlayers?: number;
    timeLimitMinutes?: number;
    problemId?: string;
}

export class BattleRoomService {
    constructor(
        private readonly battleRoomRepository: BattleRoomRepository,
        private readonly problemRepository?: ProblemRepository,
        private readonly ratingService?: RatingService,
    ) { }

    async createRoom(dto: CreateRoomDto): Promise<BattleRoomEntity> {
        const roomCode = RoomCodeGenerator.generate();

        return this.battleRoomRepository.createRoom({
            hostId: dto.hostId,
            roomCode,
            maxPlayers: dto.maxPlayers ?? 2,
            timeLimitMinutes: dto.timeLimitMinutes ?? 15,
            problemId: dto.problemId,
            status: "WAITING",
        });
    }

    async getRoom(roomIdOrCode: string): Promise<BattleRoomEntity> {
        // Support lookup by UUID or by 6-character room code
        const room = roomIdOrCode.startsWith("BTL-")
            ? await this.battleRoomRepository.getRoomByCode(roomIdOrCode)
            : await this.battleRoomRepository.getRoomById(roomIdOrCode);

        if (!room) {
            throw new Error(`Battle room not found: ${roomIdOrCode}`);
        }
        return room;
    }

    async joinRoom(roomIdOrCode: string, userId: string): Promise<BattleRoomEntity> {
        const room = await this.getRoom(roomIdOrCode);

        if (room.status !== "WAITING") {
            throw new Error("Cannot join: Battle has already started or finished");
        }

        if (room.participants.length >= room.maxPlayers) {
            throw new Error("Cannot join: Room is at maximum capacity");
        }

        return this.battleRoomRepository.joinRoom(room.id, userId);
    }

    async leaveRoom(roomId: string, userId: string): Promise<{ wasHost: boolean; remainingCount: number }> {
        return this.battleRoomRepository.leaveRoom(roomId, userId);
    }

    async setPlayerReady(roomId: string, userId: string, isReady: boolean): Promise<BattleRoomEntity> {
        const updatedRoom = await this.battleRoomRepository.setPlayerReady(roomId, userId, isReady);

        // Check if all participants are ready and at least 2 players exist
        const allReady =
            updatedRoom.participants.length >= 2 &&
            updatedRoom.participants.every((p) => p.isReady);

        // Return updated room (WebSocket layer can broadcast "READY" countdown if allReady is true)
        return updatedRoom;
    }

    async startBattle(roomId: string, hostId: string, problemId?: string): Promise<BattleRoomEntity> {
        const room = await this.battleRoomRepository.getRoomById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        if (room.hostId !== hostId) {
            throw new Error("Only the room host can start the battle");
        }

        if (room.participants.length < 2) {
            throw new Error("Cannot start battle with fewer than 2 participants");
        }

        const selectedProblemId = problemId || room.problemId;
        if (!selectedProblemId) {
            throw new Error("Cannot start battle: No problem assigned");
        }

        return this.battleRoomRepository.startBattle(roomId, selectedProblemId);
    }

    async finishBattle(roomId: string): Promise<BattleRoomEntity> {
        return this.battleRoomRepository.finishBattle(roomId);
    }
}
