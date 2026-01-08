import { NextRequest, NextResponse } from "next/server";
import { WhatsAppBotHandler } from "@/lib/whatsapp/bot-handler";
import type { IncomingMessage, InteractiveContent } from "@/lib/whatsapp/types";

// WhatsApp Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check if this is a subscription verification
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

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

  // For unsupported message types, ask user to send text
  if (!["text", "button", "interactive"].includes(message.type)) {
    await sendWhatsAppMessage(
      senderId,
      metadata.phone_number_id,
      { body: "Desculpe, eu só consigo processar mensagens de texto. Por favor, digite sua mensagem." }
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

  // Initialize bot handler with default establishment and plan
  // In production, you would look up the establishment based on the business phone number
  const establishmentId = process.env.DEFAULT_ESTABLISHMENT_ID || "default";
  const plan = process.env.WHATSAPP_BOT_PLAN || "pro";
  const botHandler = new WhatsAppBotHandler(establishmentId, plan);

  // Process message and get response
  const response = await botHandler.handleMessage(incoming);

  // Send response
  await sendWhatsAppMessage(senderId, metadata.phone_number_id, response);
}

async function sendWhatsAppMessage(
  recipientId: string,
  phoneNumberId: string,
  response: InteractiveContent | { body: string }
) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

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
