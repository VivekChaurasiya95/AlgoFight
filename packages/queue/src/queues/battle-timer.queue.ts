import { Queue } from "bullmq"
import { redisConnection } from "../client/redis";
import { QUEUE_NAMES } from "../constants/queue.constants";
import { logger } from "@algofight/logger";

export const battleTimerQueue = new Queue(QUEUE_NAMES.BATTLE_TIMER, {
    connection: redisConnection,

});

logger.info({ queue: QUEUE_NAMES.BATTLE_TIMER }, "Battle timer queue initialised.");