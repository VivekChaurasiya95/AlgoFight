export type VerdictInput = {
    isMatch: boolean;
    compilationError?: boolean;
    runtimeError?: boolean;
    timeLimitExceededError?: boolean;
    memoryLimitExceededError?: boolean;
    outputLimitExceededError?: boolean;
    systemError?: boolean;
};