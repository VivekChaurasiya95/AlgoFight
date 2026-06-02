import {SubmissionStatus} from "@algofight/types";
import { SubmissionEntity } from "../entities/submission.entity";
export type SubmissionResult = {
    stdout: string | null,
    stderr: string | null,
    executionTime: number;
    exitCode: number,
    status: SubmissionStatus,
};
export interface SubmissionRepository{
    createSubmission(): Promise<SubmissionEntity>;

    getSubmissionById(
        submissionId: string,
    ): Promise <SubmissionEntity | null>;
    updateStatus(
        submissionId: string,
        status: SubmissionStatus,
    ): Promise <SubmissionEntity>;

    completeSubmission(
        submissionId: string,
        result: SubmissionResult
    ): Promise <SubmissionEntity>;

    getAllSubmission(): Promise <SubmissionEntity[]>;
}