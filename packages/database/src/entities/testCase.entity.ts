import { ProblemEntity } from "./problem.entity";

export interface TestCaseEntity {
    id: string;

    problemId: string;

    problem: ProblemEntity;

    input: string;

    expectedOutput: string;

    isHidden: boolean;

    createdAt: Date;

}