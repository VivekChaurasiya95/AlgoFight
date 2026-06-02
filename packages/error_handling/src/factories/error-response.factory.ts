import { AppError } from "../base/app.error";

export type ErrorResponse = {
  code: string;

  layer: string;

  message: string;

  timestamp: string;
};

export class ErrorResponseFactory {
  static from(error: AppError): ErrorResponse {
    return {
      code: error.code,

      layer: error.layer,

      message: error.message,

      timestamp: new Date().toISOString(),
    };
  }
}