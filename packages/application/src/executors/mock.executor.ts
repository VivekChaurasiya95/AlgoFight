import {
    CodeExecutor,
    ExecutionPayload,
} from "../contracts/code-executor";

import { SubmissionResult }
    from "@algofight/database";

import { logger }
    from "@algofight/logger";

import { SubmissionStatus }
    from "@algofight/types";

const MOCK_EXECUTION_TIME = 3000;

export class MockExecutor
    implements CodeExecutor {

    async execute(
        payload: ExecutionPayload,
    ): Promise<SubmissionResult> {

        const start = Date.now();

        logger.info(
            {
                submissionId:
                    payload.submissionId,

                language:
                    payload.language,
            },
            "Mock execution started",
        );

        if (
            payload.code.includes(
                "MOCK_FAILURE",
            )
        ) {
            throw new Error(
                "Mock execution failed",
            );
        }

        await new Promise(
            (resolve) =>
                setTimeout(
                    resolve,
                    MOCK_EXECUTION_TIME,
                ),
        );

        const executionTime =
            Date.now() - start;

        logger.info(
            {
                submissionId:
                    payload.submissionId,
            },
            "Mock execution completed",
        );

        return {
            stdout:
                "Hello AlgoFight",

            stderr:
                null,

            executionTime,

            exitCode:
                0,

            status:
                SubmissionStatus.COMPLETED,
        };
    }
}