// Waitlist Service - SRP: Only handles waitlist operations
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { Class, Client, WaitlistEntry } from "@/lib/db/schemas";
import { getNotificationService } from "../notifications";

export interface AddToWaitlistResult {
  success: boolean;
  position?: number;
  error?: string;
}

export interface WaitlistNotificationResult {
  notified: boolean;
  clientId?: string;
  error?: string;
}

export class WaitlistService {
  private baseUrl: string;

  constructor(baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  async addToWaitlist(clientId: string, classId: string): Promise<AddToWaitlistResult> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return { success: false, error: "Aula não encontrada" };
    }

    const client = await db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });

    if (!client) {
      return { success: false, error: "Cliente não encontrado" };
    }

    // Check if already in waitlist
    const alreadyInWaitlist = classDoc.waitlist?.some((w) => w.clientId === clientId);
    if (alreadyInWaitlist) {
      return { success: false, error: "Você já está na lista de espera desta aula" };
    }

    // Check if already enrolled
    const alreadyEnrolled = classDoc.enrolledClients?.some(
      (e) => e.clientId === clientId && e.status === "confirmed"
    );
    if (alreadyEnrolled) {
      return { success: false, error: "Você já está inscrito nesta aula" };
    }

    await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $push: {
          waitlist: {
            clientId,
            clientName: client.name,
            addedAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      }
    );

    const position = (classDoc.waitlist?.length || 0) + 1;

    return { success: true, position };
  }

  async removeFromWaitlist(clientId: string, classId: string): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();

    const result = await db.collection<Class>("classes").updateOne(
      { _id: new ObjectId(classId) },
      {
        $pull: { waitlist: { clientId } },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount === 0) {
      return { success: false, error: "Entrada não encontrada na lista de espera" };
    }

    return { success: true };
  }

  async getWaitlistPosition(clientId: string, classId: string): Promise<number | null> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc?.waitlist) return null;

    const index = classDoc.waitlist.findIndex((w) => w.clientId === clientId);
    return index >= 0 ? index + 1 : null;
  }

  async getClassWaitlist(classId: string): Promise<Class["waitlist"]> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    return classDoc?.waitlist || [];
  }

  async notifyNextInLine(classId: string): Promise<WaitlistNotificationResult> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc || !classDoc.waitlist || classDoc.waitlist.length === 0) {
      return { notified: false, error: "Lista de espera vazia" };
    }

    // Check if there's available space
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return { notified: false, error: "Aula ainda está lotada" };
    }

    const firstInLine = classDoc.waitlist[0];
    const confirmUrl = `${this.baseUrl}/dashboard/classes/book?confirm=${classDoc._id}`;

    // Send notification
    try {
      const notificationService = await getNotificationService();
      await notificationService.sendWaitlistSpotAvailable(firstInLine.clientId, classDoc, confirmUrl);

      // Create notification record for tracking
      await db.collection("waitlist_notifications").insertOne({
        type: "waitlist_spot_available",
        clientId: firstInLine.clientId,
        clientName: firstInLine.clientName,
        classId: classDoc._id?.toString(),
        className: classDoc.title,
        classDate: classDoc.scheduledDate,
        classTime: classDoc.startTime,
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours to respond
      });

      return { notified: true, clientId: firstInLine.clientId };
    } catch (error) {
      console.error("Error notifying waitlist:", error);
      return { notified: false, error: "Erro ao enviar notificação" };
    }
  }

  async confirmWaitlistSpot(
    clientId: string,
    classId: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();

    const classDoc = await db.collection<Class>("classes").findOne({
      _id: new ObjectId(classId),
    });

    if (!classDoc) {
      return { success: false, error: "Aula não encontrada" };
    }

    // Check if client is first in waitlist
    const isFirstInLine = classDoc.waitlist?.[0]?.clientId === clientId;
    if (!isFirstInLine) {
      return { success: false, error: "Você não é o próximo na lista de espera" };
    }

    // Check if there's space
    if (classDoc.currentEnrollment >= classDoc.maxCapacity) {
      return { success: false, error: "Não há mais vagas disponíveis" };
    }

    // Check if notification hasn't expired
    const notification = await db.collection("waitlist_notifications").findOne({
      clientId,
      classId: classDoc._id?.toString(),
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!notification) {
      return { success: false, error: "A oferta expirou ou já foi utilizada" };
    }

    // Update notification status
    await db.collection("waitlist_notifications").updateOne(
      { _id: notification._id },
      { $set: { status: "confirmed", respondedAt: new Date() } }
    );

    // Remove from waitlist
    await this.removeFromWaitlist(clientId, classId);

    return { success: true };
  }

  async declineWaitlistSpot(
    clientId: string,
    classId: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase();

    // Update notification status
    await db.collection("waitlist_notifications").updateOne(
      { clientId, classId, status: "pending" },
      { $set: { status: "declined", respondedAt: new Date() } }
    );

    // Remove from waitlist
    await this.removeFromWaitlist(clientId, classId);

    // Notify next in line
    await this.notifyNextInLine(classId);

    return { success: true };
  }

  async processExpiredNotifications(): Promise<number> {
    const db = await getDatabase();

    const expired = await db
      .collection("waitlist_notifications")
      .find({
        status: "pending",
        expiresAt: { $lt: new Date() },
      })
      .toArray();

    let processed = 0;

    for (const notification of expired) {
      // Mark as expired
      await db.collection("waitlist_notifications").updateOne(
        { _id: notification._id },
        { $set: { status: "expired" } }
      );

      // Remove from waitlist
      if (notification.clientId && notification.classId) {
        await this.removeFromWaitlist(notification.clientId, notification.classId);
      }

      // Notify next in line
      if (notification.classId) {
        await this.notifyNextInLine(notification.classId);
      }

      processed++;
    }

    return processed;
  }
}

// Factory function
export function createWaitlistService(): WaitlistService {
  return new WaitlistService();
}

// Singleton instance
export const waitlistService = new WaitlistService();
