import { WebSocket } from "ws";
import { ConnectionManager } from "../server/connection-manager";
import { logger } from "@algofight/logger";

export interface ClientMessage {
    action: "auth" | "join_room" | "leave_room" | "ping";
    userId?: string;
    roomId?: string;
    payload?: any;
}

export class SocketHandler {
    constructor(private readonly connectionManager: ConnectionManager) { }

    handleMessage(socket: WebSocket, data: string, currentUserId: { value: string | null }): void {
        try {
            const message: ClientMessage = JSON.parse(data);

            switch (message.action) {
                case "auth":
                    if (message.userId) {
                        currentUserId.value = message.userId;
                        this.connectionManager.registerUser(message.userId, socket);
                        socket.send(JSON.stringify({ event: "authenticated", userId: message.userId }));
                    }
                    break;

                case "join_room":
                    if (message.roomId) {
                        this.connectionManager.joinRoom(message.roomId, socket);
                        socket.send(JSON.stringify({ event: "room_joined", roomId: message.roomId }));
                    }
                    break;

                case "leave_room":
                    if (message.roomId) {
                        this.connectionManager.leaveRoom(message.roomId, socket);
                        socket.send(JSON.stringify({ event: "room_left", roomId: message.roomId }));
                    }
                    break;

                case "ping":
                    socket.send(JSON.stringify({ event: "pong", timestamp: Date.now() }));
                    break;

                default:
                    logger.warn({ message }, "Unknown socket action received");
            }
        } catch (error) {
            logger.error({ error }, "Error parsing socket message");
            socket.send(JSON.stringify({ event: "error", message: "Invalid JSON format" }));
        }
    }
}
