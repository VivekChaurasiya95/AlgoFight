export enum SubmissionStatus {
    CREATED = "CREATED",
    QUEUED = "QUEUED",
    COMPILING = "COMPILING",
    RUNNING = "RUNNING",
    EVALUATING = "EVALUATING",
    FINALIZED = "FINALIZED",
}

export enum SystemEvent {
    SUBMISSION_CREATED = "submission.created",
    SUBMISSION_QUEUED = "submission.queued",
    SUBMISSION_PROCESSING = "submission.processing",
    SUBMISSION_COMPLETED = "submission.completed",
    SUBMISSION_FAILED = "submission.failed",
    SUBMISSION_RETRYING = "submission.retrying",
    SUBMISSION_STALE = "submission.stale",
    WORKER_HEARTBEAT = "worker.heartbeat",
    SYSTEM_ALERT = "system.alert",
}

export enum Verdict {
    QUEUED = "QUEUED",
    COMPILING = "COMPILING",
    COMPILATION_ERROR = "COMPILATION_ERROR",
    RUNNING = "RUNNING",
    ACCEPTED = "ACCEPTED",
    WRONG_ANSWER = "WRONG_ANSWER",
    RUNTIME_ERROR = "RUNTIME_ERROR",
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
    OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED",
    SYSTEM_ERROR = "SYSTEM_ERROR",
}

export type UUID = string;

export interface ExecutionMetrics {
    executionTime: number;
    memoryUsage: number;
    cpuUsage?: number;
    exitCode?: number | null;
    signal?: string | null;
    stdout?: string;
    stderr?: string;
    compilationTime?: number;
}

export interface TestCaseResult {
    testCaseId: string;
    status: Verdict;
    passed: boolean;
    expectedOutput?: string;
    actualOutput?: string;
    error?: string;
    metrics?: ExecutionMetrics;
}

export interface EvaluationResult {
    submissionId: string;
    verdict: Verdict;
    compilation?: {
        output: string;
        error?: string;
        success: boolean;
        timeMs?: number;
    };
    testCases?: TestCaseResult[];
    execution?: ExecutionMetrics;
    resourceUsage?: {
        maxMemory: number;
        totalTime: number;
    };
    metadata?: Record<string, any>;
}

export interface TestCase {
    id: string;
    input: string;
    expectedOutput: string;
}

export interface SubmissionPayload {
    submissionId: string;
    language: string;
    code: string;
    testCases: TestCase[];
    timeLimitMs?: number;
    memoryLimitBytes?: number;
}

export interface EvaluationServiceContract {
    evaluateSubmission(payload: SubmissionPayload, onProgress?: any, mode?: "SAMPLE" | "SUBMIT"): Promise<EvaluationResult>;
}
