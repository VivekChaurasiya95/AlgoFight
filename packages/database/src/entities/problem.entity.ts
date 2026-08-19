import { TestCaseEntity } from "./testCase.entity";

export interface ProblemEntity {
    id: string;

    title: string;

    testCases: TestCaseEntity[];

    statement: string;

    difficulty: "EASY" | "MEDIUM" | "HARD";

    category?: string | null;

    tags?: string[];

    timeLimit: number;

    memoryLimit: number;

    createdAt: Date;
    updatedAt: Date;
}