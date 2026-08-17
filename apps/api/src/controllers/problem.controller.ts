// apps/api/src/controllers/problem.controller.ts
import { PrismaProblemRepository } from "@algofight/database";
import { ProblemInput } from "../schema/problem.schema";
import { MockExecutor } from "@algofight/application";

export class ProblemController {
    private readonly mockExecutor = new MockExecutor();

    constructor(private readonly problemRepository: PrismaProblemRepository = new PrismaProblemRepository()) { }

    async createProblem(input: ProblemInput) {
        return this.problemRepository.createProblem(input);
    }

    async getProblems(query: { page?: number; limit?: number; difficulty?: string }) {
        return this.problemRepository.getProblems(query);
    }

    async getProblemById(id: string) {
        const problem = await this.problemRepository.getProblemById(id);
        if (!problem) throw new Error(`Problem with ID ${id} not found`);
        return problem;
    }

    // Evaluate code for Practice Workspace
    async evaluatePractice(payload: {
        problemId: string;
        code: string;
        language: string;
        mode?: "test" | "submit";
    }) {
        const problem = payload.mode === "test"
            ? await this.problemRepository.getProblemById(payload.problemId)
            : await this.problemRepository.getProblemWithAllTestCases(payload.problemId);

        if (!problem) throw new Error("Problem not found");

        const testCases = problem.testCases || [];
        const result = await this.mockExecutor.execute({
            submissionId: `practice-${Date.now()}`,
            language: payload.language,
            code: payload.code,
            testCases: testCases.map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
            })),
            timeLimit: problem.timeLimit,
            memoryLimit: problem.memoryLimit,
        });

        const passed = result.failedCount === 0;

        return {
            passed,
            output: result.stdout || (passed ? "All test cases passed successfully!" : result.stderr || "Output mismatch."),
            passedTestCases: result.passedCount,
            totalTestCases: result.passedCount + result.failedCount,
            executionTime: result.executionTime,
            verdict: passed ? "ACCEPTED" : "WRONG_ANSWER",
        };
    }
}
