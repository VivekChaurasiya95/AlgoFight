// apps/api/src/routes/user.route.ts
import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/user.controller";
import { AvailablePlayersQuerySchema } from "../validators/user.validator";

const userController = new UserController();

export async function userRoutes(app: FastifyInstance) {
    // 1. Sync / Create user
    app.post("/users", async (req) => {
        const body = req.body as any;
        return userController.syncUser({
            email: body.email,
            username: body.username,
            displayName: body.displayName,
        });
    });

    // 2. Get User Profile by ID or Email
    app.get("/users/:id", async (req) => {
        const { id } = req.params as { id: string };
        return userController.getUserById(id);
    });

    // 3. Available Players
    app.get("/players/available", async (req) => {
        const query = AvailablePlayersQuerySchema.parse(req.query);
        return userController.getAvailablePlayers(query.excludeUserId, query.limit);
    });

    // 4. Global Leaderboard
    app.get("/leaderboard", async () => {
        return userController.getLeaderboard();
    });
}
