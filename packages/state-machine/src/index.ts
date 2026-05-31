import { SubmissionStatus } from "@algofight/types";

const transitions: Record<SubmissionStatus, SubmissionStatus[]> = {
  [SubmissionStatus.CREATED]: [
    SubmissionStatus.QUEUED,
  ],

  [SubmissionStatus.QUEUED]: [
    SubmissionStatus.PROCESSING,
    SubmissionStatus.FAILED,
  ],

  [SubmissionStatus.PROCESSING]: [
    SubmissionStatus.COMPLETED,
    SubmissionStatus.FAILED,
    SubmissionStatus.RETRYING,
  ],

  [SubmissionStatus.RETRYING]: [
    SubmissionStatus.QUEUED,
    SubmissionStatus.FAILED,
  ],

  [SubmissionStatus.COMPLETED]: [],

  [SubmissionStatus.FAILED]: [],

  [SubmissionStatus.STALE]: [
    SubmissionStatus.RETRYING,
    SubmissionStatus.FAILED,
  ],
};

export const canTransition = (
  current: SubmissionStatus,
  next: SubmissionStatus,
): boolean => {
  return transitions[current].includes(next);
};