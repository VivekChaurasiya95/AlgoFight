import {
    SubmissionResult,
} from "@algofight/database";

import {
    SubmissionStatus,
} from "@algofight/types";

import {
    ContainerResult,
} from "../types/container-result";

export class ExecutionResultProcessor {

    process(
        result: ContainerResult,
        executionTime: number,
    ): SubmissionResult {

        return {
            stdout:
                result.stdout,

            stderr:
                result.stderr,

            executionTime,

            exitCode:
                result.exitCode,

            status:
                result.exitCode === 0
                    ? SubmissionStatus.COMPLETED
                    : SubmissionStatus.FAILED,
        };
    }
}