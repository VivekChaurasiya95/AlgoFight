import { UserRepository, ProblemRepository } from "@algofight/database";
import { BattleRoomService } from "./battle-room.service";

export interface MatchmakingTicket {
    userId: string;
    rating: number;
    queuedAt: number;
    range: number;
}

export interface MatchResult {
    roomId: string;
    roomCode: string;
    player1Id: string;
    player2Id: string;
    problemId?: string;
}

export class MatchmakingService {
    private readonly queue: Map<string, MatchmakingTicket> = new Map();

    constructor(
        private readonly userRepository: UserRepository,
        private readonly battleRoomService: BattleRoomService,
        private readonly problemRepository?: ProblemRepository,
    ) { }

    async joinQueue(userId: string): Promise<MatchResult | null> {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        this.queue.delete(userId);

        const newTicket: MatchmakingTicket = {
            userId,
            rating: user.rating,
            queuedAt: Date.now(),
            range: 50,
        };

        const match = await this.tryMatch(newTicket);
        if (match) {
            return match;
        }

        this.queue.set(userId, newTicket);
        return null;
    }

    cancelQueue(userId: string): boolean {
        return this.queue.delete(userId);
    }

    isQueued(userId: string): boolean {
        return this.queue.has(userId);
    }

    private async tryMatch(newTicket: MatchmakingTicket): Promise<MatchResult | null> {
        const now = Date.now();

        for (const [candidateId, candidateTicket] of this.queue.entries()) {
            if (candidateId === newTicket.userId) continue;

            const candidateWaitSeconds = (now - candidateTicket.queuedAt) / 1000;
            const candidateWindow = candidateTicket.range + Math.floor(candidateWaitSeconds / 5) * 50;
            const ratingDiff = Math.abs(newTicket.rating - candidateTicket.rating);

            if (ratingDiff <= candidateWindow) {
                this.queue.delete(candidateId);
                this.queue.delete(newTicket.userId);

                // Auto-create 1v1 Room
                const room = await this.battleRoomService.createRoom({
                    hostId: candidateId,
                    maxPlayers: 2,
                    timeLimitMinutes: 15,
                });

                // Auto-join 2nd player and auto-ready both
                await this.battleRoomService.joinRoom(room.id, newTicket.userId);
                await this.battleRoomService.setPlayerReady(room.id, newTicket.userId, true);

                return {
                    roomId: room.id,
                    roomCode: room.roomCode,
                    player1Id: candidateId,
                    player2Id: newTicket.userId,
                };
            }
        }

        return null;
    }
}
