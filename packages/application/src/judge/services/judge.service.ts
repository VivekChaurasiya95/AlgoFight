import { Verdict } from "@algofight/types";
import { VerdictEngine } from "../verdict/verdict-engine";
import { JudgeRequest } from "../models/judge-request";
import { JudgeResult } from "../models/judge-result";
import { JudgeInput } from "../models/judge-input";
import { TestcaseResult } from "../models/testcase-result";
import { ExactComparator } from "../comparators/exact-comparator";

export class JudgeService {
  private readonly comparator = new ExactComparator();
  private readonly verdictEngine = new VerdictEngine();

  judge(request: JudgeRequest): JudgeResult {
    const results = request.testcases.map((testcase) =>
      this.judgeTestcase(testcase)
    );

    const finalVerdict = this.verdictEngine.aggregate(results);

    const passedCount = results.filter(
      (result) => result.verdict === Verdict.ACCEPTED
    ).length;

    const failedCount = results.length - passedCount;

    return {
      verdict: finalVerdict,
      testcaseResults: results,
      passedCount,
      failedCount,
    };
  }

  private judgeTestcase(testcase: JudgeInput): TestcaseResult {
    const isMatch = this.comparator.compare(
      testcase.expectedOutput,
      testcase.actualOutput
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
}
