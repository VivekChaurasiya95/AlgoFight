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
import { start } from "repl";
import { LanguageRuntime } from "../runtimes/language-runtime";
export class DockerExecutor
  implements CodeExecutor {
    private readonly containerExecutor:
    ContainerExecutor =
        new ContainerRunner();
    
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

        console.log("Workspace: ",workspace)
        try {
            return await this.executeContainer(
                workspace,
                runtime,
            );
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
        runtime: LanguageRuntime,
    ): Promise<SubmissionResult> {
        
        const config =
            runtime.createContainerConfig(
                workspacePath,
            );
        const startTime = Date.now()
        const containerResult = 
           await this.containerExecutor.run(
            config,
           );
        const executionTime = 
           Date.now() - startTime;

        return this.resultProcessor.process(
            containerResult,
            executionTime,
        );
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