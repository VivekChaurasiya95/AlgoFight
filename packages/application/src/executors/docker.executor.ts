import { CodeExecutor }
from "../contracts/code-executor";

import { ExecutionPayload }
from "../contracts/code-executor";

import { ContainerExecutor }
from "../contracts/container-executor";

import { ContainerRunner }
from "../docker/container-runner";

import { RuntimeFactory }
from "../runtimes/factory-runtime";

import { SubmissionResult }
from "@algofight/database";

import {
    ExecutionResultProcessor,
} from "../processors/execution-result.processor";

import * as os from "os";
import * as path from "path";
import { promises as fs } from "fs";
import { LanguageRuntime } from "../runtimes/language-runtime";

import { JudgeService } from "../judge/services/judge.service";
import { JudgeRequestBuilder } from "../builder/judge-request-builder";
import { logger } from "@algofight/logger";
import { SubmissionStatus } from "@algofight/types";

import { ExecutionTestCase } from "../contracts/code-executor";
import { ContainerResult } from "../types/container-result";

export class DockerExecutor
  implements CodeExecutor {
    private readonly containerExecutor:
    ContainerExecutor =
        new ContainerRunner();
    private readonly judgeSerivce = new JudgeService()
    private readonly resultProcessor =
      new ExecutionResultProcessor();

    async execute(
        payload: ExecutionPayload,
    ): Promise<SubmissionResult> {
        

        const runtime =
        RuntimeFactory.getRuntime(
            payload.language,
        );
        const workspace =
        await this.prepareWorkspace(
            payload,
            runtime,
        );

        logger.debug(
            {
                workspace,
                submissionId: payload.submissionId,
            },
            "Workspace prepared",
        )
        try {
            const startTime = Date.now();

                const containerResult = await this.executeContainer(
                    workspace,
                    payload.memoryLimit,
                    payload.timeLimit,
                    runtime,
                );

                const executionTime = Date.now() - startTime;

                const executionResult = this.resultProcessor.process(
                    containerResult,
                    executionTime,
                );

                const judgeRequest = JudgeRequestBuilder.build(
                    payload.testCases,
                    containerResult,
                    executionTime,
                );

                const judgeResult = this.judgeSerivce.judge(
                    judgeRequest,
            );

                return {
                    ...executionResult,
                    status: SubmissionStatus.COMPLETED,
                    passedCount: judgeResult.passedCount,
                    failedCount: judgeResult.failedCount,
                };
        } finally {
            await this.cleanupWorkspace(
                workspace,
            );
        }
    }

    private async prepareWorkspace(
        payload: ExecutionPayload,
        runtime: LanguageRuntime
        ): Promise<string> {
            const workspacePath = path.join(
                os.tmpdir(),
                `algofight-${payload.submissionId}`
            );
            await fs.mkdir(
                workspacePath,
                {
                    recursive: true,
                },
            );

            const sourceFileName =
                runtime.getSourceFileName();

            const sourcePath = path.join(
                workspacePath,
                sourceFileName,
            );

            await fs.writeFile(
                sourcePath,
                payload.code,
                "utf-8",
            );

            return workspacePath;

        }

    private async executeContainer(
        workspacePath: string,
        memoryLimit: number,
        timeLimit: number,
        runtime: LanguageRuntime,
    ): Promise<ContainerResult> {

        const config = runtime.createContainerConfig(
            workspacePath,
            memoryLimit,
            timeLimit,
        );

        return await this.containerExecutor.run(config);
    }
    

    
    private async cleanupWorkspace(
        workspacePath: string,
    ): Promise<void> {
        await fs.rm(
            workspacePath,
            {
                recursive: true,
                force: true,
            },
        )
    }
}
