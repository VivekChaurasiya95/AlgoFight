import { FastifyInstance } from "fastify";

import {
    AppError,
    InfrastructureError,
    ValidationError,
    ErrorCode,
} from "@algofight/error-handling";
import { logger } from "@algofight/logger";
export async function registerErrorHandler(
    app: FastifyInstance,
) {
    app.setErrorHandler(
        async (
            error,
            request,
            reply,
        ) => {

            const appError =
                error instanceof AppError
                    ? error
                    : error instanceof Error && error.message
                        ? new ValidationError(error.message, ErrorCode.VALIDATION_ERROR)
                        : new InfrastructureError(
                            "Unexpected internal error",
                            ErrorCode.UNKNOWN_ERROR,
                        );
            logger.error(
                {
                    error,
                    method: request.method,
                    url: request.url,
                },
                "Request failed",
            );
            return reply
                .status(
                    appError.statusCode,
                )
                .send({
                    success: false,

                    code:
                        appError.code,

                    message:
                        appError.message,

                    layer:
                        appError.layer,
                });
        },
    );
}