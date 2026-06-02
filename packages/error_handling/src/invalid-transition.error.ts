import { SubmissionStatus } from "@algofight/types";

export class InvalidTransitionError extends Error {
    constructor (
        current: SubmissionStatus,
        next: SubmissionStatus,
    ){
        super(
            `Invalid status transition: ${current} -> ${next}.`
        );
        this.name = "InvalidTransitionError";
    }
}