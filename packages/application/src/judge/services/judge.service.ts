import { ExactComparator }
from "../comparators/exact-comparator";

import { Verdict }
from "../verdict/verdict";

import { VerdictEngine }
from "../verdict/verdict-engine";

import {TestcaseResult} from "../models/testcase-result";

export type JudgeInput = {
    expectedOutput: string;

    actualOutput: string;

    testcaseId: string;
};

export type JudgeRequest = {
    testcases: JudgeInput[];
};

export class JudgeService {

    private readonly comparator =
        new ExactComparator();

    private readonly verdictEngine =
        new VerdictEngine();

    judge(
        request: JudgeRequest,
    ): TestcaseResult[] {
        const results: TestcaseResult[] = [];

        for (const [index, testcase] of request.testcases.entries()){

            const isMatch = this.comparator.compare(
                testcase.expectedOutput,
                testcase.actualOutput,
            );

            const verdict = this.verdictEngine.determineVerdict({
                isMatch,
            });

            results.push({
                testcaseId: testcase.testcaseId,
                verdict,
            });
            
        }
        return results;
    }
}