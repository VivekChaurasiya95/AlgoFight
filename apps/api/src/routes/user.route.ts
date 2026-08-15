import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/user.controller";

const userController = new UserController();

export async function userRoutes(app: FastifyInstance) {
    app.post(
        "/users",
        async (req) => {
            const body = req.body as { username: string, email: string };
            return userController.createUser(body.username, body.email);
        }
    );

    app.get(
        "/users/:id",
        async (req) => {
            const { id } = req.params as { id: string };
            return userController.getUserById(id);
        }
    );

    app.get(
        "/players/available",
        async (req) => {
            const query = req.query as {
                excludeUserId?: string,
                limit?: string,
            };

            const limit = query.limit ? parseInt(query.limit, 10) : 20;
            return userController.getAvailablePlayers(
                query.excludeUserId,
                limit
            )
        }
    )
}