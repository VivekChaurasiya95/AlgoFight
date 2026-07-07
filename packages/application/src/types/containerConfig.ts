export interface ContainerConfig {
    image: string;

    command: string[];

    workspacePath: string;

    memoryLimit: number;      // MB

    timeLimit: number;        // milliseconds

    stdin?: string;
}