import { ProblemNotFoundError } from "@algofight/error-handling";
import { enqueueSubmissionJob } from "@algofight/queue";
import { SubmissionInput, TestRunInput } from "../schema/submission.schema";
import { SubmissionRepository, ProblemRepository } from "@algofight/database";
import { SubmissionStatus } from "@algofight/types";
import { EvaluationService } from "@algofight/application";

export class SubmissionController {
    constructor(
        private readonly submissionRepository: SubmissionRepository,
        private readonly problemRepository: ProblemRepository,
    ) { }

    async submit(body: SubmissionInput, authenticatedUserId: string) {
        const problem = await this.problemRepository.getProblemById(body.problemId);
        if (!problem) {
            throw new ProblemNotFoundError(body.problemId);
        }

        // 🔐 Bind author strictly to authenticated session
        const submission = await this.submissionRepository.createSubmission({
            userId: authenticatedUserId,
            problemId: body.problemId,
            roomId: body.roomId,
            language: body.language,
            code: body.code,
        });

        await enqueueSubmissionJob({
            submissionId: submission.id,
            mode: "SUBMIT"
        } as any);

        await this.submissionRepository.updateStatus(
            submission.id,
            SubmissionStatus.QUEUED,
        );

        return submission;
    }

    async getAllSubmission(requestingUserId?: string) {
        const submissions = await this.submissionRepository.getAllSubmission();
        
        // 🔐 Public DTO Projection: Strip private source code and internal stderr
        return submissions.map(s => ({
            id: s.id,
            userId: s.userId,
            problemId: s.problemId,
            language: s.language,
            status: s.status,
            executionTime: s.executionTime,
            createdAt: s.createdAt,
            // Only include source code if requesting user owns it
            code: requestingUserId && s.userId === requestingUserId ? s.code : undefined,
        }));
    }

    async getSubmissionById(submissionId: string, requestingUserId?: string, userRole?: string) {
        const submission = await this.submissionRepository.getSubmissionById(submissionId);
        if (!submission) return null;

        const isOwner = requestingUserId && submission.userId === requestingUserId;
        const isAdmin = userRole === "ADMIN";

        // 🔐 If owner or admin, return full source code and execution data
        if (isOwner || isAdmin) {
            return submission;
        }

        // 🔐 Otherwise return sanitized public summary DTO
        return {
            id: submission.id,
            userId: submission.userId,
            problemId: submission.problemId,
            language: submission.language,
            status: submission.status,
            executionTime: submission.executionTime,
            createdAt: submission.createdAt,
        };
    }

    async test(body: TestRunInput) {
        const evaluationService = new EvaluationService();
        const result = await evaluationService.evaluateSubmission({
            submissionId: "test-run",
            language: body.language,
            code: body.code,
            testCases: body.testCases as any,
            timeLimitMs: 2000,
            memoryLimitBytes: 256 * 1024 * 1024,
        }, () => { }, "SAMPLE");
        return result;
    }
}
