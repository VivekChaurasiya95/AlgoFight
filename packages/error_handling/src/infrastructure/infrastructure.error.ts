import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

export class InfrastructureError extends AppError {
  readonly code: ErrorCode;

  readonly layer = ErrorLayer.INFRASTRUCTURE;

  readonly statusCode = 500;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INFRASTRUCTURE_ERROR,
  ) {
    super(message);

    this.code = code;
  }
}