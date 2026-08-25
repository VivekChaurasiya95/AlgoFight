// apps/websocket/src/index.ts
import Redis from "ioredis"
import "@algofight/config"; // 👈 Add this at the very top
import { WebSocketServer, WebSocket } from "ws";
import { ConnectionManager } from "./server/connection-manager";
import { SocketHandler } from "./handlers/socket-handler";
import { logger } from "@algofight/logger";

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 4001;

const wss = new WebSocketServer({ port: WS_PORT });
const connectionManager = new ConnectionManager();
const socketHandler = new SocketHandler(connectionManager);

wss.on("connection", (socket: WebSocket) => {
    logger.info("New WebSocket connection established");
    const currentUserId: { value: string | null } = { value: null };

    socket.on("message", (data) => {
        socketHandler.handleMessage(socket, data.toString(), currentUserId);
    });

    socket.on("close", () => {
        socketHandler.handleDisconnect(socket);
        if (currentUserId.value) {
            connectionManager.unregisterUser(currentUserId.value, socket);
        }
    });

    socket.on("error", (error) => {
        logger.error({ error }, "WebSocket error occurred");
    });
});

logger.info({ port: WS_PORT }, "WebSocket server is running");

const redisSubscriber = new Redis(process.env.REDIS_URL || "redis://localhost:6379")

redisSubscriber.subscribe("battle-events", (err, count) => {
    if (err) {
        logger.error({ err }, "Failed to subscribe to battle-events channel");
        return;
    }
    else logger.info({ count }, "Subscribed to battle-events channel");
})

redisSubscriber.on("message", (channel, message) => {
    if (channel === "battle-events") {
        try {
            const payload = JSON.parse(message);
            
            // 1. Handle live score updates during the battle
            if (payload.event === "PLAYER_SOLVED") {
                connectionManager.broadcastToRoom(payload.roomId, "player_solved", payload);
                connectionManager.broadcastToRoom(payload.roomId, "battle_state_sync", payload.newState);
            }
            
            // 2. Handle the final results when the battle ends
            if (payload.event === "BATTLE_FINISHED") {
                connectionManager.broadcastToRoom(payload.roomId, "battle_over", {
                    winner: payload.winnerId,
                    reason: payload.reason,
                    finalState: payload.finalState
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

export { connectionManager };
// Trigger restart
