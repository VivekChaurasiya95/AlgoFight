import { ContainerConfig } from "../types/containerConfig";
import { ContainerResult } from "../types/container-result";
import { ContainerExecutor } from "../contracts/container-executor";
import { docker } from "./docker-client";
import { EXECUTION_LIMITS } from "../constants/execution.constants";

export class ContainerRunner implements ContainerExecutor{

    async run(
        config: ContainerConfig,
    ): Promise<ContainerResult> {

        const container =
            await docker.createContainer({
                Image: config.image,

                Cmd: config.command,

                HostConfig: {
                    AutoRemove: true,
                    Memory: 
                       EXECUTION_LIMITS.MEMORY_MB
                        * 1024
                        * 1024,
                    NanoCpus:
                       EXECUTION_LIMITS.CPU_COUNT
                       * 1_000_000_000,

                    Binds: [
                        `${config.workspacePath}:/workspace`,
                    ],
                },

                WorkingDir: "/workspace",

                Tty: false,
            });

        try {

            await container.start();

            const executionResult =
                await container.wait();

            const logs =
                await container.logs({
                    stdout: true,
                    stderr: true,
                });

            return {
                stdout: logs.toString(),

                stderr: "",

                exitCode:
                    executionResult.StatusCode ?? 1,
            };

        } finally {

            try {
                await container.remove({
                    force: true,
                });
            } catch {
                // Ignore cleanup errors
            }
        }
    }
}