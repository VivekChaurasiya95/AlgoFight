import {
    SubmissionRepository,
} from "@algofight/database";

import { logger } from "@algofight/logger";

import { CodeExecutor } from "../contracts/code-executor";

import { SubmissionStatus } from "@algofight/types";

import {
    SubmissionNotFoundError,
} from "@algofight/error-handling";

export class ExecutionService {
    constructor(
        private readonly submissionRepository:
            SubmissionRepository,

        private readonly codeExecutor:
            CodeExecutor,
    ) {}

    async processSubmission(
        submissionId: string,
    ) {
        try {
            logger.info(
                {
                    submissionId,
                },
                "Starting submission processing",
            );

            const submission =
                await this.submissionRepository.getSubmissionById(
                    submissionId,
                );

            if (!submission) {
                throw new SubmissionNotFoundError(
                    submissionId,
                );
            }

            await this.submissionRepository.updateStatus(
                submissionId,
                SubmissionStatus.PROCESSING,
            );

            const result =
                await this.codeExecutor.execute({
                    submissionId,
                    language: submission.language,
                    code: submission.code,
                });

            await this.submissionRepository.completeSubmission(
                submissionId,
                result,
            );

            logger.info(
                {
                    submissionId,
                },
                "Submission processing completed",
            );
        } catch (error) {
            logger.error(
                {
                    submissionId,
                    error,
                },
                "Submission processing failed",
            );

            if (
                !(error instanceof SubmissionNotFoundError)
            ) {
                await this.submissionRepository.updateStatus(
                    submissionId,
                    SubmissionStatus.FAILED,
                );
            }

            throw error;
        }
    }
}