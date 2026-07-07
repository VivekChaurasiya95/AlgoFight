import {
    SubmissionRepository,
} from "@algofight/database";
import {
    ProblemRepository
} from "@algofight/database";
import { logger } from "@algofight/logger";

import { CodeExecutor } from "../contracts/code-executor";

import { SubmissionStatus } from "@algofight/types";

import {
    SubmissionNotFoundError,
    ProblemNotFoundError
} from "@algofight/error-handling";

export class ExecutionService {
    constructor(
        private readonly submissionRepository:
            SubmissionRepository,

        private readonly codeExecutor:
            CodeExecutor,
        
        private readonly problemRepository:
            ProblemRepository,
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
            const problem = 
                    await this.problemRepository.getProblemById(
                    submission?.problemId
            )

            await this.submissionRepository.updateStatus(
                submissionId,
                SubmissionStatus.PROCESSING,
            );
            if (!problem) {
            throw new ProblemNotFoundError(submission.problemId);
}
            const result = await this.codeExecutor.execute({
                submissionId,
                language: submission.language,
                code: submission.code,
                testCases: problem.testCases.map(tc => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                })),
                timeLimit: problem.timeLimit,
                memoryLimit: problem.memoryLimit,
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