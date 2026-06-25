import { SubmissionStatus } from "@algofight/types";

export const transitions: Record<
  SubmissionStatus,
  readonly SubmissionStatus[]
> = {
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
        SubmissionStatus.STALE,
    ],

    [SubmissionStatus.RETRYING]: [
        SubmissionStatus.QUEUED,
        SubmissionStatus.FAILED,
    ],

    [SubmissionStatus.STALE]: [
        SubmissionStatus.RETRYING,
        SubmissionStatus.FAILED,
    ],

    [SubmissionStatus.COMPLETED]: [],

    [SubmissionStatus.FAILED]: []
};