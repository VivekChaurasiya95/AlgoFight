import { logger } from "@algofight/logger";
import { PrismaSubmissionRepository } from "@algofight/database";
import { RECOVERY_POLICY } from "../constants/scheduler.constants";
import { SubmissionStatus } from "@algofight/types";
import { enqueueSubmissionJob } from "@algofight/queue";
export class RecoveryService {
    private readonly submissionRepository =
        new PrismaSubmissionRepository();

    async detectStaleSubmissions() {

        logger.info(
            "Detecting stale submissions",
        );

        const staleSubmissions = await this.submissionRepository
            .getStaleSubmissions(
                RECOVERY_POLICY.STALE_THRESHOLD_MS,
            );
        for (const submissionId of staleSubmissions) {
            await this.submissionRepository.markAsStale(submissionId);
        }

        return staleSubmissions;


    }
    async recoverSubmission(
        submissionId: string,
    ) {

        logger.info(
            {
                submissionId,
            },
            "Recovering submission",
        );

        const submission = await this.submissionRepository.findById(submissionId)

        if (!submission) {
            logger.warn(

                { submissionId },
                "Submission not found",
            );
            return;
        }

        if (
            submission.retryCount >=
            RECOVERY_POLICY.MAX_RETRIES
        ) {
            await this.submissionRepository.
                updateStatus(
                    submissionId,
                    SubmissionStatus.FINALIZED,
                );

            logger.warn({
                submissionId,
            }, "Recovery limit exceeded");

            return;
        }

        await this.submissionRepository.incrementRetryCount(
            submissionId,
        )

        await this.submissionRepository.updateStatus(
            submissionId,
            SubmissionStatus.QUEUED,
        );

        logger.info(
            {
                submissionId,
            },
            "Submission moved to RETRYING",
        )
        await this.submissionRepository.updateStatus(
            submissionId,
            SubmissionStatus.QUEUED,
        )

        await enqueueSubmissionJob({
            submissionId,
        });

        logger.info(
            {
                submissionId,
            },
            "Recovered submission requeued",
        );
    }



    async runRecoveryCycle() {

        const staleSubmissions =
            await this.detectStaleSubmissions();

        for (
            const submissionId
            of staleSubmissions
        ) {
            await this.recoverSubmission(
                submissionId,
            );
        }
    }
}