import { FastifyInstance } from "fastify";
import { BattleController } from "../controllers/battle.controller";

const battleController = new BattleController();

export async function battleRoutes(app: FastifyInstance) {
    // 1. Create room
    app.post("/battle/rooms", async (req) => {
        const body = req.body as {
            hostId: string;
            maxPlayers?: number;
            timeLimitMinutes?: number;
            problemId?: string;
        };

        return battleController.createRoom(
            body.hostId,
            body.maxPlayers,
            body.timeLimitMinutes,
            body.problemId
        );
    });

    // 2. Get room details (by UUID or RoomCode like "BTL-ABCD")
    app.get("/battle/rooms/:idOrCode", async (req) => {
        const { idOrCode } = req.params as { idOrCode: string };
        return battleController.getRoom(idOrCode);
    });

    // 3. Join room
    app.post("/battle/rooms/:idOrCode/join", async (req) => {
        const { idOrCode } = req.params as { idOrCode: string };
        const body = req.body as { userId: string };
        return battleController.joinRoom(idOrCode, body.userId);
    });

    // 4. Leave room
    app.post("/battle/rooms/:id/leave", async (req) => {
        const { id } = req.params as { id: string };
        const body = req.body as { userId: string };
        return battleController.leaveRoom(id, body.userId);
    });

    // 5. Toggle Ready status
    app.post("/battle/rooms/:id/ready", async (req) => {
        const { id } = req.params as { id: string };
        const body = req.body as { userId: string; isReady: boolean };
        return battleController.setPlayerReady(id, body.userId, body.isReady);
    });

    // 6. Start Battle (Host only)
    app.post("/battle/rooms/:id/start", async (req) => {
        const { id } = req.params as { id: string };
        const body = req.body as { hostId: string; problemId?: string };
        return battleController.startBattle(id, body.hostId, body.problemId);
    });
}
