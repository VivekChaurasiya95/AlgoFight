import { ExactComparator } from "../comparators/exact-comparator";

import { Verdict, VerdictEngine } from "@algofight/types";

import { JudgeRequest } from "../models/judge-request";
import { JudgeInput } from "../models/judge-input";
import { JudgeResult } from "../models/judge-result";
import { TestcaseResult } from "../models/testcase-result";

export class JudgeService {
  private readonly comparator = new ExactComparator();

  private readonly verdictEngine = new VerdictEngine();

  judge(request: JudgeRequest): JudgeResult {
    const results = request.testcases.map(testcase =>
      this.judgeTestcase(testcase),
    );

    const finalVerdict = this.verdictEngine.aggregate(results);

    const summary = this.buildSummary(results);

    return {
      verdict: finalVerdict,
      testcaseResults: results,
      ...summary,
    };
  }

  private judgeTestcase(
    testcase: JudgeInput,
  ): TestcaseResult {
    const isMatch = this.comparator.compare(
      testcase.expectedOutput,
      testcase.actualOutput,
    );

    const verdict = this.verdictEngine.determineVerdict({
      isMatch,
      compilationError: testcase.compilationError,
      runtimeError: testcase.runtimeError,
      timeLimitExceededError: testcase.timeLimitExceededError,
      memoryLimitExceededError: testcase.memoryLimitExceededError,
    });

    return {
      testcaseId: testcase.testcaseId,
      verdict,
    };
  }

  private buildSummary(
    results: TestcaseResult[],
  ): Pick<JudgeResult, "passedCount" | "failedCount"> {
    const passedCount = results.filter(
      result => result.verdict === Verdict.ACCEPTED,
    ).length;

    return {
      passedCount,
      failedCount: results.length - passedCount,
    };
  }
}
