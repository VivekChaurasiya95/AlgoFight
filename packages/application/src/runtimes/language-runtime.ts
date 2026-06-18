import { ContainerConfig } from "../types/containerConfig";

export interface LanguageRuntime {
    getSourceFileName(): string,
    createContainerConfig(
        workspacePath: string,
    ): ContainerConfig
}