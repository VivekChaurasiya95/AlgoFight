import { TestCaseEntity } from "./testCase.entity";

export interface ProblemEntity{
    id: string;

    title: string;

    testCase: TestCaseEntity[];

    statement: string;

    difficulty: "EASY" | "MEDIUM" | "HARD";

    timeLimit: number;

    memoryLimit: number;

    createdAt: Date;
    updatedAt: Date;
}