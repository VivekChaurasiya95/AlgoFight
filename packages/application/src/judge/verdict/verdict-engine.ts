import { Verdict } from './verdict';

export type VerdictInput = {
  isMatch: boolean;

  compilationError?: boolean;

  runtimeError?: boolean;

  timeLimitExceededError?: boolean;

  memoryLimitExceededError?: boolean;
};

export class VerdictEngine {
  determineVerdict(input: VerdictInput): Verdict {
    if (input.compilationError) {
      return Verdict.COMPILATION_ERROR;
    }

    if (input.runtimeError) {
      return Verdict.RUNTIME_ERROR;
    }

    if (input.timeLimitExceededError) {
      return Verdict.TIME_LIMIT_EXCEEDED;
    }

    if (input.memoryLimitExceededError) {
      return Verdict.MEMORY_LIMIT_EXCEEDED;
    }

    if (input.isMatch) {
      return Verdict.ACCEPTED;
    }

    return Verdict.WRONG_ANSWER;
  }
}
