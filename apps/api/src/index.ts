import { config } from "@algofight/config";
import { logger } from "@algofight/logger";
import fastify from "fastify";
import cors from "@fastify/cors";

import { registerErrorHandler } from "./plugins/error-handler";
import { healthRoutes } from "./routes/health.route";
import { submissionRoutes } from "./routes/submission.route";
import { problemRoutes } from "./routes/problem.route";
import { userRoutes } from "./routes/user.route";
import { battleRoutes } from "./routes/battle.route";
import { matchmakingRoutes } from "./routes/matchmaking.route";
const app = fastify();

const start = async () => {
    try {
        await app.register(cors, {
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        });

        await registerErrorHandler(app);

        app.register(healthRoutes);
        app.register(submissionRoutes);
        app.register(problemRoutes);
        app.register(userRoutes);
        app.register(battleRoutes);
        app.register(matchmakingRoutes);

        app.register(
            async (api) => {
                api.register(healthRoutes);
                api.register(submissionRoutes);
                api.register(problemRoutes);
                api.register(userRoutes);
                api.register(battleRoutes);
                api.register(matchmakingRoutes);
            },
            {
                prefix: "/api"
            },
        )

        await app.listen({
            port: config.port,
            host: "0.0.0.0",
        });

        logger.info({ port: config.port }, "API server started");
    } catch (error) {
        logger.error({ error }, "Failed to start API server");
        process.exit(1);
    }
};

start();
