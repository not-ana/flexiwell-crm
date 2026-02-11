// WhatsApp Cloud API Service
// Official Meta WhatsApp Business Cloud API integration

import crypto from "crypto";
import type { InteractiveContent, TemplateContent } from "./types";

export interface CloudApiConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  verifyToken?: string;
}

interface CloudApiMessageResponse {
  messaging_product: "whatsapp";
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

interface CloudApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export class WhatsAppCloudApiService {
  private config: CloudApiConfig;

  constructor(config: CloudApiConfig) {
    this.config = config;
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(to: string, body: string): Promise<CloudApiMessageResponse> {
    const normalizedTo = this.normalizePhoneNumber(to);

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: { body },
    };

    return this.sendRequest(payload);
  }

  /**
   * Send an interactive message with buttons or list
   */
  async sendInteractiveMessage(
    to: string,
    content: InteractiveContent
  ): Promise<CloudApiMessageResponse> {
    const normalizedTo = this.normalizePhoneNumber(to);

    const interactive: Record<string, unknown> = {
      type: content.type,
      body: content.body,
      action: {},
    };

    // Add optional header
    if (content.header) {
      interactive.header = content.header;
    }

    // Add optional footer
    if (content.footer) {
      interactive.footer = content.footer;
    }

    // Handle button type
    if (content.type === "button" && "buttons" in content.action) {
      interactive.action = {
        buttons: content.action.buttons.slice(0, 3).map((btn) => ({
          type: "reply",
          reply: {
            id: btn.reply.id,
            title: btn.reply.title.slice(0, 20), // WhatsApp limit
          },
        })),
      };
    }

    // Handle list type
    if (content.type === "list" && "sections" in content.action) {
      interactive.action = {
        button: content.action.button,
        sections: content.action.sections.map((section) => ({
          title: section.title.slice(0, 24),
          rows: section.rows.slice(0, 10).map((row) => ({
            id: row.id,
            title: row.title.slice(0, 24),
            ...(row.description && { description: row.description.slice(0, 72) }),
          })),
        })),
      };
    }

    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "interactive",
      interactive,
    };

    return this.sendRequest(payload);
  }

  /**
   * Send a template message (for proactive notifications)
   * Templates must be pre-approved by Meta
   */
  async sendTemplateMessage(
    to: string,
    template: TemplateContent
  ): Promise<CloudApiMessageResponse> {
    const normalizedTo = this.normalizePhoneNumber(to);

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "template",
      template: {
        name: template.name,
        language: template.language,
        ...(template.components && { components: template.components }),
      },
    };

    return this.sendRequest(payload);
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };

    return this.sendRequest(payload);
  }

  /**
   * Send request to WhatsApp Cloud API
   */
  private async sendRequest<T>(payload: Record<string, unknown>): Promise<T> {
    const url = `${GRAPH_API_BASE}/${this.config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as CloudApiError;
      throw new Error(
        `WhatsApp Cloud API error: ${error.error?.message || response.statusText} (code: ${error.error?.code})`
      );
    }

    return data as T;
  }

  /**
   * Normalize phone number to WhatsApp format (digits only, with country code)
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // If it's a Brazilian number without country code, add it
    if (cleaned.length === 11 && cleaned.startsWith("9")) {
      cleaned = "55" + cleaned;
    } else if (cleaned.length === 10 || cleaned.length === 11) {
      // Assume Brazilian number if 10-11 digits
      if (!cleaned.startsWith("55")) {
        cleaned = "55" + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * Validate webhook signature from Meta
   */
  static validateWebhookSignature(
    appSecret: string,
    signature: string,
    payload: string
  ): boolean {
    // Signature format: sha256=<hash>
    const expectedSignature = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest("hex");

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Parse incoming webhook event from Meta
   */
  static parseWebhookEvent(body: Record<string, unknown>) {
    // The webhook format is already handled in the route.ts
    // This method provides type safety for the parsed data
    return body;
  }

  /**
   * Verify webhook subscription (for GET requests)
   */
  static verifyWebhook(
    mode: string | null,
    token: string | null,
    challenge: string | null,
    verifyToken: string
  ): { valid: boolean; challenge?: string } {
    if (mode === "subscribe" && token === verifyToken) {
      return { valid: true, challenge: challenge || undefined };
    }
    return { valid: false };
  }
}

// Factory function to create service from credentials
export function createCloudApiService(config: CloudApiConfig): WhatsAppCloudApiService {
  return new WhatsAppCloudApiService(config);
}

// Singleton management
let cloudApiService: WhatsAppCloudApiService | null = null;

export function getCloudApiService(config?: CloudApiConfig): WhatsAppCloudApiService {
  if (!cloudApiService && config) {
    cloudApiService = new WhatsAppCloudApiService(config);
  }
  if (!cloudApiService) {
    throw new Error("WhatsApp Cloud API service not initialized. Call with config first.");
  }
  return cloudApiService;
}

export function initializeCloudApiService(config: CloudApiConfig): WhatsAppCloudApiService {
  cloudApiService = new WhatsAppCloudApiService(config);
  return cloudApiService;
}
