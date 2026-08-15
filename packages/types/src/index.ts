export enum SubmissionStatus {
    CREATED = "CREATED",
    QUEUED = "QUEUED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    RETRYING = "RETRYING",
    STALE = "STALE",
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
    ACCEPTED = "ACCEPTED",
    WRONG_ANSWER = "WRONG_ANSWER",
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
    RUNTIME_ERROR = "RUNTIME_ERROR",
    COMPILATION_ERROR = "COMPILATION_ERROR",
    SYSTEM_ERROR = "SYSTEM_ERROR",
}

export type UUID = string;
