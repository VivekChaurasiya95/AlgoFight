import { redisConnection } from "@algofight/queue/src/client/redis";

export interface InboxNotification {
    id: string;
    userId: string;
    type: "CHALLENGE" | "CHALLENGE_ACCEPTED" | "CHALLENGE_DECLINED" | "BATTLE_START" | "BATTLE_RESULT" | "SYSTEM";
    title: string;
    message: string;
    read: boolean;
    createdAt: number;
    metadata?: Record<string, any>;
}

export class InboxNotificationService {
    private static MAX_ITEMS = 50;

    private static getKey(userId: string): string {
        return `user:notifications:${userId}`;
    }

    /**
     * Push a new notification to a user's persistent Redis inbox
     */
    static async pushNotification(params: {
        userId: string;
        type: InboxNotification["type"];
        title: string;
        message: string;
        metadata?: Record<string, any>;
    }): Promise<InboxNotification> {
        const { userId, type, title, message, metadata } = params;
        const notification: InboxNotification = {
            id: `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
            userId,
            type,
            title,
            message,
            read: false,
            createdAt: Date.now(),
            metadata: metadata || {},
        };

        const key = this.getKey(userId);
        const serialized = JSON.stringify(notification);

        await redisConnection.lpush(key, serialized);
        await redisConnection.ltrim(key, 0, this.MAX_ITEMS - 1);

        return notification;
    }

    /**
     * Retrieve notifications for a user
     */
    static async getNotifications(userId: string, limit = 50, offset = 0): Promise<{
        notifications: InboxNotification[];
        unreadCount: number;
        total: number;
    }> {
        const key = this.getKey(userId);
        const rawItems = await redisConnection.lrange(key, offset, offset + limit - 1);

        const notifications: InboxNotification[] = [];
        let unreadCount = 0;

        for (const raw of rawItems) {
            try {
                const item: InboxNotification = JSON.parse(raw);
                notifications.push(item);
                if (!item.read) unreadCount++;
            } catch (e) {
                // Ignore parse errors
            }
        }

        const total = await redisConnection.llen(key);

        return {
            notifications,
            unreadCount,
            total,
        };
    }

    /**
     * Mark a specific notification as read
     */
    static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
        const key = this.getKey(userId);
        const rawItems = await redisConnection.lrange(key, 0, -1);

        let updated = false;
        const newItems: string[] = [];

        for (const raw of rawItems) {
            try {
                const item: InboxNotification = JSON.parse(raw);
                if (item.id === notificationId && !item.read) {
                    item.read = true;
                    updated = true;
                }
                newItems.push(JSON.stringify(item));
            } catch (e) {
                newItems.push(raw);
            }
        }

        if (updated) {
            await redisConnection.del(key);
            if (newItems.length > 0) {
                await redisConnection.rpush(key, ...newItems);
            }
        }

        return updated;
    }

    /**
     * Mark all notifications for a user as read
     */
    static async markAllAsRead(userId: string): Promise<number> {
        const key = this.getKey(userId);
        const rawItems = await redisConnection.lrange(key, 0, -1);

        let count = 0;
        const newItems: string[] = [];

        for (const raw of rawItems) {
            try {
                const item: InboxNotification = JSON.parse(raw);
                if (!item.read) {
                    item.read = true;
                    count++;
                }
                newItems.push(JSON.stringify(item));
            } catch (e) {
                newItems.push(raw);
            }
        }

        if (count > 0) {
            await redisConnection.del(key);
            if (newItems.length > 0) {
                await redisConnection.rpush(key, ...newItems);
            }
        }

        return count;
    }

    /**
     * Clear all inbox notifications for a user
     */
    static async clearNotifications(userId: string): Promise<void> {
        const key = this.getKey(userId);
        await redisConnection.del(key);
    }
}
