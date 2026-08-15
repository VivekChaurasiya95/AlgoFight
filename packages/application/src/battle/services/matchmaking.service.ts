import { UserRepository, ProblemRepository } from "@algofight/database";
import { BattleRoomService } from "./battle-room.service";

export interface MatchmakingTicket {
    userId: string;
    rating: number;
    queuedAt: number; // Date.now() timestamp
    range: number;    // Initial rating window, e.g. 50
}

export interface MatchResult {
    roomId: string;
    roomCode: string;
    player1Id: string;
    player2Id: string;
    problemId?: string;
}

export class MatchmakingService {
    // In-memory pool for V1 (fast, simple, can be Redis backed later)
    private readonly queue: Map<string, MatchmakingTicket> = new Map();

    constructor(
        private readonly userRepository: UserRepository,
        private readonly battleRoomService: BattleRoomService,
        private readonly problemRepository?: ProblemRepository
    ) { }

    /**
     * Add a player to the matchmaking queue based on their rating
     */
    async joinQueue(userId: string): Promise<MatchResult | null> {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        // Remove previous ticket if already in queue
        this.queue.delete(userId);

        const newTicket: MatchmakingTicket = {
            userId,
            rating: user.rating,
            queuedAt: Date.now(),
            range: 50,
        };

        // Try to immediately find an opponent among waiting players
        const match = await this.tryMatch(newTicket);
        if (match) {
            return match;
        }

        // If no match immediately, place player in the waiting pool
        this.queue.set(userId, newTicket);
        return null;
    }

    /**
     * Cancel search and leave queue
     */
    cancelQueue(userId: string): boolean {
        return this.queue.delete(userId);
    }

    /**
     * Check if a specific player is currently in the queue
     */
    isQueued(userId: string): boolean {
        return this.queue.has(userId);
    }

    /**
     * Tries to pair the player with a compatible opponent
     */
    private async tryMatch(newTicket: MatchmakingTicket): Promise<MatchResult | null> {
        const now = Date.now();

        for (const [candidateId, candidateTicket] of this.queue.entries()) {
            if (candidateId === newTicket.userId) continue;

            // Calculate dynamic expanding range based on time spent waiting
            const candidateWaitSeconds = (now - candidateTicket.queuedAt) / 1000;
            const candidateWindow = candidateTicket.range + Math.floor(candidateWaitSeconds / 5) * 50;

            const ratingDiff = Math.abs(newTicket.rating - candidateTicket.rating);

            // Match if rating difference is within the allowed window of both players
            if (ratingDiff <= candidateWindow) {
                // Remove both players from queue
                this.queue.delete(candidateId);
                this.queue.delete(newTicket.userId);

                // Auto-create a 1v1 Battle Room with the candidate as host
                const room = await this.battleRoomService.createRoom({
                    hostId: candidateId,
                    maxPlayers: 2,
                    timeLimitMinutes: 15,
                });

                // Join the 2nd player into the room
                await this.battleRoomService.joinRoom(room.id, newTicket.userId);

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
