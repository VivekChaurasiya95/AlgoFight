import { FastifyInstance } from "fastify";

import {
    AppError,
    InfrastructureError,
    ErrorCode,
} from "@algofight/error-handling";

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
                    : new InfrastructureError(
                        "Unexpected internal error",
                        ErrorCode.UNKNOWN_ERROR,
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