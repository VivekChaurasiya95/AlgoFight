import { AppError } from "../base/app.error";
import { ErrorLayer } from "../enums/error-layer";

export abstract class DomainError extends AppError{
    readonly layer = ErrorLayer.DOMAIN;
};