import { WebSocket } from "ws";
import { logger } from "@algofight/logger";

export class ConnectionManager {
    // Map of userId -> WebSocket
    private readonly userSockets = new Map<string, WebSocket>();

    // Map of roomId -> Set of WebSockets
    private readonly roomSockets = new Map<string, Set<WebSocket>>();

    // Register user socket on connect/auth
    registerUser(userId: string, socket: WebSocket): void {
        this.userSockets.set(userId, socket);
        logger.info({ userId }, "User connected to WebSocket");
    }

    // Unregister user socket on disconnect
    unregisterUser(userId: string, socket: WebSocket): void {
        if (this.userSockets.get(userId) === socket) {
            this.userSockets.delete(userId);
        }

        // Clean up from all rooms
        for (const [roomId, sockets] of this.roomSockets.entries()) {
            if (sockets.has(socket)) {
                sockets.delete(socket);
                if (sockets.size === 0) {
                    this.roomSockets.delete(roomId);
                }
            }
        }

        logger.info({ userId }, "User disconnected from WebSocket");
    }

    // Join a battle room channel
    joinRoom(roomId: string, socket: WebSocket): void {
        if (!this.roomSockets.has(roomId)) {
            this.roomSockets.set(roomId, new Set());
        }
        this.roomSockets.get(roomId)!.add(socket);
        logger.debug({ roomId }, "Socket joined room channel");
    }

    // Leave a battle room channel
    leaveRoom(roomId: string, socket: WebSocket): void {
        const sockets = this.roomSockets.get(roomId);
        if (sockets) {
            sockets.delete(socket);
            if (sockets.size === 0) {
                this.roomSockets.delete(roomId);
            }
        }
    }

    // Send an event to a single user
    sendToUser<T>(userId: string, event: string, payload: T): boolean {
        const socket = this.userSockets.get(userId);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event, payload }));
            return true;
        }
        return false;
    }

    // Broadcast an event to all participants in a room
    broadcastToRoom<T>(roomId: string, event: string, payload: T, excludeSocket?: WebSocket): void {
        const sockets = this.roomSockets.get(roomId);
        if (!sockets) return;

        const message = JSON.stringify({ event, payload });
        for (const socket of sockets) {
            if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
                socket.send(message);
            }
        }
    }

    // Check if user is online
    isUserOnline(userId: string): boolean {
        const socket = this.userSockets.get(userId);
        return !!socket && socket.readyState === WebSocket.OPEN;
    }
}
