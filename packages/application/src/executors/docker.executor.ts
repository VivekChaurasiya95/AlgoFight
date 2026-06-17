import { CodeExecutor } from "../contracts/code-executor";
import { ExecutionPayload } from "../contracts/code-executor";
import { SubmissionResult } from "@algofight/database";
import { ContainerRunner } from "../docker/container-runner";
import * as os from "os";
import * as path from "path";
import { promises as fs } from "fs";
export class DockerExecutor
  implements CodeExecutor {

    async execute(
        payload: ExecutionPayload,
    ): Promise<SubmissionResult> {
        

        const workspace =
            await this.prepareWorkspace(
                payload,
            );

        console.log("Workspace: ",workspace)
        try {
            return await this.executeContainer(
                workspace,
            );
        } finally {
            await this.cleanupWorkspace(
                workspace,
            );
        }
    }

    private async prepareWorkspace(
        payload: ExecutionPayload,
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
                "solution.js";

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
    ): Promise<SubmissionResult> {
        throw new Error(
            "Not implemented",
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