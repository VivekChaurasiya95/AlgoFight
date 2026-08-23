import { FastifyInstance } from "fastify";
import { NotificationController } from "../controllers/notification.controller";

const notificationController = new NotificationController();

export async function notificationRoutes(app: FastifyInstance) {
    // 1. Get notifications for a user
    app.get("/notifications", async (req, reply) => {
        const query = req.query as { userId?: string; limit?: string; offset?: string };
        const userId = query.userId;
        if (!userId) {
            return reply.status(400).send({ message: "userId query parameter is required" });
        }
        const limit = query.limit ? parseInt(query.limit, 10) : 50;
        const offset = query.offset ? parseInt(query.offset, 10) : 0;

        return notificationController.getNotifications(userId, limit, offset);
    });

    // 2. Mark single notification as read
    app.patch("/notifications/:id/read", async (req, reply) => {
        const { id } = req.params as { id: string };
        const body = (req.body as { userId?: string }) || {};
        const userId = body.userId || (req.query as any)?.userId;

        if (!userId) {
            return reply.status(400).send({ message: "userId is required" });
        }

        return notificationController.markAsRead(userId, id);
    });

    // 3. Mark all notifications as read
    app.patch("/notifications/read-all", async (req, reply) => {
        const body = (req.body as { userId?: string }) || {};
        const userId = body.userId || (req.query as any)?.userId;

        if (!userId) {
            return reply.status(400).send({ message: "userId is required" });
        }

        return notificationController.markAllAsRead(userId);
    });

    // 4. Clear all notifications
    app.delete("/notifications", async (req, reply) => {
        const body = (req.body as { userId?: string }) || {};
        const userId = body.userId || (req.query as any)?.userId;

        if (!userId) {
            return reply.status(400).send({ message: "userId is required" });
        }

        return notificationController.clearNotifications(userId);
    });
}
