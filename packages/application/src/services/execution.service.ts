import {
    SubmissionRepository,
    ProblemRepository,
    BattleRoomRepository,
} from "@algofight/database";
import { logger } from "@algofight/logger";
import { EvaluationServiceContract, SubmissionStatus, Verdict } from "@algofight/types";
import {
    SubmissionNotFoundError,
    ProblemNotFoundError,
} from "@algofight/error-handling";

export class ExecutionService {
    constructor(
        private readonly submissionRepository: SubmissionRepository,
        private readonly evaluationService: EvaluationServiceContract,
        private readonly problemRepository: ProblemRepository,
        private readonly battleRoomRepository?: BattleRoomRepository,
    ) { }

    async processSubmission(submissionId: string): Promise<void> {
        try {
            logger.info({ submissionId }, "Starting submission processing");

            const submission = await this.submissionRepository.getSubmissionById(submissionId);
            if (!submission) {
                throw new SubmissionNotFoundError(submissionId);
            }

            const problem =
                (await this.problemRepository.getProblemWithAllTestCases(submission.problemId)) ??
                (await this.problemRepository.getProblemById(submission.problemId));

            if (!problem) {
                throw new ProblemNotFoundError(submission.problemId);
            }

            // Step through strict state machine transitions
            await this.submissionRepository.updateStatus(submissionId, SubmissionStatus.COMPILING);
            await this.submissionRepository.updateStatus(submissionId, SubmissionStatus.RUNNING);
            await this.submissionRepository.updateStatus(submissionId, SubmissionStatus.EVALUATING);

            const evalResult = await this.evaluationService.evaluateSubmission({
                submissionId,
                language: submission.language,
                code: submission.code,
                testCases: problem.testCases.map((tc) => ({
                    id: tc.id,
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                })),
                timeLimitMs: problem.timeLimit,
                memoryLimitBytes: problem.memoryLimit,
            });

            const passedCount = evalResult.testCases?.filter((tc) => tc.passed).length || 0;
            const failedCount = evalResult.testCases?.filter((tc) => !tc.passed).length || 0;
            const isAccepted = evalResult.verdict === Verdict.ACCEPTED;

            await this.submissionRepository.completeSubmission(submissionId, {
                status: SubmissionStatus.FINALIZED,
                stdout: null,
                stderr: evalResult.compilation?.error || null,
                executionTime: evalResult.resourceUsage?.totalTime || 0,
                exitCode: 0,
                passedCount,
                failedCount,
                verdict: evalResult.verdict,
                memoryUsage: evalResult.resourceUsage?.maxMemory || 0,
                compileTime: evalResult.compilation?.timeMs || 0,
            });

            // If this submission belongs to a battle and passed all test cases, award score
            if (submission.roomId && isAccepted && this.battleRoomRepository) {
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
                        executionTimeMs: evalResult.resourceUsage?.totalTime || 0,
                        peakMemoryKb: evalResult.resourceUsage?.maxMemory || 0,
                        verdict: "ACCEPTED",
                        passCount: passedCount,
                        totalTestcases: problem.testCases.length,
                    },
                    "Battle participant solved problem and score was recorded",
                );
            }

            logger.info({ submissionId }, "Submission processing completed");
        } catch (error) {
            logger.error({ submissionId, error }, "Submission processing failed");
            
            // Re-throw to let the worker handle/retry
            throw error;
        }
    }
}
