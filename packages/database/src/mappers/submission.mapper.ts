import { Submission } from "@prisma/client";
import { SubmissionEntity } from "../entities/submission.entity";
import { SubmissionStatus } from "@algofight/types";

const prismaToDomainStatus: Record <
    Submission["status"],
    SubmissionStatus
> = {
    CREATED: SubmissionStatus.CREATED,
    QUEUED: SubmissionStatus.QUEUED,
    PROCESSING: SubmissionStatus.PROCESSING,
    COMPLETED: SubmissionStatus.COMPLETED,
    FAILED: SubmissionStatus.FAILED,
    RETRYING: SubmissionStatus.RETRYING,
    STALE: SubmissionStatus.STALE,
};

export const toSubmissionEntity = (
    submission: Submission,
): SubmissionEntity => ({
    ...submission,
    status: 
        prismaToDomainStatus[
            submission.status
        ]
})