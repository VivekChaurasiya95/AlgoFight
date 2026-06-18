import { logger } from "@algofight/logger";
import { PrismaSubmissionRepository } from "@algofight/database";
import { RECOVERY_POLICY } from "../constants/scheduler.constants";
export class RecoveryService {
    private readonly submissionRepository =
         new PrismaSubmissionRepository();

    async detectStaleSubmissions() {

        logger.info(
            "Detecting stale submissions",
        );

        return this.submissionRepository.
                getStaleSubmissions(
                    RECOVERY_POLICY.STALE_THRESHOLD_MS,
                );
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