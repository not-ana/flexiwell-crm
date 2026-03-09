import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  timestamp: Date;
}

interface SupportConversation {
  _id?: ObjectId;
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// POST - Send reply as admin (Ana Julia)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only allow super admin (Ana Julia) to reply
  const { user, error } = requireRole(req, ["admin"]);
  if (error) return error;

  // Check if user is Ana Julia (by email)
  const allowedEmails = ["anajulia@flexiwell.net", "ana@flexiwell.net", "admin@flexiwell.net"];
  if (!allowedEmails.includes(user!.email?.toLowerCase() || "")) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection<SupportConversation>("supportConversations");

    // Find conversation
    let conversation: SupportConversation | null = null;

    // Try to find by ObjectId first
    if (ObjectId.isValid(id)) {
      conversation = await collection.findOne({ _id: new ObjectId(id) });
    }

    // If not found, try by odooClientId
    if (!conversation) {
      conversation = await collection.findOne({ odooClientId: id });
    }

    // If not found, try by odooClientId string
    if (!conversation) {
      conversation = await collection.findOne({ odooClientId: parseInt(id) });
    }

    // If not found, try by odooClientId string
    if (!conversation) {
      conversation = await collection.findOne({ odooClientId: id });
    }

    // If still not found, try by odooClientId string
    if (!conversation) {
      conversation = await collection.findOne({ odooClientId: id.toString() });
    }

    // Try userId as fallback
    if (!conversation) {
      conversation = await collection.findOne({ userId: id });
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create admin message
    const adminMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "admin",
      content: message,
      timestamp: new Date(),
    };

    // Add message to conversation
    const updatedMessages = [...conversation.messages, adminMessage];

    // Update in database
    await collection.updateOne(
      { _id: conversation._id },
      {
        $set: {
          messages: updatedMessages,
          updatedAt: new Date(),
        },
      }
    );

    // Return updated conversation
    const updated = await collection.findOne({ _id: conversation._id });

    return NextResponse.json({
      success: true,
      conversation: {
        ...updated,
        _id: updated?._id?.toString(),
      },
    });
  } catch (err) {
    console.error("Error sending reply:", err);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
