import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

type ApplicationErrorCode =
    | ErrorCode.APPLICATION_ERROR
    | ErrorCode.EXECUTION_FAILED
    | ErrorCode.UNSUPPORTED_LANGUAGE;

export class ApplicationError extends AppError {
    readonly layer =
        ErrorLayer.APPLICATION;

    readonly statusCode = 500;

    constructor(
        message: string,
        readonly code:
            ApplicationErrorCode =
                ErrorCode.APPLICATION_ERROR,
    ) {
        super(message);
    }
}