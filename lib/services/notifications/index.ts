// Notifications Module - Clean Architecture Exports
// This module follows SOLID principles with proper separation of concerns

// Interfaces
export type { INotificationChannel, NotificationData, NotificationResult } from "../interfaces";

// Channel implementations
export { EmailChannel, createEmailChannel } from "./email-channel";
export { WhatsAppChannel, createWhatsAppChannel } from "./whatsapp-channel";

// Logger
export { NotificationLogger, notificationLogger } from "./notification-logger";
export type { NotificationLog, INotificationLogger } from "./notification-logger";

// Orchestrator (main entry point)
export { NotificationOrchestrator } from "./notification-orchestrator";
export type { NotificationChannel } from "./notification-orchestrator";

// Templates
export { EMAIL_TEMPLATES } from "./templates/email-templates";
export { WHATSAPP_TEMPLATES } from "./templates/whatsapp-templates";

// Factory function to create a fully configured notification service
import { NotificationOrchestrator } from "./notification-orchestrator";
import { createEmailChannel } from "./email-channel";
import { createWhatsAppChannel } from "./whatsapp-channel";

let cachedOrchestrator: NotificationOrchestrator | null = null;

/**
 * Creates and returns a configured NotificationOrchestrator
 * Uses singleton pattern to avoid recreating channels on each call
 */
export async function getNotificationService(): Promise<NotificationOrchestrator> {
  if (cachedOrchestrator) {
    return cachedOrchestrator;
  }

  const emailChannel = createEmailChannel();
  const whatsappChannel = await createWhatsAppChannel();

  cachedOrchestrator = new NotificationOrchestrator(
    emailChannel,
    whatsappChannel,
    process.env.STUDIO_NAME || "FlexiWell Studio",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );

  return cachedOrchestrator;
}

/**
 * Synchronous factory - creates service with email only
 * WhatsApp channel will be setup asynchronously
 */
export function createNotificationService(): NotificationOrchestrator {
  if (!cachedOrchestrator) {
    cachedOrchestrator = new NotificationOrchestrator(
      createEmailChannel(),
      undefined,
      process.env.STUDIO_NAME || "FlexiWell Studio",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );

    // Setup WhatsApp channel async
    createWhatsAppChannel().then((channel) => {
      cachedOrchestrator?.setWhatsAppChannel(channel);
    });
  }

  return cachedOrchestrator;
}

/**
 * Clears the cached orchestrator (useful for testing)
 */
export function clearNotificationServiceCache(): void {
  cachedOrchestrator = null;
}
