import { NextRequest, NextResponse } from "next/server";
import { handleMessage, IncomingMessage } from "@/lib/bot/handler";

// Instagram Webhook Verification (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check if this is a subscription verification
  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log("Instagram webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Instagram Webhook Handler (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify this is from Instagram
    if (body.object !== "instagram") {
      return NextResponse.json({ error: "Invalid object" }, { status: 400 });
    }

    // Process each entry
    for (const entry of body.entry) {
      // Handle messaging events
      if (entry.messaging) {
        for (const event of entry.messaging) {
          await processInstagramEvent(event);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Instagram webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processInstagramEvent(event: InstagramMessagingEvent) {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const timestamp = new Date(event.timestamp);

  // Handle message events
  if (event.message) {
    const incoming: IncomingMessage = {
      platform: "instagram",
      platformUserId: senderId,
      messageId: event.message.mid,
      text: event.message.text,
      timestamp,
      metadata: {
        recipientId,
        isEcho: event.message.is_echo,
      },
    };

    // Skip echo messages (sent by us)
    if (event.message.is_echo) {
      return;
    }

    // Handle quick reply
    if (event.message.quick_reply) {
      incoming.payload = event.message.quick_reply.payload;
    }

    // Process message and get response
    const response = await handleMessage(incoming);

    // Send response
    await sendInstagramMessage(senderId, response.text, response.buttons, response.quickReplies);
  }

  // Handle postback events (button clicks)
  if (event.postback) {
    const incoming: IncomingMessage = {
      platform: "instagram",
      platformUserId: senderId,
      messageId: `postback_${timestamp.getTime()}`,
      payload: event.postback.payload,
      timestamp,
    };

    const response = await handleMessage(incoming);
    await sendInstagramMessage(senderId, response.text, response.buttons, response.quickReplies);
  }
}

async function sendInstagramMessage(
  recipientId: string,
  text: string,
  buttons?: { text: string; payload: string }[],
  quickReplies?: string[]
) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    console.error("Instagram access token not configured");
    return;
  }

  interface MessagePayload {
    recipient: { id: string };
    message: {
      text?: string;
      attachment?: {
        type: string;
        payload: {
          template_type: string;
          text: string;
          buttons: { type: string; title: string; payload: string }[];
        };
      };
      quick_replies?: { content_type: string; title: string; payload: string }[];
    };
  }

  const messagePayload: MessagePayload = {
    recipient: { id: recipientId },
    message: {},
  };

  // If we have buttons, use a button template
  if (buttons && buttons.length > 0) {
    messagePayload.message = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: "postback",
            title: btn.text.slice(0, 20),
            payload: btn.payload,
          })),
        },
      },
    };
  } else {
    messagePayload.message.text = text;
  }

  // Add quick replies if provided
  if (quickReplies && quickReplies.length > 0) {
    messagePayload.message.quick_replies = quickReplies.slice(0, 13).map((reply) => ({
      content_type: "text",
      title: reply.slice(0, 20),
      payload: reply.toUpperCase().replace(/\s+/g, "_"),
    }));
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Instagram API error:", error);
    }
  } catch (error) {
    console.error("Error sending Instagram message:", error);
  }
}

// Types for Instagram Messaging API
interface InstagramMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload: string };
    attachments?: {
      type: string;
      payload: { url?: string };
    }[];
  };
  postback?: {
    title: string;
    payload: string;
  };
}
