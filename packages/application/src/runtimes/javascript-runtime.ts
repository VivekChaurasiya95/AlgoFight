import { LanguageRuntime }
from "./language-runtime";

import { ContainerConfig }
from "../types/containerConfig";

export class JavaScriptRuntime
    implements LanguageRuntime {
    getSourceFileName(): string {
        return "solution.js"
    }
    createContainerConfig(
        workspacePath: string,
        memoryLimit: number,
        timeLimit: number,
    ): ContainerConfig {

        return {
            image: "node:22-alpine",

            command: [
                "node",
                "/workspace/solution.js",
            ],

            workspacePath,
            memoryLimit,
            timeLimit
        };
    }
}