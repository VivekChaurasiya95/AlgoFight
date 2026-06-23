import { SubmissionStatus } from "@algofight/types";

export interface SubmissionEntity {
    id: string,
    userId: string,
    problemId: string,
    language: string,
    code: string,
    status: SubmissionStatus,
    stdout: string | null,
    stderr: string | null,
    executionTime: number | null,
    exitCode: number | null,
    retryCount: number,
    createdAt: Date,
    updatedAt: Date,
}