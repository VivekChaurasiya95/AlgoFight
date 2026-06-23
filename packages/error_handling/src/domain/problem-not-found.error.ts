import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

export class ProblemNotFoundError
    extends AppError
{
    readonly code =
        ErrorCode.RESOURCE_NOT_FOUND;

    readonly layer =
        ErrorLayer.DOMAIN;

    readonly statusCode = 404;

    constructor(
        problemId: string,
    ) {
        super(
            `Problem ${problemId} not found`,
        );
    }
}