// Twilio WhatsApp Service
// This service handles sending and receiving WhatsApp messages via Twilio

import { InteractiveContent } from "./types";

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string; // Format: whatsapp:+14155238886
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: string;
}

export class TwilioWhatsAppService {
  private config: TwilioConfig;
  private baseUrl: string;

  constructor(config: TwilioConfig) {
    this.config = config;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(to: string, body: string): Promise<TwilioMessageResponse> {
    const formattedTo = this.formatPhoneNumber(to);

    const response = await fetch(`${this.baseUrl}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: this.config.whatsappNumber,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send an interactive message with buttons
   * Note: Twilio uses Content Templates for interactive messages
   */
  async sendInteractiveMessage(
    to: string,
    content: InteractiveContent
  ): Promise<TwilioMessageResponse> {
    const formattedTo = this.formatPhoneNumber(to);

    // For Twilio, we need to use Content API or format as regular message with options
    // Simple implementation: format as text with numbered options
    let messageBody = "";

    if (content.header?.text) {
      messageBody += `*${content.header.text}*\n\n`;
    }

    messageBody += content.body.text;

    if (content.action && "buttons" in content.action && content.action.buttons) {
      messageBody += "\n\n";
      content.action.buttons.forEach((btn: { type: "reply"; reply: { id: string; title: string } }, index: number) => {
        messageBody += `${index + 1}. ${btn.reply.title}\n`;
      });
      messageBody += "\nResponda com o número da opção desejada.";
    }

    if (content.footer?.text) {
      messageBody += `\n\n_${content.footer.text}_`;
    }

    return this.sendTextMessage(to, messageBody);
  }

  /**
   * Send a template message (for proactive notifications)
   */
  async sendTemplateMessage(
    to: string,
    templateSid: string,
    variables: Record<string, string>
  ): Promise<TwilioMessageResponse> {
    const formattedTo = this.formatPhoneNumber(to);

    const contentVariables = JSON.stringify(variables);

    const response = await fetch(`${this.baseUrl}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.config.accountSid}:${this.config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: this.config.whatsappNumber,
        ContentSid: templateSid,
        ContentVariables: contentVariables,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Parse incoming webhook from Twilio
   */
  parseIncomingWebhook(body: Record<string, string>) {
    return {
      messageSid: body.MessageSid,
      from: this.normalizePhoneNumber(body.From),
      to: this.normalizePhoneNumber(body.To),
      body: body.Body,
      numMedia: parseInt(body.NumMedia || "0"),
      profileName: body.ProfileName,
      waId: body.WaId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format phone number for Twilio WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");
    return `whatsapp:+${cleaned}`;
  }

  /**
   * Normalize phone number from Twilio format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove "whatsapp:" prefix and "+"
    return phone.replace("whatsapp:", "").replace("+", "");
  }

  /**
   * Validate Twilio webhook signature
   */
  static validateWebhookSignature(
    authToken: string,
    signature: string,
    url: string,
    params: Record<string, string>
  ): boolean {
    // In production, implement proper signature validation
    // using Twilio's validation helper
    // https://www.twilio.com/docs/usage/security#validating-requests

    const crypto = require("crypto");

    // Sort params and create string
    const sortedKeys = Object.keys(params).sort();
    let data = url;
    for (const key of sortedKeys) {
      data += key + params[key];
    }

    const expectedSignature = crypto
      .createHmac("sha1", authToken)
      .update(Buffer.from(data, "utf-8"))
      .digest("base64");

    return signature === expectedSignature;
  }
}

// Singleton instance creator
let twilioService: TwilioWhatsAppService | null = null;

export function getTwilioService(config?: TwilioConfig): TwilioWhatsAppService {
  if (!twilioService && config) {
    twilioService = new TwilioWhatsAppService(config);
  }
  if (!twilioService) {
    throw new Error("Twilio service not initialized. Call with config first.");
  }
  return twilioService;
}

export function initializeTwilioService(config: TwilioConfig): TwilioWhatsAppService {
  twilioService = new TwilioWhatsAppService(config);
  return twilioService;
}
