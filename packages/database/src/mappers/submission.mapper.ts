import { Submission } from "@prisma/client";
import { SubmissionEntity } from "../entities/submission.entity";
import { SubmissionStatus } from "@algofight/types";

const prismaToDomainStatus: Record<
    Submission["status"],
    SubmissionStatus
> = {
    CREATED: SubmissionStatus.CREATED,
    QUEUED: SubmissionStatus.QUEUED,
    COMPILING: SubmissionStatus.COMPILING,
    RUNNING: SubmissionStatus.RUNNING,
    EVALUATING: SubmissionStatus.EVALUATING,
    FINALIZED: SubmissionStatus.FINALIZED,
};

export const toSubmissionEntity = (
    submission: Submission,
): SubmissionEntity => ({
    ...submission,
    roomId: submission.roomId,
    status:
        prismaToDomainStatus[
        submission.status
        ]
})