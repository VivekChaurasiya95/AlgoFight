import { CodeExecutor, ExecutionPayload } from "../contracts/code-executor";
import { SubmissionResult } from "@algofight/database";
import { logger } from "@algofight/logger";
import { SubmissionStatus } from "@algofight/types";
export class MockExecutor implements CodeExecutor{
    async execute(

        payload: ExecutionPayload,

    ): Promise <SubmissionResult> {
        logger.info(
            {
                submissionId: payload.submissionId,
                language: payload.language,
            }, "Mock execution started!."
        );
        await new Promise((resolve) =>
            setTimeout(resolve, 3000), 
        );
        logger.info
        (
            {
                submissionId: payload.submissionId,
            },
            "Mock execution completed",
        );
        return {
            stdout: "Hello AlgoFight",

            stderr: null,

            executionTime: 3000,

            exitCode: 0,

            status: SubmissionStatus.COMPLETED,
        };
    }
}