import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthFromCookie } from "@/lib/auth/middleware";

interface SupportMessage {
  _id?: ObjectId;
  conversationId: string;
  clientId: string;
  content: string;
  sender: "user" | "support";
  timestamp: Date;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
  isRead?: boolean;
}

// GET - Fetch support messages
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDatabase();

    // Get client's conversation
    const conversation = await db.collection("supportConversations").findOne({
      clientId: user.userId,
    });

    let messages: SupportMessage[] = [];

    if (conversation) {
      // Get messages for this conversation
      const dbMessages = await db.collection<SupportMessage>("supportMessages")
        .find({ conversationId: conversation._id?.toString() })
        .sort({ timestamp: 1 })
        .limit(50)
        .toArray();

      messages = dbMessages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp,
      }));
    }

    // Get studio info (default for now)
    const studioName = process.env.STUDIO_NAME || "FlexiWell";

    // Format messages for frontend
    const formattedMessages = messages.map((msg) => ({
      id: msg._id?.toString() || String(Date.now()),
      content: msg.content,
      sender: msg.sender,
      timestamp: formatTimestamp(new Date(msg.timestamp)),
      type: msg.type,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      isRead: msg.isRead,
    }));

    // If no messages, add welcome message
    if (formattedMessages.length === 0) {
      formattedMessages.push({
        id: "welcome",
        content: `Ola! Bem-vindo ao suporte ${studioName}. Como podemos ajuda-lo hoje?`,
        sender: "support" as const,
        timestamp: "Agora",
        type: "text" as const,
        fileName: undefined,
        fileSize: undefined,
        isRead: true,
      });
    }

    return NextResponse.json({
      studio: {
        name: studioName,
        initials: studioName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      },
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Support API error:", error);
    return NextResponse.json(
      { error: "Failed to load support data" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuthFromCookie();
    if (error) return error;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { content, type = "text", fileName, fileSize } = body;

    if (!content && type === "text") {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();

    // Get or create conversation
    let conversation = await db.collection("supportConversations").findOne({
      clientId: user.userId,
    });

    if (!conversation) {
      const result = await db.collection("supportConversations").insertOne({
        clientId: user.userId,
        clientEmail: user.email,
        status: "open",
        createdAt: now,
        updatedAt: now,
      });
      conversation = { _id: result.insertedId };
    }

    // Create message
    const message: SupportMessage = {
      conversationId: conversation._id.toString(),
      clientId: user.userId,
      content,
      sender: "user",
      timestamp: now,
      type,
      fileName,
      fileSize,
      isRead: false,
    };

    const result = await db.collection<SupportMessage>("supportMessages").insertOne(message);

    // Update conversation timestamp
    await db.collection("supportConversations").updateOne(
      { _id: conversation._id },
      { $set: { updatedAt: now } }
    );

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        content,
        sender: "user",
        timestamp: "Agora",
        type,
        fileName,
        fileSize,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atras`;

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
