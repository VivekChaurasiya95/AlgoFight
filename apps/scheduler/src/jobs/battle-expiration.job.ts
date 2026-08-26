import { BattleRoomService, RatingService } from "@algofight/application";
import {
    PrismaBattleRoomRepository,
    PrismaUserRepository,
} from "@algofight/database";
import { logger } from "@algofight/logger";

const battleRoomRepo = new PrismaBattleRoomRepository();
const userRepo = new PrismaUserRepository();

const ratingService = new RatingService(userRepo);
const battleRoomService = new BattleRoomService(
    battleRoomRepo,
    undefined,
    ratingService,
);

export async function runBattleExpirationJob(): Promise<void> {
    try {
        const expiredRooms = await battleRoomRepo.getExpiredRooms();

        for (const room of expiredRooms) {
            logger.info(
                {
                    roomId: room.id,
                    roomCode: room.roomCode,
                },
                "Battle time limit exceeded. Auto-finalizing battle...",
            );

            const result = await battleRoomService.finishBattle(room.id);

            logger.info(
                {
                    roomId: room.id,
                    result,
                },
                "Battle finalized due to expiration",
            );
        }
    } catch (error) {
        logger.error(
            { error },
            "Error running battle expiration job",
        );
    }
}
