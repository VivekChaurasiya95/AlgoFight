import { SubmissionStatus } from "@algofight/types";
import { transitions } from "./submission-transition";

export const canTransition = (
    current: SubmissionStatus, 
    next: SubmissionStatus,
): boolean => {
    return transitions[current].includes(next);
};