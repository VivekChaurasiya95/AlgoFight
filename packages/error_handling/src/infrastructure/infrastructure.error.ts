import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

type InfrastructureErrorCode =
    | ErrorCode.INFRASTRUCTURE_ERROR
    | ErrorCode.DATABASE_ERROR
    | ErrorCode.DATABASE_CONNECTION_ERROR
    | ErrorCode.QUEUE_ERROR
    | ErrorCode.QUEUE_CONNECTION_ERROR
    | ErrorCode.UNKNOWN_ERROR;

export class InfrastructureError extends AppError {
    readonly layer =
        ErrorLayer.INFRASTRUCTURE;

    readonly statusCode = 500;

    constructor(
        message: string,
        readonly code:
            InfrastructureErrorCode =
                ErrorCode.INFRASTRUCTURE_ERROR,
    ) {
        super(message);
    }
}