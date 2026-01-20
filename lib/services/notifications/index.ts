// Notifications Module - Factory for creating notification service with DIP
import { NotificationOrchestrator } from "./notification-orchestrator";
import { createEmailChannel } from "./email-channel";
import { createWhatsAppChannel } from "./whatsapp-channel";
import { createSMSChannel } from "./sms-channel";

export { NotificationOrchestrator } from "./notification-orchestrator";
export { EmailChannel, createEmailChannel } from "./email-channel";
export { WhatsAppChannel, createWhatsAppChannel } from "./whatsapp-channel";
export { SMSChannel, createSMSChannel } from "./sms-channel";
export { EMAIL_TEMPLATES } from "./templates/email-templates";
export { WHATSAPP_TEMPLATES } from "./templates/whatsapp-templates";
export { SMS_TEMPLATES } from "./templates/sms-templates";

// Singleton instance with lazy initialization
let notificationServiceInstance: NotificationOrchestrator | null = null;

export async function getNotificationService(): Promise<NotificationOrchestrator> {
  if (!notificationServiceInstance) {
    const emailChannel = createEmailChannel();
    const whatsappChannel = await createWhatsAppChannel();
    const smsChannel = createSMSChannel();

    notificationServiceInstance = new NotificationOrchestrator(
      emailChannel,
      whatsappChannel,
      smsChannel
    );
  }
  return notificationServiceInstance;
}

// Synchronous factory for backward compatibility
export function createNotificationService(): NotificationOrchestrator {
  const emailChannel = createEmailChannel();
  const smsChannel = createSMSChannel();
  return new NotificationOrchestrator(emailChannel, undefined, smsChannel);
}
