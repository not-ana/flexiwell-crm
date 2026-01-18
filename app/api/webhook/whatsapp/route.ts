import { NextRequest, NextResponse } from "next/server";
import { WhatsAppBotHandler } from "@/lib/whatsapp/bot-handler";
import type { IncomingMessage, InteractiveContent, CloudApiCredentials } from "@/lib/whatsapp/types";
import {
  getWhatsAppCredentials,
  getEstablishmentByPhoneNumberId,
  getEstablishmentWhatsAppCredentials,
  getAllConnectedWhatsAppEstablishments,
} from "@/lib/integrations/credentials";
import { trackUsage, checkUsageLimit, checkFeatureAccess } from "@/lib/plans/enforcement";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

// WhatsApp Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check against all connected establishments' verify tokens
  let verifyTokens: string[] = [];

  try {
    // Get all connected establishments and their verify tokens
    const establishments = await getAllConnectedWhatsAppEstablishments();
    verifyTokens = establishments
      .filter(e => e.provider === "cloud-api" && e.verifyToken)
      .map(e => e.verifyToken as string);

    // Also check legacy/global credentials
    const globalCredentials = await getWhatsAppCredentials();
    if (globalCredentials?.provider === "cloud-api") {
      const globalToken = (globalCredentials as CloudApiCredentials).verifyToken;
      if (globalToken && !verifyTokens.includes(globalToken)) {
        verifyTokens.push(globalToken);
      }
    }
  } catch (error) {
    console.log("[WhatsApp Webhook] Error fetching credentials:", error);
  }

  // Fallback to environment variable
  const envToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (envToken && !verifyTokens.includes(envToken)) {
    verifyTokens.push(envToken);
  }

  console.log("[WhatsApp Webhook] Verification attempt:", {
    mode,
    tokenReceived: token?.slice(0, 10) + "...",
    configuredTokensCount: verifyTokens.length,
    envVar: envToken ? "SET" : "NOT_SET"
  });

  // Check if this is a subscription verification
  if (mode === "subscribe" && token && verifyTokens.includes(token)) {
    console.log("[WhatsApp Webhook] Verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[WhatsApp Webhook] Verification failed - token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// WhatsApp Webhook Handler (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify this is from WhatsApp Business API
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid object" }, { status: 400 });
    }

    // Process each entry
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages") {
          const value = change.value;

          // Process incoming messages
          if (value.messages) {
            for (const message of value.messages) {
              await processWhatsAppMessage(message, value.metadata);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: "text" | "button" | "interactive" | "image" | "audio" | "document";
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: {
    type: "button_reply" | "list_reply";
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

async function processWhatsAppMessage(message: WhatsAppMessage, metadata: WhatsAppMetadata) {
  const senderId = message.from;
  const phoneNumberId = metadata.phone_number_id;

  // Look up establishment by phone number ID
  let establishmentId: string;
  let accessToken: string | undefined;
  let plan = "pro";
  let ownerId: string | undefined;

  try {
    const establishment = await getEstablishmentByPhoneNumberId(phoneNumberId);
    if (establishment) {
      establishmentId = establishment.establishmentId;
      accessToken = establishment.accessToken;
      console.log(`[WhatsApp Webhook] Found establishment ${establishmentId} for phone ${phoneNumberId}`);

      // Get owner ID for usage tracking
      const db = await getDatabase();
      // Try to find by ObjectId or string ID (legacy)
      let estDoc = null;
      if (ObjectId.isValid(establishmentId)) {
        estDoc = await db.collection("establishments").findOne({ _id: new ObjectId(establishmentId) });
      }
      if (!estDoc) {
        estDoc = await db.collection("establishments").findOne({ establishmentId: establishmentId });
      }
      if (estDoc?.ownerId) {
        ownerId = estDoc.ownerId;
      }
    } else {
      // Fallback to environment variables (legacy/global config)
      console.log(`[WhatsApp Webhook] No establishment found for phone ${phoneNumberId}, using defaults`);
      establishmentId = process.env.DEFAULT_ESTABLISHMENT_ID || "default";
      accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error looking up establishment:", error);
    establishmentId = process.env.DEFAULT_ESTABLISHMENT_ID || "default";
    accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  // Check WhatsApp feature and usage limits
  if (ownerId) {
    const featureCheck = await checkFeatureAccess(ownerId, "messagingBot");
    if (!featureCheck.allowed) {
      console.log(`[WhatsApp Webhook] Messaging Bot feature not available for owner ${ownerId}`);
      await sendWhatsAppMessage(
        senderId,
        phoneNumberId,
        { body: "Desculpe, este recurso não está disponível no momento. Por favor, entre em contato com o suporte." },
        accessToken
      );
      return;
    }

    const usageCheck = await checkUsageLimit(ownerId, "messagingBotMessages");
    if (!usageCheck.allowed) {
      console.log(`[WhatsApp Webhook] WhatsApp usage limit reached for owner ${ownerId}`);
      await sendWhatsAppMessage(
        senderId,
        phoneNumberId,
        { body: "Desculpe, o limite de mensagens do WhatsApp foi atingido este mês. Por favor, entre em contato com o estúdio diretamente." },
        accessToken
      );
      return;
    }

    // Track messaging bot usage
    await trackUsage(ownerId, "messagingBotMessages");
  }

  // For unsupported message types, ask user to send text
  if (!["text", "button", "interactive"].includes(message.type)) {
    await sendWhatsAppMessage(
      senderId,
      phoneNumberId,
      { body: "Desculpe, eu só consigo processar mensagens de texto. Por favor, digite sua mensagem." },
      accessToken
    );
    return;
  }

  // Convert to IncomingMessage format for the bot handler
  const incoming: IncomingMessage = {
    id: message.id,
    from: senderId,
    timestamp: message.timestamp,
    type: message.type as "text" | "interactive" | "button",
    text: message.text,
    interactive: message.interactive,
    button: message.button,
  };

  // Initialize bot handler with the establishment
  plan = process.env.WHATSAPP_BOT_PLAN || "pro";
  const botHandler = new WhatsAppBotHandler(establishmentId, plan);

  // Process message and get response
  const response = await botHandler.handleMessage(incoming);

  // Send response
  await sendWhatsAppMessage(senderId, phoneNumberId, response, accessToken);
}

async function sendWhatsAppMessage(
  recipientId: string,
  phoneNumberId: string,
  response: InteractiveContent | { body: string },
  accessToken?: string
) {
  // Fallback to legacy credentials if no token provided
  if (!accessToken) {
    try {
      const credentials = await getWhatsAppCredentials();
      if (credentials?.provider === "cloud-api") {
        accessToken = (credentials as CloudApiCredentials).accessToken;
      } else {
        accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      }
    } catch {
      accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    }
  }

  if (!accessToken) {
    console.error("WhatsApp access token not configured");
    return;
  }

  interface MessagePayload {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: { body: string };
    interactive?: {
      type: string;
      header?: { type: string; text: string };
      body: { text: string };
      footer?: { text: string };
      action: {
        buttons?: { type: string; reply: { id: string; title: string } }[];
        button?: string;
        sections?: { title: string; rows: { id: string; title: string; description?: string }[] }[];
      };
    };
  }

  let messagePayload: MessagePayload;

  // Check if it's an interactive message or simple text
  if ("type" in response && (response.type === "button" || response.type === "list")) {
    const interactive = response as InteractiveContent;

    if (interactive.type === "button" && "buttons" in interactive.action) {
      messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "interactive",
        interactive: {
          type: "button",
          ...(interactive.header && { header: interactive.header }),
          body: interactive.body,
          ...(interactive.footer && { footer: interactive.footer }),
          action: {
            buttons: interactive.action.buttons.slice(0, 3).map(btn => ({
              type: "reply",
              reply: {
                id: btn.reply.id,
                title: btn.reply.title.slice(0, 20),
              },
            })),
          },
        },
      };
    } else if (interactive.type === "list" && "sections" in interactive.action) {
      messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "interactive",
        interactive: {
          type: "list",
          ...(interactive.header && { header: interactive.header }),
          body: interactive.body,
          ...(interactive.footer && { footer: interactive.footer }),
          action: {
            button: interactive.action.button,
            sections: interactive.action.sections.map(section => ({
              title: section.title,
              rows: section.rows.slice(0, 10).map(row => ({
                id: row.id,
                title: row.title.slice(0, 24),
                ...(row.description && { description: row.description }),
              })),
            })),
          },
        },
      };
    } else {
      // Fallback to text
      messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "text",
        text: { body: interactive.body.text },
      };
    }
  } else {
    // Simple text message
    const textResponse = response as { body: string };
    messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: textResponse.body },
    };
  }

  try {
    const apiResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!apiResponse.ok) {
      const error = await apiResponse.json();
      console.error("WhatsApp API error:", error);
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
