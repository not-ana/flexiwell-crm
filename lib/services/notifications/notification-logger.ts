// Notification Logger - SRP: Only handles logging notifications
import { getDatabase } from "@/lib/db/mongodb";

export interface NotificationLog {
  type: string;
  channel: "email" | "whatsapp" | "sms";
  clientId: string;
  clientName: string;
  recipient: string;
  subject?: string;
  content: string;
  status: "pending" | "sent" | "failed";
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface INotificationLogger {
  log(notification: NotificationLog): Promise<void>;
  getByClientId(clientId: string, limit?: number): Promise<NotificationLog[]>;
  getByType(type: string, limit?: number): Promise<NotificationLog[]>;
  getFailedNotifications(limit?: number): Promise<NotificationLog[]>;
}

export class NotificationLogger implements INotificationLogger {
  private collectionName = "notification_logs";

  async log(notification: NotificationLog): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection(this.collectionName).insertOne({
        ...notification,
        createdAt: notification.createdAt || new Date(),
      });
    } catch (error) {
      console.error("[NotificationLogger] Error logging notification:", error);
    }
  }

  async getByClientId(clientId: string, limit = 50): Promise<NotificationLog[]> {
    const db = await getDatabase();
    return db
      .collection<NotificationLog>(this.collectionName)
      .find({ clientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getByType(type: string, limit = 50): Promise<NotificationLog[]> {
    const db = await getDatabase();
    return db
      .collection<NotificationLog>(this.collectionName)
      .find({ type })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getFailedNotifications(limit = 100): Promise<NotificationLog[]> {
    const db = await getDatabase();
    return db
      .collection<NotificationLog>(this.collectionName)
      .find({ status: "failed" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const db = await getDatabase();

    const stats = await db
      .collection(this.collectionName)
      .aggregate([
        {
          $facet: {
            byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            byChannel: [{ $group: { _id: "$channel", count: { $sum: 1 } } }],
            byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
          },
        },
      ])
      .toArray();

    const result = {
      total: 0,
      sent: 0,
      failed: 0,
      byChannel: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    if (stats[0]) {
      for (const stat of stats[0].byStatus || []) {
        result.total += stat.count;
        if (stat._id === "sent") result.sent = stat.count;
        if (stat._id === "failed") result.failed = stat.count;
      }

      for (const stat of stats[0].byChannel || []) {
        result.byChannel[stat._id as string] = stat.count;
      }

      for (const stat of stats[0].byType || []) {
        result.byType[stat._id as string] = stat.count;
      }
    }

    return result;
  }
}

// Singleton instance
export const notificationLogger = new NotificationLogger();
