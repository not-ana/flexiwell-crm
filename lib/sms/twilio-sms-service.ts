// Twilio SMS Service
// This service handles sending and receiving SMS messages via Twilio
// Uses the same Twilio account as WhatsApp but with standard SMS channel

interface TwilioSMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // Format: +14155238886 (no whatsapp: prefix)
}

interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  dateCreated: string;
}

export class TwilioSMSService {
  private config: TwilioSMSConfig;
  private baseUrl: string;

  constructor(config: TwilioSMSConfig) {
    this.config = config;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
  }

  /**
   * Send a simple text message via SMS
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
        From: this.config.phoneNumber,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio SMS error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send an interactive message formatted for SMS
   * SMS doesn't support buttons, so we format as numbered options
   */
  async sendInteractiveMessage(
    to: string,
    header: string | undefined,
    bodyText: string,
    options: { id: string; title: string }[],
    footer?: string
  ): Promise<TwilioMessageResponse> {
    let messageBody = "";

    if (header) {
      messageBody += `${header}\n\n`;
    }

    messageBody += bodyText;

    if (options.length > 0) {
      messageBody += "\n\n";
      options.forEach((opt, index) => {
        messageBody += `${index + 1}. ${opt.title}\n`;
      });
      messageBody += "\nReply with the number of your choice.";
    }

    if (footer) {
      messageBody += `\n\n${footer}`;
    }

    return this.sendTextMessage(to, messageBody);
  }

  /**
   * Parse incoming SMS webhook from Twilio
   */
  parseIncomingWebhook(body: Record<string, string>) {
    return {
      messageSid: body.MessageSid,
      from: this.normalizePhoneNumber(body.From),
      to: this.normalizePhoneNumber(body.To),
      body: body.Body,
      numMedia: parseInt(body.NumMedia || "0"),
      // SMS doesn't have profile name, use phone number
      profileName: body.From,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format phone number for Twilio SMS (E.164 format)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");
    // Ensure it starts with +
    return `+${cleaned}`;
  }

  /**
   * Normalize phone number from Twilio format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove "+" prefix
    return phone.replace("+", "");
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
let smsService: TwilioSMSService | null = null;

export function getSMSService(config?: TwilioSMSConfig): TwilioSMSService {
  if (!smsService && config) {
    smsService = new TwilioSMSService(config);
  }
  if (!smsService) {
    throw new Error("SMS service not initialized. Call with config first.");
  }
  return smsService;
}

export function initializeSMSService(config: TwilioSMSConfig): TwilioSMSService {
  smsService = new TwilioSMSService(config);
  return smsService;
}
