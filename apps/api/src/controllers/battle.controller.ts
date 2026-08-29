import { BattleRoomService, RatingService } from "@algofight/application";
import {
    PrismaBattleRoomRepository,
    PrismaProblemRepository,
    PrismaUserRepository,
} from "@algofight/database";

export class BattleController {
    private readonly battleRoomService: BattleRoomService;
    private readonly ratingService: RatingService;
    private readonly userRepository: PrismaUserRepository;

    constructor() {
        const battleRoomRepository = new PrismaBattleRoomRepository();
        const problemRepository = new PrismaProblemRepository();
        const userRepository = new PrismaUserRepository();

        this.userRepository = userRepository;
        this.ratingService = new RatingService(userRepository);
        this.battleRoomService = new BattleRoomService(
            battleRoomRepository,
            problemRepository,
            this.ratingService
        );
    }

    private async resolveUserId(identifier: string): Promise<string> {
        const user = await this.userRepository.getUserById(identifier);
        if (!user) throw new Error(`User not found: ${identifier}`);
        return user.id;
    }

    async createRoom(hostId: string, maxPlayers = 2, timeLimitMinutes = 15, difficulty = "MIX", questionCount = 3) {
        const resolvedHostId = await this.resolveUserId(hostId);
        return this.battleRoomService.createRoom({
            hostId: resolvedHostId,
            maxPlayers,
            timeLimitMinutes,
            difficulty,
            questionCount,
        });
    }

    async getRoom(idOrCode: string) {
        return this.battleRoomService.getRoom(idOrCode);
    }

    async joinRoom(idOrCode: string, userId: string) {
        const resolvedUserId = await this.resolveUserId(userId);
        return this.battleRoomService.joinRoom(idOrCode, resolvedUserId);
    }

    async leaveRoom(roomId: string, userId: string) {
        const resolvedUserId = await this.resolveUserId(userId);
        return this.battleRoomService.leaveRoom(roomId, resolvedUserId);
    }

    async kickPlayer(roomId: string, hostId: string, targetUserId: string) {
        const resolvedHostId = await this.resolveUserId(hostId);
        const resolvedTargetUserId = await this.resolveUserId(targetUserId);
        return this.battleRoomService.kickPlayer(roomId, resolvedHostId, resolvedTargetUserId);
    }

    async setPlayerReady(roomId: string, userId: string, isReady: boolean) {
        const resolvedUserId = await this.resolveUserId(userId);
        return this.battleRoomService.setPlayerReady(roomId, resolvedUserId, isReady);
    }

    async startBattle(roomId: string, hostId: string, problemId?: string) {
        const resolvedHostId = await this.resolveUserId(hostId);
        return this.battleRoomService.startBattle(roomId, resolvedHostId, problemId);
    }

    async finishBattle(roomId: string) {
        return this.battleRoomService.finishBattle(roomId);
    }
}
