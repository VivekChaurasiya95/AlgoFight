import { FastifyInstance } from "fastify";
import { MatchmakingController } from "../controllers/matchmaking.controller";
import {
    JoinMatchmakingSchema,
    CancelMatchmakingSchema,
} from "../validators/matchmaking.validator";

const matchmakingController = new MatchmakingController();

export async function matchmakingRoutes(app: FastifyInstance) {
    // 1. Join matchmaking queue (Find match)
    app.post("/matchmaking/join", async (req) => {
        const body = JoinMatchmakingSchema.parse(req.body);
        return matchmakingController.joinQueue(body.userId);
    });

    // 2. Cancel matchmaking search
    app.post("/matchmaking/cancel", async (req) => {
        const body = CancelMatchmakingSchema.parse(req.body);
        return matchmakingController.cancelQueue(body.userId);
    });

    // 3. Check queue status
    app.get("/matchmaking/status/:userId", async (req) => {
        const { userId } = req.params as { userId: string };
        return matchmakingController.getStatus(userId);
    });
}
