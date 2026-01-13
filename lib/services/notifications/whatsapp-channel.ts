// WhatsApp Notification Channel - SRP: Only handles WhatsApp sending
import type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";
import { formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { WHATSAPP_TEMPLATES } from "./templates/whatsapp-templates";

interface WhatsAppCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class WhatsAppChannel implements INotificationChannel {
  private credentials: WhatsAppCredentials | null = null;

  constructor(credentials?: WhatsAppCredentials) {
    this.credentials = credentials || null;
  }

  isConfigured(): boolean {
    return this.credentials !== null;
  }

  async send(type: string, phone: string, data: NotificationData): Promise<NotificationResult> {
    if (!this.credentials) {
      return { success: false, error: "WhatsApp service not configured" };
    }

    try {
      const template = WHATSAPP_TEMPLATES[type as keyof typeof WHATSAPP_TEMPLATES];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const message = template(data);
      const formattedPhone = formatPhoneForWhatsApp(phone);

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.credentials.accountSid}/Messages.json`;

      const body = new URLSearchParams({
        From: `whatsapp:${this.credentials.phoneNumber}`,
        To: `whatsapp:${formattedPhone}`,
        Body: message,
      });

      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.credentials.accountSid}:${this.credentials.authToken}`
          ).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.message || "Failed to send" };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// Factory function for dependency injection
export async function createWhatsAppChannel(): Promise<INotificationChannel> {
  const { getWhatsAppCredentials } = await import("@/lib/integrations/credentials");
  const credentials = await getWhatsAppCredentials();
  return new WhatsAppChannel(credentials || undefined);
}
