import { ContainerConfig } from "../types/containerConfig";
import { ContainerResult } from "../types/container-result";

export interface ContainerExecutor {
    run (
        config: ContainerConfig
    ): Promise <ContainerResult>
};