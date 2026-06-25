import { Verdict } from "../verdict/verdict";
import { TestcaseResult } from "./testcase-result";

export interface JudgeResult {
    verdict: Verdict;
    testcaseResults: TestcaseResult[];

    passedCount: number;
    failedCount: number;
}