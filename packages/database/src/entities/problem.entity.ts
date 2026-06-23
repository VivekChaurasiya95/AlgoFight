export interface ProblemEntity{
    id: string;

    title: string;

    statement: string;

    difficulty: "EASY" | "MEDIUM" | "HARD";

    timeLimit: number;

    memoryLimit: number;

    createdAt: Date;
    updatedAt: Date;
}