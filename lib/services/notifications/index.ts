// Notifications Module - Factory for creating notification service with DIP
import { NotificationOrchestrator } from "./notification-orchestrator";
import { createEmailChannel } from "./email-channel";
import { createWhatsAppChannel } from "./whatsapp-channel";

export { NotificationOrchestrator } from "./notification-orchestrator";
export { EmailChannel, createEmailChannel } from "./email-channel";
export { WhatsAppChannel, createWhatsAppChannel } from "./whatsapp-channel";
export { EMAIL_TEMPLATES } from "./templates/email-templates";
export { WHATSAPP_TEMPLATES } from "./templates/whatsapp-templates";

// Singleton instance with lazy initialization
let notificationServiceInstance: NotificationOrchestrator | null = null;

export async function getNotificationService(): Promise<NotificationOrchestrator> {
  if (!notificationServiceInstance) {
    const emailChannel = createEmailChannel();
    const whatsappChannel = await createWhatsAppChannel();

    notificationServiceInstance = new NotificationOrchestrator(
      emailChannel,
      whatsappChannel
    );
  }
  return notificationServiceInstance;
}

// Synchronous factory for backward compatibility
export function createNotificationService(): NotificationOrchestrator {
  const emailChannel = createEmailChannel();
  return new NotificationOrchestrator(emailChannel, undefined);
}
