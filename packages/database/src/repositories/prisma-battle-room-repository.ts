import { prisma } from "../client/prisma";
import { BattleRoomRepository, CreateBattleRoomInput } from "../contracts/battle-room.repository";
import { BattleRoomEntity } from "../entities/battle-room.entity";

export class PrismaBattleRoomRepository implements BattleRoomRepository {
    private mapToEntity(room: any): BattleRoomEntity {
        return {
            id: room.id,
            roomCode: room.roomCode,
            hostId: room.hostId,
            maxPlayers: room.maxPlayers,
            status: room.status,
            problemId: room.problemId,
            timeLimitMinutes: room.timeLimitMinutes,
            startedAt: room.startedAt,
            endedAt: room.endedAt,
            createdAt: room.createdAt,
            participants: (room.participants || []).map((p: any) => ({
                userId: p.userId,
                roomId: p.roomId,
                joinedAt: p.joinedAt,
                isReady: p.isReady,
                score: p.score,
                rank: p.rank,
                solvedAt: p.solvedAt,
            })),
        };
    }

    async createRoom(input: CreateBattleRoomInput): Promise<BattleRoomEntity> {
        const room = await prisma.$transaction(async (tx) => {
            const created = await tx.battleRoom.create({
                data: {
                    roomCode: input.roomCode,
                    hostId: input.hostId,
                    maxPlayers: input.maxPlayers ?? 2,
                    timeLimitMinutes: input.timeLimitMinutes ?? 15,
                    problemId: input.problemId,
                    status: "WAITING",
                },
            });

            // Automatically add host as the first participant
            await tx.battleParticipant.create({
                data: {
                    roomId: created.id,
                    userId: input.hostId,
                    isReady: true, // Host is ready by default
                },
            });

            return tx.battleRoom.findUniqueOrThrow({
                where: { id: created.id },
                include: { participants: true },
            });
        });

        return this.mapToEntity(room);
    }

    async getRoomById(roomId: string): Promise<BattleRoomEntity | null> {
        const room = await prisma.battleRoom.findUnique({
            where: { id: roomId },
            include: { participants: true },
        });
        return room ? this.mapToEntity(room) : null;
    }

    async getRoomByCode(roomCode: string): Promise<BattleRoomEntity | null> {
        const room = await prisma.battleRoom.findUnique({
            where: { roomCode },
            include: { participants: true },
        });
        return room ? this.mapToEntity(room) : null;
    }

    async joinRoom(roomId: string, userId: string): Promise<BattleRoomEntity> {
        const room = await prisma.$transaction(async (tx) => {
            const targetRoom = await tx.battleRoom.findUniqueOrThrow({
                where: { id: roomId },
                include: { participants: true },
            });

            if (targetRoom.status !== "WAITING") {
                throw new Error("Cannot join battle room: Battle is not in waiting state");
            }

            if (targetRoom.participants.length >= targetRoom.maxPlayers) {
                throw new Error("Cannot join battle room: Room is full");
            }

            const alreadyJoined = targetRoom.participants.some((p) => p.userId === userId);
            if (!alreadyJoined) {
                await tx.battleParticipant.create({
                    data: {
                        roomId,
                        userId,
                        isReady: false,
                    },
                });
            }

            return tx.battleRoom.findUniqueOrThrow({
                where: { id: roomId },
                include: { participants: true },
            });
        });

        return this.mapToEntity(room);
    }

    async leaveRoom(roomId: string, userId: string): Promise<{ wasHost: boolean; remainingCount: number }> {
        return prisma.$transaction(async (tx) => {
            const room = await tx.battleRoom.findUniqueOrThrow({
                where: { id: roomId },
                include: { participants: true },
            });

            const wasHost = room.hostId === userId;

            await tx.battleParticipant.deleteMany({
                where: {
                    roomId,
                    userId,
                },
            });

            const remaining = await tx.battleParticipant.findMany({
                where: { roomId },
            });

            if (remaining.length === 0 || wasHost) {
                // If host leaves or room is empty, cancel room
                await tx.battleRoom.update({
                    where: { id: roomId },
                    data: { status: "CANCELLED" },
                });
            }

            return {
                wasHost,
                remainingCount: remaining.length,
            };
        });
    }

    async setPlayerReady(roomId: string, userId: string, isReady: boolean): Promise<BattleRoomEntity> {
        const room = await prisma.$transaction(async (tx) => {
            await tx.battleParticipant.update({
                where: {
                    roomId_userId: {
                        roomId,
                        userId,
                    },
                },
                data: { isReady },
            });

            return tx.battleRoom.findUniqueOrThrow({
                where: { id: roomId },
                include: { participants: true },
            });
        });

        return this.mapToEntity(room);
    }

    async startBattle(roomId: string, problemId: string): Promise<BattleRoomEntity> {
        const room = await prisma.battleRoom.update({
            where: { id: roomId },
            data: {
                status: "RUNNING",
                problemId,
                startedAt: new Date(),
            },
            include: { participants: true },
        });

        return this.mapToEntity(room);
    }

    async finishBattle(roomId: string): Promise<BattleRoomEntity> {
        const room = await prisma.battleRoom.update({
            where: { id: roomId },
            data: {
                status: "FINISHED",
                endedAt: new Date(),
            },
            include: { participants: true },
        });

        return this.mapToEntity(room);
    }

    async recordParticipantScore(
        roomId: string,
        userId: string,
        score: number,
        isSolved: boolean
    ): Promise<void> {
        await prisma.battleParticipant.update({
            where: {
                roomId_userId: {
                    roomId,
                    userId,
                },
            },
            data: {
                score,
                solvedAt: isSolved ? new Date() : undefined,
            },
        });
    }
}
