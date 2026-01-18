import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

// Crisp webhook event types
interface CrispMessageEvent {
  website_id: string;
  event: string;
  data: {
    website_id: string;
    session_id: string;
    inbox_id: string | null;
    type: "text" | "file" | "animation" | "audio" | "picker" | "field" | "carousel";
    origin: "chat" | "email";
    content: string;
    timestamp: number;
    fingerprint: number;
    from: "user" | "operator";
    user: {
      nickname: string;
      user_id: string;
      email?: string;
    };
    stamped: boolean;
  };
  timestamp: number;
}

// Verify Crisp webhook signature
function verifySignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.warn("CRISP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }

  const payload = `[${timestamp};${body}]`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

// Send message back to Crisp conversation
async function sendCrispMessage(
  websiteId: string,
  sessionId: string,
  content: string
): Promise<boolean> {
  const identifier = process.env.CRISP_API_IDENTIFIER;
  const key = process.env.CRISP_API_KEY;

  if (!identifier || !key) {
    console.error("CRISP_API_IDENTIFIER or CRISP_API_KEY not configured");
    return false;
  }

  const auth = Buffer.from(`${identifier}:${key}`).toString("base64");

  try {
    const response = await fetch(
      `https://api.crisp.chat/v1/website/${websiteId}/conversation/${sessionId}/message`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "X-Crisp-Tier": "plugin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "text",
          from: "operator",
          origin: "chat",
          content: content,
          automated: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Crisp API error:", response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Crisp message:", error);
    return false;
  }
}

// Get client by email from Crisp session
async function findClientByEmail(email: string): Promise<string | null> {
  if (!email) return null;

  try {
    const db = await getDatabase();
    const client = await db.collection("clients").findOne({ email: email.toLowerCase() });
    return client?._id?.toString() || null;
  } catch (error) {
    console.error("Error finding client by email:", error);
    return null;
  }
}

// Get Crisp session data to find user email
async function getCrispSessionData(
  websiteId: string,
  sessionId: string
): Promise<{ email?: string; nickname?: string } | null> {
  const identifier = process.env.CRISP_API_IDENTIFIER;
  const key = process.env.CRISP_API_KEY;

  if (!identifier || !key) return null;

  const auth = Buffer.from(`${identifier}:${key}`).toString("base64");

  try {
    const response = await fetch(
      `https://api.crisp.chat/v1/website/${websiteId}/conversation/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "X-Crisp-Tier": "plugin",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      email: data.data?.meta?.email,
      nickname: data.data?.meta?.nickname,
    };
  } catch (error) {
    console.error("Error fetching Crisp session:", error);
    return null;
  }
}

// Process message with AI
async function processWithAI(
  message: string,
  sessionId: string,
  clientId: string | null
): Promise<string> {
  try {
    // Call internal AI chat endpoint
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sessionId: `crisp_${sessionId}`,
        clientId,
        channel: "web",
        personality: "friendly",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI chat error:", error);
      return "Desculpe, estou com dificuldades técnicas no momento. Um atendente humano irá ajudá-lo em breve.";
    }

    const data = await response.json();
    return data.content || data.message || "Como posso ajudá-lo?";
  } catch (error) {
    console.error("Error processing AI:", error);
    return "Desculpe, ocorreu um erro. Um atendente humano irá ajudá-lo em breve.";
  }
}

// Store conversation in database for analytics
async function logConversation(
  sessionId: string,
  userMessage: string,
  botResponse: string,
  clientId: string | null
): Promise<void> {
  try {
    const db = await getDatabase();
    await db.collection("crispConversations").insertOne({
      sessionId,
      clientId,
      userMessage,
      botResponse,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error logging conversation:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const timestamp = req.headers.get("X-Crisp-Request-Timestamp") || "";
    const signature = req.headers.get("X-Crisp-Signature") || "";
    const webhookSecret = process.env.CRISP_WEBHOOK_SECRET || "";

    // Verify signature
    if (!verifySignature(bodyText, timestamp, signature, webhookSecret)) {
      console.error("Invalid Crisp webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: CrispMessageEvent = JSON.parse(bodyText);

    // Only process message:send events (messages from visitors)
    if (event.event !== "message:send") {
      return NextResponse.json({ status: "ignored", reason: "not a message:send event" });
    }

    // Only process text messages
    if (event.data.type !== "text") {
      return NextResponse.json({ status: "ignored", reason: "not a text message" });
    }

    // Only process messages from users (not operators)
    if (event.data.from !== "user") {
      return NextResponse.json({ status: "ignored", reason: "message from operator" });
    }

    const { website_id, session_id, content, user } = event.data;

    console.log(`Crisp message received: "${content}" from ${user.nickname}`);

    // Try to find the client in our database
    let clientId: string | null = null;

    // First, try email from the event
    if (user.email) {
      clientId = await findClientByEmail(user.email);
    }

    // If no email in event, fetch session data
    if (!clientId) {
      const sessionData = await getCrispSessionData(website_id, session_id);
      if (sessionData?.email) {
        clientId = await findClientByEmail(sessionData.email);
      }
    }

    // Process message with AI
    const aiResponse = await processWithAI(content, session_id, clientId);

    // Send response back to Crisp
    const sent = await sendCrispMessage(website_id, session_id, aiResponse);

    if (!sent) {
      console.error("Failed to send response to Crisp");
    }

    // Log conversation for analytics
    await logConversation(session_id, content, aiResponse, clientId);

    return NextResponse.json({
      status: "processed",
      clientFound: !!clientId,
      responseSent: sent,
    });
  } catch (error) {
    console.error("Crisp webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: "Crisp webhook endpoint is ready",
    configured: {
      apiIdentifier: !!process.env.CRISP_API_IDENTIFIER,
      apiKey: !!process.env.CRISP_API_KEY,
      webhookSecret: !!process.env.CRISP_WEBHOOK_SECRET,
    },
  });
}
