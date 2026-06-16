import { ErrorCode } from "../enums/error-code";
import { ErrorLayer } from "../enums/error-layer";

export abstract class AppError extends Error {
    abstract readonly code: ErrorCode;

    abstract readonly layer: ErrorLayer;

    abstract readonly statusCode: number;

    constructor(message: string) {
        super(message);

        this.name = new.target.name;

        Object.setPrototypeOf(
            this,
            new.target.prototype,
        );

        if ("captureStackTrace" in Error) {
            Error.captureStackTrace(
                this,
                new.target,
            );
        }
    }
}