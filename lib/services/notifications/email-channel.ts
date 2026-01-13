// Email Notification Channel - SRP: Only handles email sending
import { Resend } from "resend";
import type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";
import { EMAIL_TEMPLATES } from "./templates/email-templates";

export class EmailChannel implements INotificationChannel {
  private resend: Resend | null = null;
  private studioName: string;
  private fromEmail: string;

  constructor(
    apiKey?: string,
    studioName = "FlexiWell Studio",
    fromEmail = "onboarding@resend.dev"
  ) {
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.studioName = studioName;
    this.fromEmail = fromEmail;
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async send(type: string, email: string, data: NotificationData): Promise<NotificationResult> {
    if (!this.resend) {
      return { success: false, error: "Email service not configured" };
    }

    try {
      const template = EMAIL_TEMPLATES[type as keyof typeof EMAIL_TEMPLATES];
      if (!template) {
        return { success: false, error: `Template not found: ${type}` };
      }

      const { subject, html } = template(data);

      const result = await this.resend.emails.send({
        from: `${this.studioName} <${this.fromEmail}>`,
        to: email,
        subject,
        html,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// Factory function for dependency injection
export function createEmailChannel(): INotificationChannel {
  return new EmailChannel(
    process.env.RESEND_API_KEY,
    "FlexiWell Studio",
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  );
}
