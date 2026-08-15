import { BattleRoomService, RatingService } from "@algofight/application";
import {
    PrismaBattleRoomRepository,
    PrismaProblemRepository,
    PrismaUserRepository,
} from "@algofight/database";

export class BattleController {
    private readonly battleRoomService: BattleRoomService;
    private readonly ratingService: RatingService;

    constructor() {
        const battleRoomRepository = new PrismaBattleRoomRepository();
        const problemRepository = new PrismaProblemRepository();
        const userRepository = new PrismaUserRepository();

        this.ratingService = new RatingService(userRepository);
        this.battleRoomService = new BattleRoomService(
            battleRoomRepository,
            problemRepository,
            this.ratingService
        );
    }

    async createRoom(hostId: string, maxPlayers = 2, timeLimitMinutes = 15, problemId?: string) {
        return this.battleRoomService.createRoom({
            hostId,
            maxPlayers,
            timeLimitMinutes,
            problemId,
        });
    }

    async getRoom(idOrCode: string) {
        return this.battleRoomService.getRoom(idOrCode);
    }

    async joinRoom(idOrCode: string, userId: string) {
        return this.battleRoomService.joinRoom(idOrCode, userId);
    }

    async leaveRoom(roomId: string, userId: string) {
        return this.battleRoomService.leaveRoom(roomId, userId);
    }

    async setPlayerReady(roomId: string, userId: string, isReady: boolean) {
        return this.battleRoomService.setPlayerReady(roomId, userId, isReady);
    }

    async startBattle(roomId: string, hostId: string, problemId?: string) {
        return this.battleRoomService.startBattle(roomId, hostId, problemId);
    }

    async finishBattle(roomId: string) {
        return this.battleRoomService.finishBattle(roomId);
    }
}
