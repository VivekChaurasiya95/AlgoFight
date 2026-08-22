import { SubmissionStatus } from "@algofight/types";
import { SubmissionEntity } from "../entities/submission.entity";
import { Verdict } from "@algofight/types";

export type IndividualExecutionMetric = {
    testCaseId?: string;
    verdict: Verdict;
    executionTime?: number;
    compileTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
}

export type SubmissionResult = {
    stdout: string | null;

    stderr: string | null;

    executionTime: number;

    exitCode: number;

    status: SubmissionStatus;


    passedCount: number;

    failedCount: number;

    verdict?: Verdict; // Use your actual Verdict type here
    cpuUsage?: number;
    memoryUsage?: number;
    compileTime?: number;
    individualExecutions?: IndividualExecutionMetric[];
};

export type CreateSubmissionInput = {
    userId: string,
    problemId: string,
    roomId?: string;
    language: string,
    code: string,
}
export interface SubmissionRepository {
    getStaleSubmissions(
        thresholdMs: number,
    ): Promise<string[]>
    createSubmission(
        input: CreateSubmissionInput,
    ): Promise<SubmissionEntity>;

    getSubmissionById(
        submissionId: string,
    ): Promise<SubmissionEntity | null>;
    updateStatus(
        submissionId: string,
        status: SubmissionStatus,
    ): Promise<SubmissionEntity>;

    completeSubmission(
        submissionId: string,
        result: SubmissionResult
    ): Promise<SubmissionEntity>;

    getAllSubmission(): Promise<SubmissionEntity[]>;
}