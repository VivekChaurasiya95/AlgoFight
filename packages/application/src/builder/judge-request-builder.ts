import { JudgeRequest } from "../judge/models/judge-request";
import { JudgeInput } from "../judge/models/judge-input";
import {
    ExecutionPayload,
    ExecutionTestCase,
} from "../contracts/code-executor"

import { ContainerResult } from "../types/container-result";


export class JudgeRequestBuilder {
    static build(
        testCases: ExecutionTestCase[],
        result: ContainerResult,
        executionTime: number,
    ): JudgeRequest {
        const testcases: JudgeInput[] =
              testCases.map((testCase, index) => ({
                testcaseId: `${index + 1}`,

                expectedOutput: testCase.expectedOutput,

                actualOutput: result.stdout,

                executionTime,

                memoryUsed: 0,

                compilationError: result.exitCode != 0,

                runtimeError: false,

                timeLimitExceededError: false,

                memoryLimitExceededError: false,

                exitCode: result.exitCode,

              }));

        return {testcases};

    }
}