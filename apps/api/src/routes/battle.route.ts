import { FastifyInstance } from "fastify";
import { BattleController } from "../controllers/battle.controller";
import {
    CreateBattleRoomSchema,
    JoinRoomSchema,
    LeaveRoomSchema,
    ReadyRoomSchema,
    StartBattleSchema,
} from "../validators/battle.validator";

const battleController = new BattleController();

export async function battleRoutes(app: FastifyInstance) {
    // 1. Create room
    app.post("/battle/rooms", async (req) => {
        const body = CreateBattleRoomSchema.parse(req.body);
        return battleController.createRoom(
            body.hostId,
            body.maxPlayers,
            body.timeLimitMinutes,
            body.difficulty,
            body.questionCount,
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
        const body = JoinRoomSchema.parse(req.body);
        return battleController.joinRoom(idOrCode, body.userId);
    });

    // 4. Leave room
    app.post("/battle/rooms/:id/leave", async (req) => {
        const { id } = req.params as { id: string };
        const body = LeaveRoomSchema.parse(req.body);
        return battleController.leaveRoom(id, body.userId);
    });

    // 5. Toggle Ready status
    app.post("/battle/rooms/:id/ready", async (req) => {
        const { id } = req.params as { id: string };
        const body = ReadyRoomSchema.parse(req.body);
        return battleController.setPlayerReady(id, body.userId, body.isReady);
    });

    // 6. Start Battle (Host only)
    app.post("/battle/rooms/:id/start", async (req) => {
        const { id } = req.params as { id: string };
        const body = StartBattleSchema.parse(req.body);
        return battleController.startBattle(id, body.hostId, body.problemId);
    });

    // 7. Finish Battle
    app.post("/battle/rooms/:id/finish", async (req) => {
        const { id } = req.params as { id: string };
        return battleController.finishBattle(id);
    });
}
