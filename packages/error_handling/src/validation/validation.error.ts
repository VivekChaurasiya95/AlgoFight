import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

export class ValidationError extends AppError {
  readonly code: ErrorCode;

  readonly layer = ErrorLayer.VALIDATION;

  readonly statusCode = 400;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
  ) {
    super(message);

    this.code = code;
  }
}