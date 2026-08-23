import { InboxNotificationService } from "../services/inbox-notification.service";

export class NotificationController {
    async getNotifications(userId: string, limit?: number, offset?: number) {
        if (!userId) {
            return { notifications: [], unreadCount: 0, total: 0 };
        }
        return InboxNotificationService.getNotifications(userId, limit, offset);
    }

    async markAsRead(userId: string, notificationId: string) {
        if (!userId || !notificationId) {
            return { success: false };
        }
        const updated = await InboxNotificationService.markAsRead(userId, notificationId);
        return { success: updated };
    }

    async markAllAsRead(userId: string) {
        if (!userId) {
            return { count: 0 };
        }
        const count = await InboxNotificationService.markAllAsRead(userId);
        return { count };
    }

    async clearNotifications(userId: string) {
        if (!userId) {
            return { success: false };
        }
        await InboxNotificationService.clearNotifications(userId);
        return { success: true };
    }
}
