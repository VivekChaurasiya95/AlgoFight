import {
    BattleRoomRepository,
    BattleRoomEntity,
    ProblemRepository,
} from "@algofight/database";
import { RoomCodeGenerator } from "../utils/room-code.generator";
import { RatingService, EloResult } from "./rating.service";

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
        return this.battleRoomRepository.setPlayerReady(roomId, userId, isReady);
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

        if (room.status !== "READY" && !room.participants.every((p) => p.isReady)) {
            throw new Error("Cannot start battle: All players must be ready");
        }

        const selectedProblemId = problemId || room.problemId;
        if (!selectedProblemId) {
            throw new Error("Cannot start battle: No problem assigned");
        }

        return this.battleRoomRepository.startBattle(roomId, selectedProblemId);
    }

    async finishBattle(roomId: string): Promise<{ room: BattleRoomEntity; eloResult?: EloResult }> {
        const room = await this.battleRoomRepository.getRoomById(roomId);
        if (!room) {
            throw new Error("Room not found");
        }

        // Rank participants: Solved first (fastest solve), then highest score
        const sorted = [...room.participants].sort((a, b) => {
            if (a.solvedAt && b.solvedAt) {
                return a.solvedAt.getTime() - b.solvedAt.getTime();
            }
            if (a.solvedAt) return -1;
            if (b.solvedAt) return 1;
            return b.score - a.score;
        });

        // Persist ranks (1st, 2nd, ...)
        for (let i = 0; i < sorted.length; i++) {
            await this.battleRoomRepository.updateParticipantRank(roomId, sorted[i].userId, i + 1);
        }

        let eloResult: EloResult | undefined;

        // Apply ELO if 1v1 battle and ratingService is available
        if (sorted.length === 2 && this.ratingService) {
            const [player1, player2] = sorted;
            if (player1.solvedAt || player1.score > player2.score) {
                eloResult = await this.ratingService.applyBattleResult(player1.userId, player2.userId);
            }
        }

        const finishedRoom = await this.battleRoomRepository.finishBattle(roomId);
        return { room: finishedRoom, eloResult };
    }
}
