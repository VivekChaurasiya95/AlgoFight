import { SubmissionStatus } from "@algofight/types";

export interface TransitionResult {
    success: boolean;
    previous: SubmissionStatus;
    current: SubmissionStatus;
    message?: string;
}