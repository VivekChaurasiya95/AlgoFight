import { Verdict } from './verdict';
import { VERDICT_MAP, VERDICTS } from './verdict.registry';
import {VerdictInput} from "./verdict.types"
import { TestcaseResult } from '../models/testcase-result';

export class VerdictEngine {
  determineVerdict(input: VerdictInput): Verdict {
    const verdict = VERDICTS.find(v => v.matches(input));

    return verdict?.name ?? Verdict.WRONG_ANSWER;
  }
  
  aggregate(
    results: TestcaseResult[],
  ): Verdict {
    if(results.length == 0) return Verdict.SYSTEM_ERROR;

    return results.reduce((highest, current) => {
      const currentPriority = VERDICT_MAP.get(current.verdict)?.priority ?? 50;
      const highestPriority = VERDICT_MAP.get(highest.verdict)?.priority ?? 50;

      return currentPriority > highestPriority
             ? current
             : highest;
    }).verdict
  }
}
