export interface SubmissionCompletedPayload {
    submissionId: string;
    verdict: string;
    executionTime: number;
    memoryUsage?: number;
    stdout?: string;
    stderr?: string
}