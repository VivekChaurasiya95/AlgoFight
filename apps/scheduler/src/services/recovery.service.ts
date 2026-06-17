import { logger } from "@algofight/logger";

export class RecoveryService {

    async detectStaleSubmissions() {

        logger.info(
            "Detecting stale submissions",
        );

        return [];
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