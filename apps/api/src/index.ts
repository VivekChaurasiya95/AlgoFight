import { config } from "@algofight/config";
import { logger } from "@algofight/logger";

import fastify from "fastify";

import { registerErrorHandler } from "./plugins/error-handler";

import {
    submissionRoutes,
} from "./routes/submission.route";

import {
    healthRoutes,
} from "./routes/health.route";

const app = fastify();

const start = async () => {
    try {

        await registerErrorHandler(
            app,
        );

        app.register(
            healthRoutes,
        );

        app.register(
            submissionRoutes,
        );

        await app.listen({
            port: config.port,
            host: "0.0.0.0",
        });

        logger.info(
            {
                port: config.port,
            },
            "API server started",
        );

    } catch (error) {

        logger.error(
            { error },
            "Failed to start API server",
        );

        process.exit(1);
    }
};

process.on(
    "SIGINT",
    async () => {

        logger.info(
            "API shutting down",
        );

        await app.close();

        process.exit(0);
    },
);

process.on(
    "SIGTERM",
    async () => {

        logger.info(
            "API shutting down",
        );

        await app.close();

        process.exit(0);
    },
);

start();