import { Worker } from "bullmq";
import {
    BattleService,
    BattleRoomService,
    RatingService
} from "@algofight/application";
import {
    PrismaBattleRoomRepository,
    PrismaProblemRepository,
    PrismaUserRepository
} from "@algofight/database";
import { logger } from "@algofight/logger";
import { redisConnection } from "../client/redis";
import { QUEUE_NAMES } from "../constants/queue.constants";

const battleRoomRepo = new PrismaBattleRoomRepository();
const problemRepo = new PrismaProblemRepository();
const userRepo = new PrismaUserRepository();
const ratingService = new RatingService(userRepo);
const battleRoomService = new BattleRoomService(battleRoomRepo, problemRepo, ratingService);

// Inject dependencies into BattleService just like we did for the submission worker!
const battleService = new BattleService(battleRoomRepo, battleRoomService);

export const battleTimerWorker = new Worker(
    QUEUE_NAMES.BATTLE_TIMER,
    async (job) => {
        const { roomId } = job.data;
        logger.info({ roomId }, "Battle timer expired, finalizing battle...");

        // This force-ends the battle with the reason "TIME_UP"
        await battleService.finishBattle(roomId, "TIME_UP");
    },
    {
        connection: redisConnection,
    }
);

battleTimerWorker.on("completed", (job) => logger.info(`Battle timer ${job.data.roomId} completed`));
battleTimerWorker.on("failed", (job, error) => logger.error({ error }, `Battle timer ${job?.data?.roomId} failed`));
