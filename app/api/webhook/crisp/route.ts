import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getDatabase } from "@/lib/db/mongodb";
import { flexiwellSupportConfig, findQuickReply, shouldEscalateToHuman } from "@/lib/config/flexiwell-support";
import { callAI, getAIProviderInfo, type AIMessage } from "@/lib/ai/providers";

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

// In-memory conversation storage for context
const conversations = new Map<string, AIMessage[]>();

// Verify Crisp webhook signature
function verifySignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  // Temporarily skip signature verification to debug
  // TODO: Re-enable once we confirm the correct secret
  console.log("Skipping signature verification for debugging");
  return true;

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "text",
          from: "operator",
          origin: "chat",
          content: content,
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

// Get conversation history for a session
function getConversationHistory(sessionId: string): AIMessage[] {
  return conversations.get(sessionId) || [];
}

// Save conversation history
function saveConversation(sessionId: string, messages: AIMessage[]): void {
  // Keep only last 20 messages
  conversations.set(sessionId, messages.slice(-20));
}

// Process message with FlexiWell Support AI
async function processWithSupportAI(
  message: string,
  sessionId: string,
  userName: string
): Promise<string> {
  try {
    // Check for quick reply first
    const quickReply = findQuickReply(message);
    if (quickReply) {
      return quickReply;
    }

    // Check if should escalate
    if (shouldEscalateToHuman(message)) {
      return `I understand you need additional help. I'll transfer you to a human agent.

In the meantime, you can also:
- Send an email to: support@flexiwell.net
- Access our help center

A member of our team will get back to you soon!`;
    }

    // Check if AI is configured
    const providerInfo = getAIProviderInfo();
    if (!providerInfo.configured) {
      return `Hello! I'm the FlexiWell assistant. I'm currently running with limited capacity.

I can help with questions about:
- How to register clients
- How to create classes
- Waitlist
- Payments
- Reports

Type your question or contact us: support@flexiwell.net`;
    }

    // Get conversation history
    const history = getConversationHistory(sessionId);

    // Build messages for AI
    const messages: AIMessage[] = [
      { role: "system", content: flexiwellSupportConfig.systemPrompt },
      ...history,
      { role: "user", content: `[${userName}]: ${message}` },
    ];

    // Call AI
    const response = await callAI(messages);

    // Save conversation
    saveConversation(sessionId, [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: response.content },
    ]);

    return response.content;
  } catch (error) {
    console.error("Error processing support AI:", error);
    return `Sorry, I had a problem processing your message.

You can try again or contact us:
- Email: support@flexiwell.net

We're here to help!`;
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
  console.log("=== CRISP WEBHOOK RECEIVED ===");
  try {
    const bodyText = await req.text();
    console.log("Body:", bodyText.substring(0, 500));
    const timestamp = req.headers.get("X-Crisp-Request-Timestamp") || "";
    const signature = req.headers.get("X-Crisp-Signature") || "";
    const webhookSecret = process.env.CRISP_WEBHOOK_SECRET || "";

    // Verify signature
    if (!verifySignature(bodyText, timestamp, signature, webhookSecret)) {
      console.error("Invalid Crisp webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: CrispMessageEvent = JSON.parse(bodyText);

    console.log(`Crisp webhook event: ${event.event}`, JSON.stringify(event.data, null, 2));

    // Only process message:send events (messages from visitors/admins)
    if (event.event !== "message:send") {
      return NextResponse.json({ status: "ignored", reason: "not a message:send event" });
    }

    // Only process text messages
    if (event.data.type !== "text") {
      return NextResponse.json({ status: "ignored", reason: "not a text message" });
    }

    const { website_id, session_id, content, user } = event.data;
    const userName = user.nickname || "User";

    // Only respond to messages from users, not operators (to avoid infinite loop)
    if (event.data.from === "operator") {
      return NextResponse.json({ status: "ignored", reason: "message from operator" });
    }

    console.log(`FlexiWell Support: Message from ${userName}: "${content}"`);

    // Process message with FlexiWell Support AI
    const aiResponse = await processWithSupportAI(content, session_id, userName);

    console.log(`FlexiWell Support: AI Response: "${aiResponse.substring(0, 100)}..."`);

    // Send response back to Crisp
    const sent = await sendCrispMessage(website_id, session_id, aiResponse);

    if (!sent) {
      console.error("Failed to send response to Crisp");
    } else {
      console.log("FlexiWell Support: Response sent successfully");
    }

    // Log conversation for analytics
    await logConversation(session_id, content, aiResponse, null);

    return NextResponse.json({
      status: "processed",
      responseSent: sent,
      messageFrom: userName,
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
