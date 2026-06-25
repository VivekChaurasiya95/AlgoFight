import { Verdict } from "../verdict/verdict";
import { TestcaseResult } from "./testcase-result";

export type JudgeResult = {
    verdict: Verdict;
    testcaseResults: TestcaseResult[];
};