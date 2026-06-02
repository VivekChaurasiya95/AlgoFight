import { AppError } from "../base/app.error";
import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

export class ApplicationError extends AppError {
  readonly code: ErrorCode;

  readonly layer = ErrorLayer.APPLICATION;

  readonly statusCode = 500;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.APPLICATION_ERROR,
  ) {
    super(message);

    this.code = code;
  }
}