import { SubmissionResult } from "@algofight/database";
export interface ExecutionTestCase {
    input: string;
    expectedOutput: string;
}
export type ExecutionPayload = {
    submissionId: string,
    language: string,
    code: string,
    testcases: ExecutionTestCase[],
    timeLimit: number,
    memoryLimit: number
};
export interface CodeExecutor {
    execute (
        payload: ExecutionPayload
    ): Promise <SubmissionResult>;
}