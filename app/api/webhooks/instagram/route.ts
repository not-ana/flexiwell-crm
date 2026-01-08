import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { getInstagramCredentials } from "@/lib/integrations/credentials";
import type { Conversation, Client } from "@/lib/db/schemas";

// Instagram/Meta Webhook
// Handles Instagram DM messages via Meta Graph API

// GET - Webhook verification (Meta requires this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Verify token should match your webhook verification token
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "flexiwell_instagram_verify";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Instagram Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[Instagram Webhook] Verification failed");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST - Receive incoming Instagram messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Instagram Webhook] Received:", JSON.stringify(body, null, 2));

    // Meta webhook structure
    const { object, entry } = body;

    if (object !== "instagram") {
      return NextResponse.json({ status: "ignored" });
    }

    const db = await getDatabase();

    // Process each entry
    for (const item of entry || []) {
      const { messaging } = item;

      if (!messaging) continue;

      for (const event of messaging) {
        // Handle message event
        if (event.message) {
          await handleIncomingMessage(db, event);
        }

        // Handle message read event
        if (event.read) {
          console.log("[Instagram] Message read by user:", event.sender.id);
        }

        // Handle message reaction
        if (event.reaction) {
          console.log("[Instagram] Reaction received:", event.reaction);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[Instagram Webhook] Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

// Handle incoming message
async function handleIncomingMessage(
  db: Awaited<ReturnType<typeof getDatabase>>,
  event: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message: {
      mid: string;
      text?: string;
      attachments?: Array<{
        type: string;
        payload: { url: string };
      }>;
    };
  }
) {
  const { sender, message } = event;
  const senderId = sender.id;
  const messageId = message.mid;
  const messageText = message.text || "";

  console.log(`[Instagram] Message from ${senderId}: ${messageText}`);

  // Get user profile from Instagram
  const userProfile = await getInstagramUserProfile(senderId);
  const userName = userProfile?.name || userProfile?.username || `User ${senderId}`;

  const now = new Date();

  // Try to find existing client by Instagram ID
  const client = await db.collection<Client>("clients").findOne({
    "socialProfiles.instagram": senderId,
  });

  // Try to find existing conversation
  let conversation: Conversation | null = await db.collection<Conversation>("conversations").findOne({
    platform: "instagram",
    platformUserId: senderId,
    status: "active",
  });

  // Build message object
  const newMessage = {
    id: `msg-${messageId || Date.now()}`,
    from: "client" as const,
    content: messageText,
    timestamp: now,
    metadata: {
      instagramMid: messageId,
      attachments: message.attachments,
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

    console.log(`[Instagram] Added message to conversation ${conversation._id}`);
  } else {
    // Create new conversation
    const newConversation: Omit<Conversation, "_id"> = {
      clientId: client?._id?.toString() || "",
      clientName: userName,
      platform: "instagram",
      platformUserId: senderId,
      messages: [newMessage],
      context: {
        awaitingResponse: true,
        sessionData: {
          instagramUserId: senderId,
          username: userProfile?.username,
        },
      },
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Conversation>("conversations").insertOne(newConversation);
    conversation = { ...newConversation, _id: result.insertedId };
    console.log(`[Instagram] Created new conversation ${result.insertedId}`);
  }

  // Process with AI bot if enabled
  if (conversation) {
    await processWithBot(db, senderId, messageText, conversation);
  }
}

// Get Instagram user profile
async function getInstagramUserProfile(userId: string): Promise<{ name?: string; username?: string } | null> {
  const credentials = await getInstagramCredentials();

  if (!credentials) {
    return null;
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/${userId}?fields=id,username,name&access_token=${credentials.accessToken}`
    );

    if (!response.ok) {
      console.error("[Instagram] Failed to fetch user profile:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Instagram] Error fetching user profile:", error);
    return null;
  }
}

// Process message with AI bot
async function processWithBot(
  db: Awaited<ReturnType<typeof getDatabase>>,
  platformUserId: string,
  messageContent: string,
  conversation: Conversation
) {
  try {
    // Check if bot is enabled for Instagram
    const settings = await db.collection("integration_settings").findOne({
      integrationId: "instagram",
    });

    if (!settings?.autoReply) {
      console.log("[Bot] Auto-reply disabled for Instagram");
      return;
    }

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

    // Send reply via Instagram
    await sendInstagramMessage(platformUserId, botReply);

    console.log(`[Bot] Sent Instagram reply to ${platformUserId}: ${botReply.substring(0, 50)}...`);
  } catch (error) {
    console.error("[Bot] Error processing Instagram message:", error);
  }
}

// Send Instagram message via Meta API
async function sendInstagramMessage(recipientId: string, message: string) {
  const credentials = await getInstagramCredentials();

  if (!credentials) {
    console.log("[Instagram] No credentials configured, skipping send");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.instagram.com/v18.0/${credentials.pageId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("[Instagram] Send error:", error);
    }
  } catch (error) {
    console.error("[Instagram] Error sending message:", error);
  }
}
