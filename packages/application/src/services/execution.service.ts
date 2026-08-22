import {
    SubmissionRepository,
    ProblemRepository,
    BattleRoomRepository,
} from "@algofight/database";
import { logger } from "@algofight/logger";
import { CodeExecutor } from "../contracts/code-executor";
import { SubmissionStatus } from "@algofight/types";
import {
    SubmissionNotFoundError,
    ProblemNotFoundError,
} from "@algofight/error-handling";

export class ExecutionService {
    constructor(
        private readonly submissionRepository: SubmissionRepository,
        private readonly codeExecutor: CodeExecutor,
        private readonly problemRepository: ProblemRepository,
        private readonly battleRoomRepository?: BattleRoomRepository,
    ) { }

    async processSubmission(submissionId: string): Promise<void> {
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
                throw new SubmissionNotFoundError(submissionId);
            }

            const problem =
                (await this.problemRepository.getProblemWithAllTestCases(
                    submission.problemId,
                )) ??
                (await this.problemRepository.getProblemById(
                    submission.problemId,
                ));

            if (!problem) {
                throw new ProblemNotFoundError(submission.problemId);
            }

            await this.submissionRepository.updateStatus(
                submissionId,
                SubmissionStatus.PROCESSING,
            );

            const result = await this.codeExecutor.execute({
                submissionId,
                language: submission.language,
                code: submission.code,
                testCases: problem.testCases.map((tc) => ({
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

            // If this submission belongs to a battle and passed all test cases, award score
            if (
                submission.roomId &&
                result.failedCount === 0 &&
                this.battleRoomRepository
            ) {
                await this.battleRoomRepository.recordParticipantScore(
                    submission.roomId,
                    submission.userId,
                    100,
                    true,
                );

                logger.info(
                    {
                        submissionId,
                        userId: submission.userId,
                        problemId: submission.problemId,
                        language: submission.language,
                        executionTimeMs: result.executionTime || 0,
                        cpuTimeMs: result.cpuUsage || ((result.executionTime || 0) * 0.95),
                        peakMemoryKb: result.memoryUsage || 0,
                        verdict: result.failedCount === 0 ? "ACCEPTED" : "WRONG_ANSWER",
                        passCount: result.passedCount || (result.failedCount === 0 ? problem.testCases.length : 0),
                        totalTestcases: problem.testCases.length,
                    },
                    "Battle participant solved problem and score was recorded",
                );
            }

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

            if (!(error instanceof SubmissionNotFoundError)) {
                await this.submissionRepository.updateStatus(
                    submissionId,
                    SubmissionStatus.FAILED,
                );
            }

            throw error;
        }
    }
}
