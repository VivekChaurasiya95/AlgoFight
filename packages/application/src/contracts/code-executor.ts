import { SubmissionResult } from "@algofight/database";

export type ExecutionPayload = {
    submissionId: string,
    language: string,
    code: string,
};
export interface CodeExecutor {
    execute (
        payload: ExecutionPayload
    ): Promise <SubmissionResult>;
}