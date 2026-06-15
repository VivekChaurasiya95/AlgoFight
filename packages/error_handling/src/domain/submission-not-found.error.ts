import { ErrorCode } from "../enums/error-code";
import { DomainError } from "./domain-error";
export class SubmissionNotFoundError extends DomainError {
    readonly code = ErrorCode.SUBMISSION_NOT_FOUND;
    readonly statusCode= 404;
    constructor(submissionId: string){
        super(`Submission ${submissionId} was not found!.`);
    };
}
