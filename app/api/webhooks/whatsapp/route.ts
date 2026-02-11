import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { getWhatsAppCredentials } from "@/lib/integrations/credentials";
import type { TwilioCredentials, CloudApiCredentials } from "@/lib/whatsapp/types";
import type { Conversation, Client } from "@/lib/db/schemas";

// Twilio WhatsApp webhook
// POST /api/webhooks/whatsapp - Receive incoming WhatsApp messages

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();

    const messageSid = formData.get("MessageSid") as string;
    const from = formData.get("From") as string; // e.g., "whatsapp:+5511999999999"
    const to = formData.get("To") as string;
    const body = formData.get("Body") as string;
    const profileName = formData.get("ProfileName") as string;
    const numMedia = parseInt(formData.get("NumMedia") as string || "0");

    // Extract phone number without "whatsapp:" prefix
    const phoneNumber = from.replace("whatsapp:", "");

    console.log(`[WhatsApp Webhook] Received message from ${phoneNumber}: ${body}`);

    const db = await getDatabase();

    // Try to find existing client by phone
    const client = await db.collection<Client>("clients").findOne({
      phone: { $regex: phoneNumber.replace("+", ""), $options: "i" },
    });

    // Try to find existing conversation
    const conversation = await db.collection<Conversation>("conversations").findOne({
      platform: "whatsapp",
      platformUserId: phoneNumber,
      status: "active",
    });

    const now = new Date();

    // Build message object
    const newMessage = {
      id: `msg-${messageSid || Date.now()}`,
      from: "client" as const,
      content: body,
      timestamp: now,
      metadata: {
        twilioSid: messageSid,
        numMedia,
        profileName,
      },
    };

    if (conversation) {
      // Add message to existing conversation
      await db.collection<Conversation>("conversations").updateOne(
        { _id: conversation._id },
        {
          $push: { messages: newMessage },
          $set: {
            updatedAt: now,
            "context.awaitingResponse": true,
          },
        }
      );

      console.log(`[WhatsApp Webhook] Added message to conversation ${conversation._id}`);
    } else {
      // Create new conversation
      const newConversation: Omit<Conversation, "_id"> = {
        clientId: client?._id?.toString() || "",
        clientName: profileName || client?.name || phoneNumber,
        platform: "whatsapp",
        platformUserId: phoneNumber,
        messages: [newMessage],
        context: {
          awaitingResponse: true,
          sessionData: {
            clientPhone: phoneNumber,
          },
        },
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      const result = await db.collection<Conversation>("conversations").insertOne(newConversation);
      console.log(`[WhatsApp Webhook] Created new conversation ${result.insertedId}`);
    }

    // Process with AI bot if enabled
    await processWithBot(db, phoneNumber, body, "whatsapp");

    // Return TwiML response (empty for now, bot will send reply separately)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response></Response>`,
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  }
}

// GET - Twilio webhook verification
export async function GET() {
  return NextResponse.json({ status: "WhatsApp webhook is active" });
}

// Process message with AI bot
async function processWithBot(
  db: Awaited<ReturnType<typeof getDatabase>>,
  platformUserId: string,
  messageContent: string,
  platform: "whatsapp" | "instagram"
) {
  try {
    // Check if bot is enabled for this integration
    const settings = await db.collection("integration_settings").findOne({
      integrationId: platform,
    });

    if (!settings?.autoReply) {
      console.log(`[Bot] Auto-reply disabled for ${platform}`);
      return;
    }

    // Get conversation for context
    const conversation = await db.collection<Conversation>("conversations").findOne({
      platform,
      platformUserId,
      status: "active",
    });

    if (!conversation) return;

    // Build context from recent messages
    const recentMessages = conversation.messages.slice(-10);
    const context = recentMessages.map((m) => ({
      role: m.from === "client" ? "user" : "assistant",
      content: m.content,
    }));

    // Call AI chat API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: context,
        clientId: conversation.clientId,
        conversationId: conversation._id?.toString(),
      }),
    });

    if (!response.ok) {
      console.error("[Bot] AI chat API error:", await response.text());
      return;
    }

    const data = await response.json();
    const botReply = data.message;

    if (!botReply) return;

    // Add bot message to conversation
    const botMessage = {
      id: `msg-bot-${Date.now()}`,
      from: "bot" as const,
      content: botReply,
      timestamp: new Date(),
    };

    await db.collection<Conversation>("conversations").updateOne(
      { _id: conversation._id },
      {
        $push: { messages: botMessage },
        $set: {
          updatedAt: new Date(),
          "context.awaitingResponse": false,
        },
      }
    );

    // Send reply via WhatsApp
    if (platform === "whatsapp") {
      await sendWhatsAppMessage(platformUserId, botReply);
    }

    console.log(`[Bot] Sent reply to ${platformUserId}: ${botReply.substring(0, 50)}...`);
  } catch (error) {
    console.error("[Bot] Error processing message:", error);
  }
}

// Send WhatsApp message (supports Twilio and Cloud API)
async function sendWhatsAppMessage(to: string, message: string) {
  const credentials = await getWhatsAppCredentials();

  if (!credentials) {
    console.log("[WhatsApp] No credentials configured, skipping send");
    return;
  }

  try {
    if (credentials.provider === "cloud-api") {
      // Cloud API
      const creds = credentials as CloudApiCredentials;
      const normalizedTo = to.replace(/\D/g, "");

      const response = await fetch(
        `https://graph.facebook.com/v22.0/${creds.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
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
        console.error("[WhatsApp Cloud API] Send error:", error);
      }
    } else {
      // Twilio
      const creds = credentials as TwilioCredentials;
      const { accountSid, authToken, phoneNumber } = creds;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: `whatsapp:${phoneNumber}`,
            To: `whatsapp:${to}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("[WhatsApp Twilio] Send error:", error);
      }
    }
  } catch (error) {
    console.error("[WhatsApp] Error sending message:", error);
  }
}
