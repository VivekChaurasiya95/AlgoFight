import { ProblemEntity } from "../entities/problem.entity";

export interface CreateProblemInput {
    title: string;
    statement: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    timeLimit: number;
    memoryLimit: number;
}

export interface ProblemRepository {
    createProblem(input: CreateProblemInput): Promise<ProblemEntity>;
    getProblemById(problemId: string): Promise<ProblemEntity | null>;
    getProblemWithAllTestCases(problemId: string): Promise<ProblemEntity | null>;
}
