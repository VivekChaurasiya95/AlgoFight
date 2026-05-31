

export interface SubmissionEntity {
    id: string,
    language: string,
    code: string,
    status: string,
    stdout: string | null,
    stderr: string | null,
    executionTime: number | null,
    retryCount: number,
    createdAt: Date,
    updatedAt: Date,
}