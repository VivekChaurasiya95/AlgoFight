import {SubmissionStatus} from "@algofight/types";
import { SubmissionEntity } from "../entities/submission.entity";
export type SubmissionResult = {
    stdout: string,
    executionTime: number;
};
export interface SubmissionRepository{
    createSubmission(): Promise<SubmissionEntity>;
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