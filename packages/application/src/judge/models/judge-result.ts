import { Verdict } from "@algofight/types";
import { TestcaseResult } from "./testcase-result";

export interface JudgeResult {
    verdict: Verdict;
    testcaseResults: TestcaseResult[];

    passedCount: number;
    failedCount: number;
}
