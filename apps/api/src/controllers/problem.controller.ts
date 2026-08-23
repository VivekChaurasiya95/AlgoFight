// apps/api/src/controllers/problem.controller.ts
import { PrismaProblemRepository } from "@algofight/database";
import { ProblemInput } from "../schema/problem.schema";
import { SandboxExecutor } from "@algofight/application";

export class ProblemController {
    private readonly executor = new SandboxExecutor();

    constructor(private readonly problemRepository: PrismaProblemRepository = new PrismaProblemRepository()) { }

    async createProblem(input: ProblemInput) {
        return this.problemRepository.createProblem(input);
    }

    async getProblems(query: { page?: number; limit?: number; difficulty?: string; category?: string; tags?: string }) {
        return this.problemRepository.getProblems(query);
    }

    async getProblemById(id: string) {
        const problem = await this.problemRepository.getProblemById(id);
        if (!problem) throw new Error(`Problem with ID ${id} not found`);
        return problem;
    }

    // Evaluate code for Practice Workspace (Sample or Full Balanced Suite)
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

        // Guard: never report a pass for a problem that has no test cases to judge
        // against (otherwise failedCount === 0 would falsely mark it "ACCEPTED").
        if (testCases.length === 0) {
            return {
                passed: false,
                output: "This problem has no test cases available to judge against yet.",
                passedTestCases: 0,
                totalTestCases: 0,
                executionTime: 0,
                verdict: "INTERNAL_ERROR",
            };
        }

        const result = await this.executor.execute({
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
