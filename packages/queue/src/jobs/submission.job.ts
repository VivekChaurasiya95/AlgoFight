import { submissionQueue } from "../queues/submission.queue";
import {JOB_NAMES} from "../constants/queue.constants"
import { SubmissionJobPayload } from "../types/submission-job.type";
import { logger } from "@algofight/logger";

export const enqueueSubmissionJob = async (
  payload: SubmissionJobPayload,
) => {

  logger.info(
      {
          submissionId:
              payload.submissionId,
      },
      "Enqueueing submission job",
  );

  try {
    const job = 
      await submissionQueue.add(
        JOB_NAMES.SUBMISSION,

        payload,

        {
          priority: 1,
        },
      );

    logger.info(
      {
        submissionId:
          payload.submissionId,
        jobId: 
          job.id,
      },
      "Submission job enqueued",
    );

    return job;
  } catch (error) {
    logger.error(
      {
        submissionId: payload.submissionId,
        error,
      },
      "Failed to enqueue submission job",
    );

    throw error;
  }
};