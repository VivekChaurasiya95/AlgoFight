

export interface TestCaseEntity {
    id: string;

    problemId: string;


    input: string;

    expectedOutput: string;

    isHidden: boolean;

    createdAt: Date;

}