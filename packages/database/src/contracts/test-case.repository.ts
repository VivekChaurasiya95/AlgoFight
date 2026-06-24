import { TestCaseEntity } from "../entities/testCase.entity";

export type CreateTestCaseInput = {
    problemId: string;

    input: string;
    expectedOuput: string;

    isHidden?: boolean;
};

export interface TestCaseRepository {
    createTestCase(
        input: CreateTestCaseInput,
    ): Promise <TestCaseEntity>;

    getTestCaseById(
        testCaseId: string,
    ): Promise <TestCaseEntity | null>;

    getTestCasesBtProblemId(
        problemId: string,
    ): Promise <TestCaseEntity[]>;
}