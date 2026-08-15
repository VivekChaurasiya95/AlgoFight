import { Worker } from "bullmq";
import { ExecutionService, DockerExecutor } from "@algofight/application";
import { logger } from "@algofight/logger";
import {
  PrismaSubmissionRepository,
  PrismaProblemRepository, // 👈 1. Import PrismaProblemRepository
} from "@algofight/database";
import { redisConnection } from "../client/redis";
import { QUEUE_NAMES } from "../constants/queue.constants";

const submissionRepository = new PrismaSubmissionRepository();
const problemRepository = new PrismaProblemRepository(); // 👈 2. Instantiate
const codeExecutor = new DockerExecutor();

const executionService = new ExecutionService(
  submissionRepository,
  codeExecutor,
  problemRepository // 👈 3. Pass as 3rd argument
);

export const submissionWorker = new Worker(
  QUEUE_NAMES.SUBMISSION,
  async (job) => {
    await executionService.processSubmission(job.data.submissionId);
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

submissionWorker.on("completed", (job) => {
  logger.info(`Submission ${job.data.submissionId} completed`);
});

submissionWorker.on("failed", (job, error) => {
  logger.error({ error }, `Submission ${job?.data?.submissionId} failed`);
});

logger.info(
  {
    queue: QUEUE_NAMES.SUBMISSION,
    concurrency: 5,
  },
  "Submission worker initialized"
);
