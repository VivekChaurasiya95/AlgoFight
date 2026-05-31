import {Queue, RedisConnection} from "bullmq";
import {redisConnection} from "../client/redis";
import { QUEUE_NAMES } from "../constants/queue.constants";

export const submissionQueue = new Queue (
    QUEUE_NAMES.SUBMISSION,
    {
        connection: {
            host: redisConnection.options.host,
            port: redisConnection.options.port,
        },

        defaultJobOptions: {
            attempts: 3,

            removeOnComplete: 100,

            removeOnFail: 500,
        },
    },
);