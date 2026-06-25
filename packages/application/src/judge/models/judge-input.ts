export interface JudgeInput {
  testcaseId: string;

  expectedOutput: string;
  actualOutput: string;

  executionTime: number;
  memoryUsed: number;

  compilationError?: boolean;
  runtimeError?: boolean;
  timeLimitExceededError?: boolean;
  memoryLimitExceededError?: boolean;

  exitCode?: number;
}