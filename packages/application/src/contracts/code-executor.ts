import { SubmissionResult } from "@algofight/database";
export interface CodeExecutor {
    execute (
        submissionId: string
    ): Promise <SubmissionResult>;
}