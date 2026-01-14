// WhatsApp Notification Channel - SRP: Only handles WhatsApp sending
import type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";
import type { WhatsAppCredentials, TwilioCredentials, CloudApiCredentials } from "@/lib/whatsapp/types";
import { formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { WHATSAPP_TEMPLATES } from "./templates/whatsapp-templates";

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

      let response: Response;

      if (this.credentials.provider === "cloud-api") {
        // Send via Cloud API
        const creds = this.credentials as CloudApiCredentials;
        const normalizedPhone = formattedPhone.replace(/\D/g, "");

        response = await fetch(
          `https://graph.facebook.com/v18.0/${creds.phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${creds.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: normalizedPhone,
              type: "text",
              text: { body: message },
            }),
          }
        );

        if (!response.ok) {
          const result = await response.json();
          const error = result as { error?: { message?: string } };
          return { success: false, error: error.error?.message || "Failed to send" };
        }
      } else {
        // Send via Twilio
        const creds = this.credentials as TwilioCredentials;
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;

        const body = new URLSearchParams({
          From: `whatsapp:${creds.phoneNumber}`,
          To: `whatsapp:${formattedPhone}`,
          Body: message,
        });

        response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${creds.accountSid}:${creds.authToken}`
            ).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!response.ok) {
          const result = await response.json();
          return { success: false, error: (result as { message?: string }).message || "Failed to send" };
        }
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
