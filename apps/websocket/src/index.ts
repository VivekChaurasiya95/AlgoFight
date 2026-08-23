// apps/websocket/src/index.ts
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

export { connectionManager };
// Trigger restart
