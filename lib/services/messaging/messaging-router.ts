// Messaging Router Service
// Routes messages to WhatsApp or SMS based on region
// BR: WhatsApp only
// US: WhatsApp or SMS (user choice)

import type {
  MessagingChannel,
  MessagingBotConfig,
  MessagingRequest,
  MessagingResult,
  IMessagingRouter,
  SupportedRegion,
} from "../interfaces";

// Region to default channel mapping
const REGION_CHANNEL_DEFAULTS: Record<SupportedRegion, MessagingChannel> = {
  BR: "whatsapp", // Brazil: WhatsApp is dominant, SMS rarely used
  US: "whatsapp", // US: Default to WhatsApp, but SMS available
  EU: "whatsapp", // EU: WhatsApp common, SMS as fallback
  GLOBAL: "whatsapp", // Global: Default to WhatsApp
};

// Channels available per region
const REGION_AVAILABLE_CHANNELS: Record<SupportedRegion, MessagingChannel[]> = {
  BR: ["whatsapp"], // Brazil: WhatsApp only
  US: ["whatsapp", "sms"], // US: Both available
  EU: ["whatsapp", "sms"], // EU: Both available
  GLOBAL: ["whatsapp", "sms"], // Global: Both available
};

export class MessagingRouter implements IMessagingRouter {
  private whatsappSender: ((phone: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>) | null = null;
  private smsSender: ((phone: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>) | null = null;

  constructor(
    whatsappSender?: (phone: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>,
    smsSender?: (phone: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>
  ) {
    this.whatsappSender = whatsappSender || null;
    this.smsSender = smsSender || null;
  }

  getDefaultChannel(region: SupportedRegion): MessagingChannel {
    return REGION_CHANNEL_DEFAULTS[region];
  }

  getAvailableChannels(region: SupportedRegion): MessagingChannel[] {
    return REGION_AVAILABLE_CHANNELS[region];
  }

  isChannelAvailableForRegion(channel: MessagingChannel, region: SupportedRegion): boolean {
    return REGION_AVAILABLE_CHANNELS[region].includes(channel);
  }

  async route(request: MessagingRequest, config: MessagingBotConfig): Promise<MessagingResult> {
    const { region, primaryChannel, fallbackChannel } = config;

    // Determine which channel to use
    let targetChannel = request.preferredChannel || primaryChannel;

    // Validate channel is available for region
    if (!this.isChannelAvailableForRegion(targetChannel, region)) {
      // Fall back to region default
      targetChannel = this.getDefaultChannel(region);
    }

    // Build the message from request data
    const message = this.buildMessage(request, config);

    // Try primary channel
    const result = await this.sendViaChannel(targetChannel, request.recipientPhone, message);

    // If primary fails and fallback is available, try fallback
    if (!result.success && fallbackChannel && fallbackChannel !== targetChannel) {
      if (this.isChannelAvailableForRegion(fallbackChannel, region)) {
        const fallbackResult = await this.sendViaChannel(fallbackChannel, request.recipientPhone, message);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
    }

    return result;
  }

  private async sendViaChannel(
    channel: MessagingChannel,
    phone: string,
    message: string
  ): Promise<MessagingResult> {
    try {
      if (channel === "whatsapp") {
        if (!this.whatsappSender) {
          return { success: false, channel, error: "WhatsApp sender not configured" };
        }
        const result = await this.whatsappSender(phone, message);
        return { ...result, channel };
      }

      if (channel === "sms") {
        if (!this.smsSender) {
          return { success: false, channel, error: "SMS sender not configured" };
        }
        const result = await this.smsSender(phone, message);
        return { ...result, channel };
      }

      return { success: false, channel, error: `Unknown channel: ${channel}` };
    } catch (error) {
      return {
        success: false,
        channel,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private buildMessage(request: MessagingRequest, config: MessagingBotConfig): string {
    const { messageType, data } = request;
    const { studioName, locale } = config;

    // Use locale-specific templates
    const templates = this.getTemplates(locale);

    switch (messageType) {
      case "greeting":
        return templates.greeting.replace("{studioName}", studioName);

      case "booking_confirmation":
        return templates.bookingConfirmation
          .replace("{className}", data.className || "")
          .replace("{classDate}", data.classDate || "")
          .replace("{classTime}", data.classTime || "");

      case "booking_reminder":
        return templates.bookingReminder
          .replace("{className}", data.className || "")
          .replace("{classTime}", data.classTime || "");

      case "booking_cancellation":
        return templates.bookingCancellation;

      case "waitlist_notification":
        return templates.waitlistNotification
          .replace("{className}", data.className || "")
          .replace("{classDate}", data.classDate || "")
          .replace("{minutes}", String(data.minutesToConfirm || 30));

      case "waitlist_confirmation":
        return templates.waitlistConfirmation
          .replace("{className}", data.className || "")
          .replace("{classDate}", data.classDate || "")
          .replace("{classTime}", data.classTime || "");

      case "waitlist_expired":
        return templates.waitlistExpired;

      case "payment_confirmation":
        return templates.paymentConfirmation;

      case "custom":
        return data.customMessage || "";

      default:
        return "";
    }
  }

  private getTemplates(locale: string): Record<string, string> {
    if (locale.startsWith("pt")) {
      return {
        greeting: "Ola! Sou o assistente virtual do {studioName}. Como posso ajudar?",
        bookingConfirmation: "Sua aula de {className} esta confirmada para {classDate} as {classTime}.",
        bookingReminder: "Lembrete: Sua aula de {className} comeca em breve as {classTime}.",
        bookingCancellation: "Cancelamento recebido. Voce gostaria de remarcar?",
        waitlistNotification: "Boa noticia! Uma vaga abriu para {className} em {classDate}. Responda SIM em ate {minutes} minutos para confirmar.",
        waitlistConfirmation: "Vaga confirmada! Voce esta inscrito em {className} para {classDate} as {classTime}.",
        waitlistExpired: "A oferta de vaga expirou. Voce permanece na lista de espera.",
        paymentConfirmation: "Pagamento recebido com sucesso! Obrigado.",
      };
    }

    // Default: English
    return {
      greeting: "Hi! I'm the virtual assistant for {studioName}. How can I help?",
      bookingConfirmation: "Your {className} class is confirmed for {classDate} at {classTime}.",
      bookingReminder: "Reminder: Your {className} class starts soon at {classTime}.",
      bookingCancellation: "Cancellation received. Would you like to reschedule?",
      waitlistNotification: "Great news! A spot opened for {className} on {classDate}. Reply YES within {minutes} minutes to confirm.",
      waitlistConfirmation: "Spot confirmed! You're booked for {className} on {classDate} at {classTime}.",
      waitlistExpired: "The spot offer has expired. You remain on the waitlist.",
      paymentConfirmation: "Payment received successfully! Thank you.",
    };
  }
}

// Factory function to create a MessagingRouter with Twilio senders
export function createMessagingRouterWithTwilio(
  twilioWhatsAppService: { sendMessage: (to: string, body: string) => Promise<{ success: boolean; sid?: string; error?: string }> } | null,
  twilioSmsService: { sendTextMessage: (to: string, body: string) => Promise<{ success: boolean; sid?: string; error?: string }> } | null
): MessagingRouter {
  const whatsappSender = twilioWhatsAppService
    ? async (phone: string, message: string) => {
        const result = await twilioWhatsAppService.sendMessage(phone, message);
        return { success: result.success, messageId: result.sid, error: result.error };
      }
    : undefined;

  const smsSender = twilioSmsService
    ? async (phone: string, message: string) => {
        const result = await twilioSmsService.sendTextMessage(phone, message);
        return { success: result.success, messageId: result.sid, error: result.error };
      }
    : undefined;

  return new MessagingRouter(whatsappSender, smsSender);
}
