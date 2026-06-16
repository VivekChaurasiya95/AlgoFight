import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

type ValidationErrorCode =
    | ErrorCode.VALIDATION_ERROR
    | ErrorCode.INVALID_REQUEST_BODY
    | ErrorCode.INVALID_INPUT;

export class ValidationError extends AppError {
    readonly layer =
        ErrorLayer.VALIDATION;

    readonly statusCode = 400;

    constructor(
        message: string,
        readonly code:
            ValidationErrorCode =
                ErrorCode.VALIDATION_ERROR,
    ) {
        super(message);
    }
}