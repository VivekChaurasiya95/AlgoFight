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

  return submissionQueue.add(
    JOB_NAMES.SUBMISSION,

    payload,

    {
      priority: 1,
    },
  );
};