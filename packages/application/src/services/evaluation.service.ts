import { EvaluationResult, EvaluationServiceContract, SubmissionPayload, TestCaseResult, Verdict } from "@algofight/types";
import { PistonAdapter } from "./piston.adapter";

export class EvaluationService implements EvaluationServiceContract {
    private pistonAdapter = new PistonAdapter();

    async evaluateSubmission(payload: SubmissionPayload): Promise<EvaluationResult> {
        const testCaseResults: TestCaseResult[] = [];
        let maxMemory = 0;
        let totalTime = 0;
        let compilationResult: EvaluationResult["compilation"] = undefined;
        let allPassed = true;
        let overallVerdict: Verdict = Verdict.ACCEPTED;

        for (let i = 0; i < payload.testCases.length; i++) {
            const testCase = payload.testCases[i];
            const execution = await this.pistonAdapter.executeCode(
                payload.language,
                payload.code,
                testCase.input,
                payload.timeLimitMs,
                payload.memoryLimitBytes
            );

            // Populate compilation result from the first execution (Piston compiles and runs in one go)
            if (i === 0) {
                compilationResult = {
                    success: execution.compile.success,
                    output: execution.compile.output,
                    error: execution.compile.error,
                };

                if (!execution.compile.success) {
                    return {
                        submissionId: payload.submissionId,
                        verdict: Verdict.COMPILATION_ERROR,
                        compilation: compilationResult,
                    };
                }
            }

            const { run } = execution;
            
            let passed = false;
            let currentError = undefined;
            let status = Verdict.ACCEPTED;

            if (run.isTimeout) {
                status = Verdict.TIME_LIMIT_EXCEEDED;
                currentError = "Time Limit Exceeded";
            } else if (run.isMemoryLimit) {
                status = Verdict.MEMORY_LIMIT_EXCEEDED;
                currentError = "Memory Limit Exceeded";
            } else if (run.isRuntimeError || !run.success) {
                status = Verdict.RUNTIME_ERROR;
                currentError = run.stderr || "Runtime Error";
            } else {
                // Check answer
                const actual = run.stdout.trim();
                const expected = testCase.expectedOutput.trim();
                if (actual === expected) {
                    passed = true;
                    status = Verdict.ACCEPTED;
                } else {
                    passed = false;
                    status = Verdict.WRONG_ANSWER;
                    currentError = "Wrong Answer";
                }
            }

            if (!passed) {
                allPassed = false;
                // If overall verdict is still ACCEPTED, take the first failure reason
                if (overallVerdict === Verdict.ACCEPTED) {
                    overallVerdict = status;
                }
            }

            const executionTime = run.timeMs || 0; 
            const memoryUsage = run.memoryBytes || 0;

            maxMemory = Math.max(maxMemory, memoryUsage);
            totalTime += executionTime;

            testCaseResults.push({
                testCaseId: testCase.id,
                status: status,
                passed,
                expectedOutput: testCase.expectedOutput,
                actualOutput: run.stdout,
                error: currentError,
                metrics: {
                    executionTime,
                    memoryUsage,
                    exitCode: run.code,
                    signal: run.signal,
                    stdout: run.stdout,
                    stderr: run.stderr
                }
            });
        }

        return {
            submissionId: payload.submissionId,
            verdict: overallVerdict,
            compilation: compilationResult,
            testCases: testCaseResults,
            execution: undefined, // Used only if it's a single run vs tests
            resourceUsage: {
                maxMemory,
                totalTime
            }
        };
    }
}

