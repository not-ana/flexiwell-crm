import { NextRequest, NextResponse } from "next/server";
import { handleMessage, IncomingMessage } from "@/lib/bot/handler";

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
  const timestamp = new Date(parseInt(message.timestamp) * 1000);

  let text: string | undefined;
  let payload: string | undefined;

  // Extract message content based on type
  switch (message.type) {
    case "text":
      text = message.text?.body;
      break;

    case "button":
      payload = message.button?.payload;
      text = message.button?.text;
      break;

    case "interactive":
      if (message.interactive?.button_reply) {
        payload = message.interactive.button_reply.id;
        text = message.interactive.button_reply.title;
      } else if (message.interactive?.list_reply) {
        payload = message.interactive.list_reply.id;
        text = message.interactive.list_reply.title;
      }
      break;

    default:
      // For unsupported message types, ask user to send text
      await sendWhatsAppMessage(
        senderId,
        metadata.phone_number_id,
        "Desculpe, eu só consigo processar mensagens de texto. Por favor, digite sua mensagem."
      );
      return;
  }

  const incoming: IncomingMessage = {
    platform: "whatsapp",
    platformUserId: senderId,
    messageId: message.id,
    text,
    payload,
    timestamp,
    metadata: {
      phoneNumberId: metadata.phone_number_id,
      displayPhoneNumber: metadata.display_phone_number,
    },
  };

  // Process message and get response
  const response = await handleMessage(incoming);

  // Send response
  await sendWhatsAppMessage(
    senderId,
    metadata.phone_number_id,
    response.text,
    response.buttons,
    response.quickReplies
  );
}

async function sendWhatsAppMessage(
  recipientId: string,
  phoneNumberId: string,
  text: string,
  buttons?: { text: string; payload: string }[],
  quickReplies?: string[]
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
      body: { text: string };
      action: {
        buttons?: { type: string; reply: { id: string; title: string } }[];
        button?: string;
        sections?: { title: string; rows: { id: string; title: string }[] }[];
      };
    };
  }

  let messagePayload: MessagePayload;

  // If we have buttons, use interactive message
  if (buttons && buttons.length > 0) {
    messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((btn, index) => ({
            type: "reply",
            reply: {
              id: btn.payload,
              title: btn.text.slice(0, 20),
            },
          })),
        },
      },
    };
  } else if (quickReplies && quickReplies.length > 0) {
    // Use list for quick replies if more than 3
    if (quickReplies.length > 3) {
      messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text },
          action: {
            button: "Ver opções",
            sections: [
              {
                title: "Opções",
                rows: quickReplies.slice(0, 10).map((reply, index) => ({
                  id: reply.toUpperCase().replace(/\s+/g, "_"),
                  title: reply.slice(0, 24),
                })),
              },
            ],
          },
        },
      };
    } else {
      messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipientId,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text },
          action: {
            buttons: quickReplies.map((reply) => ({
              type: "reply",
              reply: {
                id: reply.toUpperCase().replace(/\s+/g, "_"),
                title: reply.slice(0, 20),
              },
            })),
          },
        },
      };
    }
  } else {
    // Simple text message
    messagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientId,
      type: "text",
      text: { body: text },
    };
  }

  try {
    const response = await fetch(
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

    if (!response.ok) {
      const error = await response.json();
      console.error("WhatsApp API error:", error);
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
}
