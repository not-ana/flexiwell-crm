import { getDatabase } from "@/lib/db/mongodb";
import { getWhatsAppCredentials, getInstagramCredentials } from "@/lib/integrations/credentials";
import type { Conversation } from "@/lib/db/schemas";
import type { TwilioCredentials, CloudApiCredentials } from "@/lib/whatsapp/types";
import { ObjectId } from "mongodb";

export type MessagePlatform = "whatsapp" | "instagram";

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Messaging Service
 * Handles sending messages to clients via WhatsApp and Instagram
 */
export const messagingService = {
  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    content: string,
    from: "admin" | "bot" = "admin"
  ): Promise<SendMessageResult> {
    try {
      const db = await getDatabase();

      // Get the conversation
      const conversation = await db.collection<Conversation>("conversations").findOne({
        _id: new ObjectId(conversationId),
      });

      if (!conversation) {
        return { success: false, error: "Conversation not found" };
      }

      // Send message to the platform
      let result: SendMessageResult;

      if (conversation.platform === "whatsapp") {
        result = await this.sendWhatsAppMessage(conversation.platformUserId, content);
      } else if (conversation.platform === "instagram") {
        result = await this.sendInstagramMessage(conversation.platformUserId, content);
      } else {
        return { success: false, error: `Unknown platform: ${conversation.platform}` };
      }

      if (!result.success) {
        return result;
      }

      // Add message to conversation
      const newMessage = {
        id: `msg-${from}-${Date.now()}`,
        from,
        content,
        timestamp: new Date(),
        metadata: {
          externalId: result.messageId,
        },
      };

      await db.collection<Conversation>("conversations").updateOne(
        { _id: conversation._id },
        {
          $push: { messages: newMessage },
          $set: {
            updatedAt: new Date(),
            "context.awaitingResponse": false,
          },
        }
      );

      return { success: true, messageId: newMessage.id };
    } catch (error) {
      console.error("[Messaging] Error sending message:", error);
      return { success: false, error: "Failed to send message" };
    }
  },

  /**
   * Send WhatsApp message (supports both Twilio and Cloud API)
   */
  async sendWhatsAppMessage(to: string, message: string): Promise<SendMessageResult> {
    const credentials = await getWhatsAppCredentials();

    if (!credentials) {
      console.log("[WhatsApp] No credentials configured");
      return { success: false, error: "WhatsApp not configured" };
    }

    // Route to the appropriate provider
    if (credentials.provider === "cloud-api") {
      return this.sendWhatsAppCloudApi(to, message, credentials as CloudApiCredentials);
    } else {
      return this.sendWhatsAppTwilio(to, message, credentials as TwilioCredentials);
    }
  },

  /**
   * Send WhatsApp message via Cloud API (Meta official)
   */
  async sendWhatsAppCloudApi(
    to: string,
    message: string,
    credentials: CloudApiCredentials
  ): Promise<SendMessageResult> {
    try {
      // Normalize phone number (digits only with country code)
      let normalizedTo = to.replace(/\D/g, "");
      if (normalizedTo.length === 11 && !normalizedTo.startsWith("55")) {
        normalizedTo = "55" + normalizedTo;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizedTo,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[WhatsApp Cloud API] Error:", error);
        return { success: false, error: error.error?.message || "Failed to send" };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsApp Cloud API] Error:", error);
      return { success: false, error: "Failed to send WhatsApp message" };
    }
  },

  /**
   * Send WhatsApp message via Twilio
   */
  async sendWhatsAppTwilio(
    to: string,
    message: string,
    credentials: TwilioCredentials
  ): Promise<SendMessageResult> {
    const { accountSid, authToken, phoneNumber } = credentials;

    try {
      // Format phone number
      const formattedTo = to.startsWith("+") ? to : `+${to}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${phoneNumber}`,
            To: `whatsapp:${formattedTo}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[WhatsApp Twilio] API error:", error);
        return { success: false, error: error.message || "Failed to send" };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error("[WhatsApp Twilio] Error:", error);
      return { success: false, error: "Failed to send WhatsApp message" };
    }
  },

  /**
   * Send Instagram message via Meta Graph API
   */
  async sendInstagramMessage(recipientId: string, message: string): Promise<SendMessageResult> {
    const credentials = await getInstagramCredentials();

    if (!credentials) {
      console.log("[Instagram] No credentials configured");
      return { success: false, error: "Instagram not configured" };
    }

    try {
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${credentials.pageId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[Instagram] API error:", error);
        return { success: false, error: error.error?.message || "Failed to send" };
      }

      const data = await response.json();
      return { success: true, messageId: data.message_id };
    } catch (error) {
      console.error("[Instagram] Error:", error);
      return { success: false, error: "Failed to send Instagram message" };
    }
  },

  /**
   * Send a template message (WhatsApp only)
   */
  async sendWhatsAppTemplate(
    to: string,
    templateName: string,
    templateParams: string[],
    languageCode: string = "pt_BR"
  ): Promise<SendMessageResult> {
    const credentials = await getWhatsAppCredentials();

    if (!credentials) {
      return { success: false, error: "WhatsApp not configured" };
    }

    // Route to the appropriate provider
    if (credentials.provider === "cloud-api") {
      return this.sendWhatsAppTemplateCloudApi(
        to,
        templateName,
        templateParams,
        languageCode,
        credentials as CloudApiCredentials
      );
    } else {
      return this.sendWhatsAppTemplateTwilio(
        to,
        templateName,
        templateParams,
        credentials as TwilioCredentials
      );
    }
  },

  /**
   * Send template via Cloud API
   */
  async sendWhatsAppTemplateCloudApi(
    to: string,
    templateName: string,
    templateParams: string[],
    languageCode: string,
    credentials: CloudApiCredentials
  ): Promise<SendMessageResult> {
    try {
      let normalizedTo = to.replace(/\D/g, "");
      if (normalizedTo.length === 11 && !normalizedTo.startsWith("55")) {
        normalizedTo = "55" + normalizedTo;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizedTo,
            type: "template",
            template: {
              name: templateName,
              language: { code: languageCode },
              components: templateParams.length > 0 ? [
                {
                  type: "body",
                  parameters: templateParams.map((param) => ({
                    type: "text",
                    text: param,
                  })),
                },
              ] : undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[WhatsApp Cloud API] Template error:", error);
        return { success: false, error: error.error?.message || "Failed to send template" };
      }

      const data = await response.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      console.error("[WhatsApp Cloud API] Template error:", error);
      return { success: false, error: "Failed to send template message" };
    }
  },

  /**
   * Send template via Twilio
   */
  async sendWhatsAppTemplateTwilio(
    to: string,
    templateName: string,
    templateParams: string[],
    credentials: TwilioCredentials
  ): Promise<SendMessageResult> {
    const { accountSid, authToken, phoneNumber } = credentials;

    try {
      const formattedTo = to.startsWith("+") ? to : `+${to}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${phoneNumber}`,
            To: `whatsapp:${formattedTo}`,
            ContentSid: templateName,
            ContentVariables: JSON.stringify(
              templateParams.reduce(
                (acc, val, idx) => ({ ...acc, [(idx + 1).toString()]: val }),
                {}
              )
            ),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("[WhatsApp Twilio] Template error:", error);
        return { success: false, error: error.message || "Failed to send template" };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid };
    } catch (error) {
      console.error("[WhatsApp Twilio] Template error:", error);
      return { success: false, error: "Failed to send template message" };
    }
  },

  /**
   * Check if a platform is connected
   */
  async isPlatformConnected(platform: MessagePlatform): Promise<boolean> {
    if (platform === "whatsapp") {
      const credentials = await getWhatsAppCredentials();
      return !!credentials;
    } else if (platform === "instagram") {
      const credentials = await getInstagramCredentials();
      return !!credentials;
    }
    return false;
  },

  /**
   * Get conversation statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    awaiting: number;
    byPlatform: Record<string, number>;
  }> {
    const db = await getDatabase();

    const [totals, platformStats] = await Promise.all([
      db
        .collection<Conversation>("conversations")
        .aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
              awaiting: { $sum: { $cond: ["$context.awaitingResponse", 1, 0] } },
            },
          },
        ])
        .toArray(),
      db
        .collection<Conversation>("conversations")
        .aggregate([
          { $group: { _id: "$platform", count: { $sum: 1 } } },
        ])
        .toArray(),
    ]);

    const stats = totals[0] || { total: 0, active: 0, awaiting: 0 };
    const byPlatform = platformStats.reduce(
      (acc, p) => ({ ...acc, [p._id]: p.count }),
      {} as Record<string, number>
    );

    return {
      total: stats.total,
      active: stats.active,
      awaiting: stats.awaiting,
      byPlatform,
    };
  },
};
