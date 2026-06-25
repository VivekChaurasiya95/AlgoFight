import { Verdict } from "./verdict";
import { VerdictRule } from "./verdict.interface";
export const VERDICTS: readonly VerdictRule[] = [
    {
        name: Verdict.COMPILATION_ERROR,
        priority: 100,
        matches: input => !!input.compilationError,
    },
    {
        name: Verdict.RUNTIME_ERROR,
        priority: 90,
        matches: input => !!input.runtimeError,
    },
    {
        name: Verdict.TIME_LIMIT_EXCEEDED,
        priority: 80,
        matches: input => !!input.timeLimitExceededError,
    },
    {
        name: Verdict.MEMORY_LIMIT_EXCEEDED,
        priority: 70,
        matches: input => !!input.memoryLimitExceededError,
    },
    {
        name: Verdict.ACCEPTED,
        priority: 10,
        matches: input => input.isMatch,
    },
];