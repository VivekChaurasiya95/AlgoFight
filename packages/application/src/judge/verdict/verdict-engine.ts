import { Verdict } from './verdict';
import { VERDICTS } from './verdict.registry';
import {VerdictInput} from "../verdict/verdict.types"
import { TestcaseResult } from '../models/testcase-result';

export class VerdictEngine {
  determineVerdict(input: VerdictInput): Verdict {
    const verdict = VERDICTS.find(v => v.matches(input));

    return verdict?.name ?? Verdict.WRONG_ANSWER;
  }
  
  
}
