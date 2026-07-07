import {
    ExecutionResult,
} from "./execution-result";

import {
    ContainerResult,
} from "../types/container-result";

export class ExecutionResultProcessor {

    process(
        result: ContainerResult,
        executionTime: number,
    ): ExecutionResult {

        return {
            stdout: result.stdout,

            stderr: result.stderr,

            executionTime: executionTime,

            exitCode: result.exitCode,
        };
    }
}