import { SubmissionStatus } from "@algofight/types";

export const transitions: Record<
  SubmissionStatus,
  readonly SubmissionStatus[]
> = {
    [SubmissionStatus.CREATED]: [
        SubmissionStatus.QUEUED,
    ],

    [SubmissionStatus.QUEUED]: [
        SubmissionStatus.COMPILING,
        SubmissionStatus.FINALIZED,
    ],

    [SubmissionStatus.COMPILING]: [
        SubmissionStatus.RUNNING,
        SubmissionStatus.FINALIZED,
    ],

    [SubmissionStatus.RUNNING]: [
        SubmissionStatus.EVALUATING,
        SubmissionStatus.FINALIZED,
    ],

    [SubmissionStatus.EVALUATING]: [
        SubmissionStatus.FINALIZED,
    ],

    [SubmissionStatus.FINALIZED]: []
};