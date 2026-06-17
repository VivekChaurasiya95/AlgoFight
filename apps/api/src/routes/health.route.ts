import { FastifyInstance } from "fastify";

export async function healthRoutes(
    app: FastifyInstance,
) {
    app.get("/", async () => {
        return {
            message:
                "AlgoFight API running!!",
        };
    });
}