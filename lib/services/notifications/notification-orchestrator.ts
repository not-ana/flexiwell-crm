// Notification Orchestrator - OCP: Open for extension via new channels
import { getDatabase } from "@/lib/db/mongodb";
import type { Client, Booking, Class } from "@/lib/db/schemas";
import type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";
import { formatDateBR } from "@/lib/utils/date";

export type NotificationChannel = "email" | "whatsapp" | "sms" | "both" | "all";

interface NotificationPayload {
  type: string;
  clientId: string;
  data: NotificationData;
  channels?: NotificationChannel;
}

interface NotificationLog {
  type: string;
  channel: string;
  clientId: string;
  clientName: string;
  recipient: string;
  content: string;
  status: "sent" | "failed";
  error?: string;
  sentAt?: Date;
  createdAt: Date;
}

export class NotificationOrchestrator {
  private emailChannel: INotificationChannel | null = null;
  private whatsappChannel: INotificationChannel | null = null;
  private smsChannel: INotificationChannel | null = null;
  private studioName: string;
  private baseUrl: string;

  constructor(
    emailChannel?: INotificationChannel,
    whatsappChannel?: INotificationChannel,
    smsChannel?: INotificationChannel,
    studioName = "FlexiWell Studio",
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ) {
    this.emailChannel = emailChannel || null;
    this.whatsappChannel = whatsappChannel || null;
    this.smsChannel = smsChannel || null;
    this.studioName = studioName;
    this.baseUrl = baseUrl;
  }

  // OCP: Add new channels without modifying existing code
  setEmailChannel(channel: INotificationChannel): void {
    this.emailChannel = channel;
  }

  setWhatsAppChannel(channel: INotificationChannel): void {
    this.whatsappChannel = channel;
  }

  setSMSChannel(channel: INotificationChannel): void {
    this.smsChannel = channel;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const { type, clientId, data, channels = "both" } = payload;

    const client = await this.getClient(clientId);
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    const enrichedData = this.enrichData(data, client);
    const results: NotificationResult = { success: false };

    const shouldSendEmail = channels === "email" || channels === "both" || channels === "all";
    const shouldSendWhatsApp = channels === "whatsapp" || channels === "both" || channels === "all";
    const shouldSendSMS = channels === "sms" || channels === "all";

    if (shouldSendEmail && client.email) {
      const emailResult = await this.sendViaChannel(
        this.emailChannel,
        type,
        client.email,
        enrichedData,
        "email",
        clientId,
        client.name
      );
      if (emailResult.success) results.success = true;
    }

    if (shouldSendWhatsApp && client.phone) {
      const whatsappResult = await this.sendViaChannel(
        this.whatsappChannel,
        type,
        client.phone,
        enrichedData,
        "whatsapp",
        clientId,
        client.name
      );
      if (whatsappResult.success) results.success = true;
    }

    if (shouldSendSMS && client.phone) {
      const smsResult = await this.sendViaChannel(
        this.smsChannel,
        type,
        client.phone,
        enrichedData,
        "sms",
        clientId,
        client.name
      );
      if (smsResult.success) results.success = true;
    }

    return results;
  }

  private async sendViaChannel(
    channel: INotificationChannel | null,
    type: string,
    recipient: string,
    data: NotificationData,
    channelName: string,
    clientId: string,
    clientName: string
  ): Promise<NotificationResult> {
    if (!channel?.isConfigured()) {
      return { success: false, error: `${channelName} not configured` };
    }

    const result = await channel.send(type, recipient, data);
    await this.logNotification({
      type,
      channel: channelName,
      clientId,
      clientName,
      recipient,
      content: type,
      status: result.success ? "sent" : "failed",
      error: result.error,
      sentAt: result.success ? new Date() : undefined,
      createdAt: new Date(),
    });

    return result;
  }

  private enrichData(data: NotificationData, client: Client): NotificationData {
    return {
      ...data,
      clientName: client.name,
      studioName: this.studioName,
      dashboardUrl: `${this.baseUrl}/dashboard`,
      bookingUrl: `${this.baseUrl}/dashboard/classes/book`,
      renewUrl: `${this.baseUrl}/dashboard/plans`,
    };
  }

  private async getClient(clientId: string): Promise<Client | null> {
    const db = await getDatabase();
    const { ObjectId } = await import("mongodb");

    return db.collection<Client>("clients").findOne({
      _id: new ObjectId(clientId),
    });
  }

  private async logNotification(log: NotificationLog): Promise<void> {
    try {
      const db = await getDatabase();
      await db.collection("notification_logs").insertOne(log);
    } catch (error) {
      console.error("[Notification] Error logging:", error);
    }
  }

  // Convenience methods
  async sendBookingConfirmation(booking: Booking, classDoc: Class): Promise<NotificationResult> {
    return this.send({
      type: "booking_confirmation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        endTime: classDoc.endTime,
        instructorName: classDoc.instructorName,
        roomName: classDoc.location || "",
      },
    });
  }

  async sendBookingCancellation(
    booking: Booking,
    creditRefunded: boolean,
    reason?: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "booking_cancellation",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        reason,
        creditRefunded,
      },
    });
  }

  async sendBookingReminder(booking: Booking, timeUntil: string): Promise<NotificationResult> {
    return this.send({
      type: "booking_reminder",
      clientId: booking.clientId,
      data: {
        clientId: booking.clientId,
        className: booking.className,
        date: formatDateBR(booking.scheduledDate),
        startTime: booking.startTime,
        endTime: booking.endTime,
        instructorName: booking.instructorName,
        timeUntil,
      },
    });
  }

  async sendWaitlistSpotAvailable(
    clientId: string,
    classDoc: Class,
    confirmUrl: string
  ): Promise<NotificationResult> {
    return this.send({
      type: "waitlist_spot_available",
      clientId,
      data: {
        clientId,
        className: classDoc.title,
        date: formatDateBR(classDoc.scheduledDate),
        startTime: classDoc.startTime,
        confirmUrl,
      },
    });
  }

  async sendWelcome(client: Client, planName?: string, totalClasses?: number): Promise<NotificationResult> {
    return this.send({
      type: "welcome",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString() || "",
        planName,
        totalClasses,
      },
    });
  }

  async sendClassCancelled(
    classDoc: Class,
    enrolledClientIds: string[],
    reason?: string
  ): Promise<{ total: number; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const clientId of enrolledClientIds) {
      const result = await this.send({
        type: "class_cancelled",
        clientId,
        data: {
          clientId,
          className: classDoc.title,
          date: formatDateBR(classDoc.scheduledDate),
          startTime: classDoc.startTime,
          reason,
        },
      });

      if (result.success) sent++;
      else failed++;
    }

    return { total: enrolledClientIds.length, sent, failed };
  }

  async sendPaymentConfirmation(
    clientId: string,
    planName: string,
    amount: string,
    paymentMethod: string,
    classesAdded: number
  ): Promise<NotificationResult> {
    return this.send({
      type: "payment_confirmation",
      clientId,
      data: { clientId, planName, amount, paymentMethod, classesAdded },
    });
  }

  async sendPlanExpiring(client: Client, daysUntilExpiry: number): Promise<NotificationResult> {
    return this.send({
      type: "plan_expiring",
      clientId: client._id?.toString() || "",
      data: {
        clientId: client._id?.toString() || "",
        planName: client.plan.type,
        daysUntilExpiry,
        expiryDate: formatDateBR(client.plan.endDate),
        remainingClasses: client.plan.remainingClasses,
      },
    });
  }

  async sendCustomMessage(
    clientId: string,
    subject: string,
    message: string,
    channels: NotificationChannel = "both"
  ): Promise<NotificationResult> {
    return this.send({
      type: "custom",
      clientId,
      data: { clientId, subject, message },
      channels,
    });
  }
}
