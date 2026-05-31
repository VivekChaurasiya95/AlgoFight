import { Worker } from "bullmq";

import { ExecutionService, MockExecutor } from "@algofight/application";



import { PrismaSubmissionRepository } from "@algofight/database";

import { redisConnection } from "../client/redis";

import { QUEUE_NAMES } from "../constants/queue.constants";

const submissionRepository = 
      new PrismaSubmissionRepository();

const codeExecutor = new MockExecutor();

const executionService =
  new ExecutionService(
    submissionRepository,
    codeExecutor,
  );

export const submissionWorker = new Worker(
  QUEUE_NAMES.SUBMISSION,

  async (job) => {

    await executionService.processSubmission(
      job.data.submissionId,
    );
  },

  {
    connection: redisConnection,

    concurrency: 5,
  },
);