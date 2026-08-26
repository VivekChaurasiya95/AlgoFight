import Redis from "ioredis";
import "@algofight/config";
import { WebSocketServer, WebSocket } from "ws";
import { ConnectionManager } from "./server/connection-manager";
import { SocketHandler } from "./handlers/socket-handler";
import { logger } from "@algofight/logger";

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4001;

const wss = new WebSocketServer({ port: WS_PORT });
const connectionManager = new ConnectionManager();
const socketHandler = new SocketHandler(connectionManager);

// 💓 30-Second Ping/Pong Heartbeat to prune dead socket connections
const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
            logger.info("Terminating inactive zombie socket");
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wss.on("close", () => {
    clearInterval(heartbeatInterval);
});

wss.on("connection", (socket: any) => {
    socket.isAlive = true;
    socket.on("pong", () => {
        socket.isAlive = true;
    });

    logger.info("New WebSocket connection established");
    const currentUserId: { value: string | null } = { value: null };

    socket.on("message", (data: any) => {
        socketHandler.handleMessage(socket, data.toString(), currentUserId);
    });

    socket.on("close", () => {
        socketHandler.handleDisconnect(socket);
        if (currentUserId.value) {
            connectionManager.unregisterUser(currentUserId.value, socket);
        }
    });

    socket.on("error", (error: any) => {
        logger.error({ error }, "WebSocket error occurred");
    });
});

logger.info({ port: WS_PORT }, "WebSocket server is running with active heartbeat");

const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redisSubscriber.subscribe("battle-events", (err, count) => {
    if (err) logger.error({ err }, "Failed to subscribe to battle-events channel");
    else logger.info({ count }, "Subscribed to battle-events channel");
});

redisSubscriber.on("message", (channel, message) => {
    if (channel === "battle-events") {
        try {
            const payload = JSON.parse(message);

            if (payload.event === "PLAYER_SOLVED") {
                connectionManager.broadcastToRoom(payload.roomId, "player_solved", payload);
                connectionManager.broadcastToRoom(payload.roomId, "battle_state_sync", payload.newState);
            }

            if (payload.event === "BATTLE_FINISHED") {
                connectionManager.broadcastToRoom(payload.roomId, "battle_over", {
                    winner: payload.winnerId,
                    reason: payload.reason,
                    finalState: payload.finalState,
                });

                if (payload.eloResults) {
                    connectionManager.broadcastToRoom(payload.roomId, "rating_updates", payload.eloResults);
                }

                for (const player of payload.finalState.players) {
                    if (player.userId !== "bot") {
                        connectionManager.updatePresenceStatus(player.userId, "AVAILABLE");
                    }
                }
            }
        } catch (error) {
            logger.error({ error }, "Error parsing battle-events message");
        }
    }
});

// 🛑 Graceful Shutdown for WebSocket Gateway
const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down WebSocket Gateway...");
    clearInterval(heartbeatInterval);

    wss.clients.forEach((client) => {
        client.close(1001, "Server shutting down");
    });

    wss.close(() => {
        logger.info("WebSocket server closed");
    });

    await redisSubscriber.quit();
    logger.info("Redis subscriber connection closed");
    process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export { connectionManager };
