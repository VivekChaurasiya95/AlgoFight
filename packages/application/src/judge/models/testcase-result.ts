import { Verdict } from "../verdict/verdict";

export type TestcaseResult = {
    testcaseId: string;
    verdict: Verdict;
};