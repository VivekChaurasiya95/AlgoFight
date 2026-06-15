import { SubmissionStatus } from "@algofight/types";
import { DomainError } from "./domain-error";
import { ErrorCode } from "../enums/error-code";
export class InvalidTransitionError extends DomainError {
    readonly code = ErrorCode.INVALID_TRANSITION;
    readonly statusCode = 409;
    constructor (
        current: SubmissionStatus,
        next: SubmissionStatus,
    ){
        super(
            `Invalid status transition: ${current} -> ${next}.`
        );
    }
}
