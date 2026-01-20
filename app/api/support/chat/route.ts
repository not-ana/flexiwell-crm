import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { flexiwellSupportConfig, findQuickReply, shouldEscalateToHuman } from "@/lib/config/flexiwell-support";
import { callAI, getAIProviderInfo, type AIMessage } from "@/lib/ai/providers";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SupportConversation {
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// POST - Send message and get AI response
export async function POST(req: NextRequest) {
  const { user, error } = requireRole(req, ["admin", "client", "teacher"]);
  if (error) return error;

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<SupportConversation>("supportConversations");

    // Get conversation history for this user
    const existingConversation = await collection.findOne({ userId: user!.userId });
    const conversationMessages: ChatMessage[] = existingConversation?.messages || [];

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    conversationMessages.push(userMessage);

    // Generate AI response
    let aiResponseContent: string;

    // Check for quick reply first
    const quickReply = findQuickReply(message);
    if (quickReply) {
      aiResponseContent = quickReply;
    } else if (shouldEscalateToHuman(message)) {
      // Check if should escalate
      aiResponseContent = `I understand you need additional help. I'll connect you with our support team.

In the meantime, you can also:
- Send an email to: support@flexiwell.net
- Check our help documentation

A member of our team will get back to you soon!`;
    } else {
      // Check if AI is configured
      const providerInfo = getAIProviderInfo();
      if (!providerInfo.configured) {
        aiResponseContent = `Hello! I'm the FlexiWell assistant. I'm currently running with limited capacity.

I can help with questions about:
- How to register clients
- How to create classes
- Waitlist management
- Payments
- Reports

Type your question or contact us: support@flexiwell.net`;
      } else {
        // Build messages for AI with conversation history
        const historyMessages: AIMessage[] = conversationMessages
          .slice(-10) // Keep last 10 messages for context
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const messages: AIMessage[] = [
          { role: "system", content: flexiwellSupportConfig.systemPrompt },
          ...historyMessages,
        ];

        // Call AI
        const response = await callAI(messages);
        aiResponseContent = response.content;
      }
    }

    // Add AI response
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: aiResponseContent,
      timestamp: new Date(),
    };

    conversationMessages.push(aiMessage);

    // Save conversation (keep last 50 messages)
    const messagesToSave = conversationMessages.slice(-50);

    await collection.updateOne(
      { userId: user!.userId },
      {
        $set: {
          userName: user!.name || "Admin",
          userEmail: user!.email || "",
          messages: messagesToSave,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      message: aiMessage,
      conversationId: user!.userId,
    });
  } catch (err) {
    console.error("Support chat error:", err);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// GET - Get conversation history
export async function GET(req: NextRequest) {
  const { user, error } = requireRole(req, ["admin", "client", "teacher"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const collection = db.collection<SupportConversation>("supportConversations");

    const conversation = await collection.findOne({ userId: user!.userId });

    return NextResponse.json({
      messages: conversation?.messages || [],
      userName: user!.name,
    });
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}

// DELETE - Clear conversation history
export async function DELETE(req: NextRequest) {
  const { user, error } = requireRole(req, ["admin", "client", "teacher"]);
  if (error) return error;

  try {
    const db = await getDatabase();
    const collection = db.collection<SupportConversation>("supportConversations");

    await collection.updateOne(
      { userId: user!.userId },
      {
        $set: {
          messages: [],
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error clearing conversation:", err);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
