import { config } from "@algofight/config";

import fastify from "fastify";

import {
    submissionRoutes,
} from "./routes/submission.route";

import {
    healthRoutes,
} from "./routes/health.route";

const app = fastify();

app.register(
    healthRoutes,
);

app.register(
    submissionRoutes,
);

const start = async () => {
    try {
        await app.listen({
            port: config.port,
            host: "0.0.0.0",
        });

        console.log(
            "Server running on port 3000",
        );
    } catch (err) {
        console.error(err);

        process.exit(1);
    }
};

start();