// SMS Notification Channel - SRP: Only handles SMS sending via Twilio
import type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";
import { SMS_TEMPLATES } from "./templates/sms-templates";

interface TwilioSMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class SMSChannel implements INotificationChannel {
  private config: TwilioSMSConfig | null = null;
  private baseUrl: string | null = null;

  constructor(config?: TwilioSMSConfig) {
    if (config?.accountSid && config?.authToken && config?.phoneNumber) {
      this.config = config;
      this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  async send(type: string, phone: string, data: NotificationData): Promise<NotificationResult> {
    if (!this.config || !this.baseUrl) {
      return { success: false, error: "SMS service not configured" };
    }

    try {
      const template = SMS_TEMPLATES[type as keyof typeof SMS_TEMPLATES];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const message = template(data);
      const formattedPhone = this.formatPhoneNumber(phone);

      const response = await fetch(`${this.baseUrl}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: this.config.phoneNumber,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: (error as { message?: string }).message || response.statusText
        };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Handle Brazilian numbers (11 digits without country code)
    if (cleaned.length === 11 && cleaned.startsWith("9")) {
      return `+55${cleaned}`;
    }

    // Handle Brazilian numbers with area code (11 digits)
    if (cleaned.length === 11 && !cleaned.startsWith("55")) {
      return `+55${cleaned}`;
    }

    // Handle numbers that already have country code
    if (cleaned.length >= 12) {
      return `+${cleaned}`;
    }

    // Default: assume it needs country code
    return `+${cleaned}`;
  }
}

// Factory function for dependency injection
export function createSMSChannel(): INotificationChannel {
  const config: TwilioSMSConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_PHONE_NUMBER || "",
  };

  return new SMSChannel(
    config.accountSid && config.authToken && config.phoneNumber ? config : undefined
  );
}
